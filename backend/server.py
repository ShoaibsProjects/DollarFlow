from fastapi import FastAPI, APIRouter, Request, Response, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random
import json
import re
import hashlib
import html
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Claude integration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()

# ==================== SECURITY: RATE LIMITING ====================
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later."})

# ==================== SECURITY: HEADERS MIDDLEWARE ====================
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

api_router = APIRouter(prefix="/api")

# ==================== SECURITY: INPUT VALIDATION MODELS ====================

MAX_AMOUNT = 50000.0
MIN_AMOUNT = 0.01
MAX_STRING = 200
MAX_CHAT_MSG = 500  # Limit chat messages to save LLM credits

def sanitize_string(value: str, max_len: int = MAX_STRING) -> str:
    """Strip HTML tags, trim whitespace, limit length."""
    cleaned = html.escape(value.strip())
    return cleaned[:max_len]

def validate_amount(value: float) -> float:
    if value < MIN_AMOUNT:
        raise ValueError(f"Amount must be at least ${MIN_AMOUNT}")
    if value > MAX_AMOUNT:
        raise ValueError(f"Amount cannot exceed ${MAX_AMOUNT}")
    return round(value, 2)

class TransactionRequest(BaseModel):
    type: str = Field(default="send", pattern="^(send|receive|convert)$")
    amount: float = Field(gt=0, le=MAX_AMOUNT)
    recipient_name: Optional[str] = Field(default=None, max_length=MAX_STRING)
    recipient_address: Optional[str] = Field(default=None, max_length=100)
    category: Optional[str] = Field(default="general", max_length=50)
    note: Optional[str] = Field(default=None, max_length=MAX_STRING)
    pin: Optional[str] = Field(default=None, max_length=6)

    @field_validator('amount')
    @classmethod
    def check_amount(cls, v):
        return validate_amount(v)

class FamilyMemberRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    relationship: Optional[str] = Field(default="Family", max_length=50)
    avatar_color: Optional[str] = Field(default="#4ECDC4", max_length=10)
    monthly_allocation: float = Field(default=100, ge=0, le=MAX_AMOUNT)

class FamilySendRequest(BaseModel):
    amount: float = Field(gt=0, le=MAX_AMOUNT)
    pin: Optional[str] = Field(default=None, max_length=6)

    @field_validator('amount')
    @classmethod
    def check_amount(cls, v):
        return validate_amount(v)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_CHAT_MSG)

class SettingsRequest(BaseModel):
    country: Optional[str] = Field(default=None, max_length=50)
    currency: Optional[str] = Field(default=None, pattern="^[A-Z]{3}$")
    use_case: Optional[str] = Field(default=None, max_length=100)
    inflation_shield: Optional[bool] = None
    shield_percentage: Optional[int] = Field(default=None, ge=10, le=100)

class PinRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=6, pattern="^[0-9]+$")

def hash_pin(pin: str) -> str:
    """Hash PIN with SHA-256 for secure storage."""
    return hashlib.sha256(pin.encode()).hexdigest()

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = "USD"
    use_case: Optional[str] = None
    onboarded: bool = False
    inflation_shield: bool = False
    shield_percentage: int = 100
    created_at: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str  # send, receive, convert
    amount: float
    currency: str = "USDC"
    recipient_name: Optional[str] = None
    recipient_address: Optional[str] = None
    category: Optional[str] = None
    status: str = "completed"
    fee: float = 0.03
    timestamp: str
    note: Optional[str] = None

class FamilyMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vault_id: str
    user_id: str
    name: str
    relationship: str
    avatar_color: str
    monthly_allocation: float
    current_balance: float
    visibility_enabled: bool = True

class FamilyVault(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    total_balance: float
    members: List[Dict] = []
    created_at: str

class SpotAgent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    city: str
    country: str
    lat: float
    lng: float
    currencies: List[str]
    rating: float
    hours: str
    exchange_rate: float
    is_open: bool = True

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    role: str  # user, assistant
    content: str
    action: Optional[Dict] = None
    timestamp: str

# ==================== AUTH ====================

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@api_router.post("/auth/session")
@limiter.limit("10/minute")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    data = resp.json()
    email = data["email"]
    name = data["name"]
    picture = data.get("picture", "")
    session_token = data["session_token"]
    
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "country": None,
            "currency": "USD",
            "use_case": None,
            "onboarded": False,
            "inflation_shield": False,
            "shield_percentage": 100,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await seed_user_data(user_id)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

@api_router.put("/auth/onboard")
async def onboard_user(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    update = {}
    if "country" in body:
        update["country"] = body["country"]
    if "currency" in body:
        update["currency"] = body["currency"]
    if "use_case" in body:
        update["use_case"] = body["use_case"]
    update["onboarded"] = True
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ==================== MOCK DATA SEEDER ====================

async def seed_user_data(user_id: str):
    """Seed mock transactions and family vault for new users"""
    now = datetime.now(timezone.utc)
    categories = ["groceries", "school", "bills", "medicine", "savings", "transport", "food", "entertainment"]
    recipients = ["Maria Santos", "Carlos Reyes", "Ana Gutierrez", "James Okafor", "Priya Sharma",
                  "Sofia Martinez", "David Chen", "Grace Obi", "Raj Patel", "Elena Torres"]
    
    transactions = []
    for i in range(20):
        days_ago = random.randint(0, 29)
        tx_type = random.choice(["send", "send", "receive", "convert"])
        amount = round(random.uniform(5, 500), 2)
        transactions.append({
            "id": f"tx_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": tx_type,
            "amount": amount,
            "currency": "USDC",
            "recipient_name": random.choice(recipients) if tx_type == "send" else None,
            "recipient_address": f"0x{uuid.uuid4().hex[:40]}",
            "category": random.choice(categories),
            "status": "completed",
            "fee": round(random.uniform(0.01, 0.05), 2),
            "timestamp": (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat(),
            "note": None
        })
    
    if transactions:
        await db.transactions.insert_many(transactions)
    
    vault_id = f"vault_{uuid.uuid4().hex[:12]}"
    members_data = [
        {"name": "Maria", "relationship": "Mom", "color": "#FF6B9D", "allocation": 200, "balance": 145.50},
        {"name": "Carlos", "relationship": "Brother", "color": "#4ECDC4", "allocation": 150, "balance": 82.00},
        {"name": "Ana", "relationship": "Sister", "color": "#FFE66D", "allocation": 100, "balance": 67.25},
        {"name": "Papa", "relationship": "Dad", "color": "#A8E6CF", "allocation": 175, "balance": 120.00},
        {"name": "Sofia", "relationship": "Daughter", "color": "#DDA0DD", "allocation": 75, "balance": 55.00},
    ]
    
    members = []
    for m in members_data:
        members.append({
            "id": f"member_{uuid.uuid4().hex[:12]}",
            "vault_id": vault_id,
            "user_id": user_id,
            "name": m["name"],
            "relationship": m["relationship"],
            "avatar_color": m["color"],
            "monthly_allocation": m["allocation"],
            "current_balance": m["balance"],
            "visibility_enabled": True
        })
    
    vault = {
        "id": vault_id,
        "user_id": user_id,
        "name": "Santos Family Vault",
        "total_balance": sum(m["current_balance"] for m in members),
        "created_at": now.isoformat()
    }
    
    await db.family_vaults.insert_one(vault)
    if members:
        await db.family_members.insert_many(members)

# ==================== TRANSACTIONS ====================

@api_router.get("/transactions")
async def get_transactions(request: Request):
    user = await get_current_user(request)
    txs = await db.transactions.find({"user_id": user["user_id"]}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return txs

@api_router.post("/transactions")
@limiter.limit("30/minute")
async def create_transaction(request: Request):
    user = await get_current_user(request)
    body = await request.json()

    # Validate input with Pydantic model
    try:
        tx_req = TransactionRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Verify transaction PIN if user has one set
    user_pin = user.get("transaction_pin")
    if user_pin and tx_req.type == "send":
        if not tx_req.pin:
            raise HTTPException(status_code=403, detail="Transaction PIN required")
        if hash_pin(tx_req.pin) != user_pin:
            raise HTTPException(status_code=403, detail="Incorrect PIN")

    tx = {
        "id": f"tx_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "type": tx_req.type,
        "amount": tx_req.amount,
        "currency": "USDC",
        "recipient_name": sanitize_string(tx_req.recipient_name) if tx_req.recipient_name else None,
        "recipient_address": tx_req.recipient_address,
        "category": tx_req.category or "general",
        "status": "completed",
        "fee": 0.03,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": sanitize_string(tx_req.note) if tx_req.note else None
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)

    # If sending to a family member, update their balance (use exact match, not regex)
    recipient_name = tx_req.recipient_name or ""
    if recipient_name and tx["type"] == "send":
        vault = await db.family_vaults.find_one({"user_id": user["user_id"]}, {"_id": 0})
        if vault:
            member = await db.family_members.find_one(
                {"vault_id": vault["id"], "name": recipient_name.strip()},
                {"_id": 0}
            )
            if not member:
                # Case-insensitive fallback with safe regex (escape user input)
                safe_name = re.escape(recipient_name.strip())
                member = await db.family_members.find_one(
                    {"vault_id": vault["id"], "name": {"$regex": f"^{safe_name}$", "$options": "i"}},
                    {"_id": 0}
                )
            if member:
                new_balance = member["current_balance"] + body["amount"]
                await db.family_members.update_one(
                    {"id": member["id"]},
                    {"$set": {"current_balance": round(new_balance, 2)}}
                )
                # Update vault total_balance
                all_members = await db.family_members.find({"vault_id": vault["id"]}, {"_id": 0}).to_list(20)
                vault_total = sum(m["current_balance"] for m in all_members)
                # Re-read the updated member to get correct balance
                updated_member = await db.family_members.find_one({"id": member["id"]}, {"_id": 0})
                vault_total = sum(
                    (m["current_balance"] if m["id"] != member["id"] else updated_member["current_balance"])
                    for m in all_members
                )
                await db.family_vaults.update_one(
                    {"id": vault["id"]},
                    {"$set": {"total_balance": round(vault_total, 2)}}
                )

    return tx

# ==================== FAMILY VAULT ====================

@api_router.get("/family-vault")
async def get_family_vault(request: Request):
    user = await get_current_user(request)
    vault = await db.family_vaults.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not vault:
        return {"vault": None, "members": []}
    members = await db.family_members.find({"vault_id": vault["id"]}, {"_id": 0}).to_list(20)
    return {"vault": vault, "members": members}

@api_router.post("/family-vault/member")
@limiter.limit("10/minute")
async def add_family_member(request: Request):
    user = await get_current_user(request)
    body = await request.json()

    try:
        member_req = FamilyMemberRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
    vault = await db.family_vaults.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not vault:
        vault_id = f"vault_{uuid.uuid4().hex[:12]}"
        vault = {
            "id": vault_id, "user_id": user["user_id"],
            "name": f"{user['name']}'s Family Vault",
            "total_balance": 0, "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.family_vaults.insert_one(vault)
    
    member = {
        "id": f"member_{uuid.uuid4().hex[:12]}",
        "vault_id": vault["id"],
        "user_id": user["user_id"],
        "name": sanitize_string(member_req.name, 50),
        "relationship": sanitize_string(member_req.relationship or "Family", 50),
        "avatar_color": member_req.avatar_color or "#4ECDC4",
        "monthly_allocation": member_req.monthly_allocation,
        "current_balance": 0,
        "visibility_enabled": True
    }
    await db.family_members.insert_one(member)
    member.pop("_id", None)
    return member

@api_router.put("/family-vault/member/{member_id}")
async def update_family_member(member_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    update = {}
    for key in ["name", "monthly_allocation", "visibility_enabled", "relationship"]:
        if key in body:
            update[key] = body[key]
    await db.family_members.update_one(
        {"id": member_id, "user_id": user["user_id"]}, {"$set": update}
    )
    member = await db.family_members.find_one({"id": member_id}, {"_id": 0})
    return member

@api_router.post("/family-vault/send/{member_id}")
@limiter.limit("20/minute")
async def send_to_family_member(member_id: str, request: Request):
    """Send funds to a specific family member — updates their balance and creates a transaction."""
    user = await get_current_user(request)
    body = await request.json()

    # Validate input
    try:
        send_req = FamilySendRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Verify transaction PIN if user has one set
    user_pin = user.get("transaction_pin")
    if user_pin:
        if not send_req.pin:
            raise HTTPException(status_code=403, detail="Transaction PIN required")
        if hash_pin(send_req.pin) != user_pin:
            raise HTTPException(status_code=403, detail="Incorrect PIN")

    amount = send_req.amount

    member = await db.family_members.find_one(
        {"id": member_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    # Update member balance
    new_balance = round(member["current_balance"] + amount, 2)
    await db.family_members.update_one(
        {"id": member_id}, {"$set": {"current_balance": new_balance}}
    )

    # Update vault total
    vault = await db.family_vaults.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if vault:
        all_members = await db.family_members.find({"vault_id": vault["id"]}, {"_id": 0}).to_list(20)
        vault_total = sum(m["current_balance"] for m in all_members)
        await db.family_vaults.update_one(
            {"id": vault["id"]}, {"$set": {"total_balance": round(vault_total, 2)}}
        )

    # Create the transaction record
    tx = {
        "id": f"tx_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "type": "send",
        "amount": amount,
        "currency": "USDC",
        "recipient_name": member["name"],
        "recipient_address": None,
        "category": "family",
        "status": "completed",
        "fee": 0.03,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": f"Family Vault: sent to {member['name']} ({member['relationship']})"
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)

    updated_member = await db.family_members.find_one({"id": member_id}, {"_id": 0})
    return {"transaction": tx, "member": updated_member}

# ==================== SPOTS / AGENTS ====================

MOCK_SPOTS = [
    # Manila, Philippines
    {"id": "spot_1", "name": "JR Money Exchange", "city": "Manila", "country": "Philippines", "lat": 14.5995, "lng": 120.9842, "currencies": ["PHP", "USDC"], "rating": 4.8, "hours": "8AM-8PM", "exchange_rate": 56.20, "is_open": True},
    {"id": "spot_2", "name": "GlobePay Center", "city": "Manila", "country": "Philippines", "lat": 14.5547, "lng": 121.0244, "currencies": ["PHP", "USDC"], "rating": 4.5, "hours": "9AM-6PM", "exchange_rate": 56.15, "is_open": True},
    {"id": "spot_3", "name": "Makati Cash Hub", "city": "Manila", "country": "Philippines", "lat": 14.5548, "lng": 121.0198, "currencies": ["PHP", "USDC"], "rating": 4.9, "hours": "7AM-9PM", "exchange_rate": 56.25, "is_open": True},
    {"id": "spot_4", "name": "QuickPeso Express", "city": "Manila", "country": "Philippines", "lat": 14.5896, "lng": 120.9811, "currencies": ["PHP", "USDC"], "rating": 4.2, "hours": "8AM-7PM", "exchange_rate": 56.10, "is_open": True},
    {"id": "spot_5", "name": "Star Remittance", "city": "Manila", "country": "Philippines", "lat": 14.6091, "lng": 120.9899, "currencies": ["PHP", "USDC"], "rating": 4.6, "hours": "24/7", "exchange_rate": 56.30, "is_open": True},
    {"id": "spot_6", "name": "BGC Dollar Shop", "city": "Manila", "country": "Philippines", "lat": 14.5506, "lng": 121.0494, "currencies": ["PHP", "USDC"], "rating": 4.7, "hours": "8AM-10PM", "exchange_rate": 56.22, "is_open": True},
    {"id": "spot_7", "name": "Quezon Money Go", "city": "Manila", "country": "Philippines", "lat": 14.6488, "lng": 121.0509, "currencies": ["PHP", "USDC"], "rating": 4.3, "hours": "9AM-8PM", "exchange_rate": 56.18, "is_open": False},
    {"id": "spot_8", "name": "Pasig Pay Point", "city": "Manila", "country": "Philippines", "lat": 14.5764, "lng": 121.0851, "currencies": ["PHP", "USDC"], "rating": 4.4, "hours": "7AM-7PM", "exchange_rate": 56.12, "is_open": True},
    {"id": "spot_9", "name": "Tondo Exchange", "city": "Manila", "country": "Philippines", "lat": 14.6130, "lng": 120.9670, "currencies": ["PHP", "USDC"], "rating": 3.9, "hours": "8AM-6PM", "exchange_rate": 56.05, "is_open": True},
    {"id": "spot_10", "name": "Manila Bay Cash", "city": "Manila", "country": "Philippines", "lat": 14.5832, "lng": 120.9797, "currencies": ["PHP", "USDC"], "rating": 4.1, "hours": "9AM-9PM", "exchange_rate": 56.28, "is_open": True},
    # Lagos, Nigeria
    {"id": "spot_11", "name": "Naira Express Hub", "city": "Lagos", "country": "Nigeria", "lat": 6.5244, "lng": 3.3792, "currencies": ["NGN", "USDC"], "rating": 4.7, "hours": "8AM-8PM", "exchange_rate": 1580.50, "is_open": True},
    {"id": "spot_12", "name": "VI Money Point", "city": "Lagos", "country": "Nigeria", "lat": 6.4281, "lng": 3.4219, "currencies": ["NGN", "USDC"], "rating": 4.5, "hours": "9AM-7PM", "exchange_rate": 1575.00, "is_open": True},
    {"id": "spot_13", "name": "Lekki Dollar Spot", "city": "Lagos", "country": "Nigeria", "lat": 6.4698, "lng": 3.5852, "currencies": ["NGN", "USDC"], "rating": 4.8, "hours": "7AM-9PM", "exchange_rate": 1582.00, "is_open": True},
    {"id": "spot_14", "name": "Ikeja Cash Center", "city": "Lagos", "country": "Nigeria", "lat": 6.6018, "lng": 3.3515, "currencies": ["NGN", "USDC"], "rating": 4.3, "hours": "8AM-6PM", "exchange_rate": 1570.00, "is_open": True},
    {"id": "spot_15", "name": "Surulere Exchange", "city": "Lagos", "country": "Nigeria", "lat": 6.5000, "lng": 3.3500, "currencies": ["NGN", "USDC"], "rating": 4.1, "hours": "9AM-8PM", "exchange_rate": 1578.00, "is_open": False},
    {"id": "spot_16", "name": "Yaba Money Go", "city": "Lagos", "country": "Nigeria", "lat": 6.5103, "lng": 3.3774, "currencies": ["NGN", "USDC"], "rating": 4.6, "hours": "24/7", "exchange_rate": 1585.00, "is_open": True},
    {"id": "spot_17", "name": "Ajah Dollar Shop", "city": "Lagos", "country": "Nigeria", "lat": 6.4650, "lng": 3.5700, "currencies": ["NGN", "USDC"], "rating": 4.4, "hours": "8AM-7PM", "exchange_rate": 1576.50, "is_open": True},
    {"id": "spot_18", "name": "Maryland Pay Hub", "city": "Lagos", "country": "Nigeria", "lat": 6.5700, "lng": 3.3650, "currencies": ["NGN", "USDC"], "rating": 3.8, "hours": "9AM-6PM", "exchange_rate": 1568.00, "is_open": True},
    # Buenos Aires, Argentina
    {"id": "spot_19", "name": "Cambio Palermo", "city": "Buenos Aires", "country": "Argentina", "lat": -34.5870, "lng": -58.4300, "currencies": ["ARS", "USDC"], "rating": 4.9, "hours": "9AM-7PM", "exchange_rate": 1250.00, "is_open": True},
    {"id": "spot_20", "name": "Dollar Blue Express", "city": "Buenos Aires", "country": "Argentina", "lat": -34.6037, "lng": -58.3816, "currencies": ["ARS", "USDC"], "rating": 4.7, "hours": "10AM-8PM", "exchange_rate": 1245.00, "is_open": True},
    {"id": "spot_21", "name": "Recoleta Money Hub", "city": "Buenos Aires", "country": "Argentina", "lat": -34.5875, "lng": -58.3935, "currencies": ["ARS", "USDC"], "rating": 4.6, "hours": "8AM-6PM", "exchange_rate": 1252.00, "is_open": True},
    {"id": "spot_22", "name": "San Telmo Exchange", "city": "Buenos Aires", "country": "Argentina", "lat": -34.6212, "lng": -58.3733, "currencies": ["ARS", "USDC"], "rating": 4.4, "hours": "9AM-9PM", "exchange_rate": 1248.00, "is_open": True},
    {"id": "spot_23", "name": "Belgrano Cash Point", "city": "Buenos Aires", "country": "Argentina", "lat": -34.5623, "lng": -58.4564, "currencies": ["ARS", "USDC"], "rating": 4.5, "hours": "8AM-7PM", "exchange_rate": 1255.00, "is_open": False},
    {"id": "spot_24", "name": "Microcentro Cambio", "city": "Buenos Aires", "country": "Argentina", "lat": -34.6067, "lng": -58.3766, "currencies": ["ARS", "USDC"], "rating": 4.8, "hours": "24/7", "exchange_rate": 1260.00, "is_open": True},
    {"id": "spot_25", "name": "Caballito Dollar", "city": "Buenos Aires", "country": "Argentina", "lat": -34.6189, "lng": -58.4375, "currencies": ["ARS", "USDC"], "rating": 4.2, "hours": "9AM-6PM", "exchange_rate": 1242.00, "is_open": True},
]

@api_router.get("/spots")
async def get_spots(city: Optional[str] = None, currency: Optional[str] = None, open_now: Optional[bool] = None):
    spots = MOCK_SPOTS
    if city:
        spots = [s for s in spots if s["city"].lower() == city.lower()]
    if currency:
        spots = [s for s in spots if currency in s["currencies"]]
    if open_now:
        spots = [s for s in spots if s["is_open"]]
    return spots

# ==================== CURRENCIES & ANALYTICS ====================

CURRENCY_DATA = {
    "PHP": {"name": "Philippine Peso", "symbol": "₱", "rate": 56.20, "change_24h": -0.15, "flag": "🇵🇭"},
    "NGN": {"name": "Nigerian Naira", "symbol": "₦", "rate": 1580.50, "change_24h": -1.20, "flag": "🇳🇬"},
    "ARS": {"name": "Argentine Peso", "symbol": "$", "rate": 1250.00, "change_24h": -2.80, "flag": "🇦🇷"},
    "KES": {"name": "Kenyan Shilling", "symbol": "KSh", "rate": 152.30, "change_24h": -0.35, "flag": "🇰🇪"},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "rate": 83.45, "change_24h": 0.05, "flag": "🇮🇳"},
}

def generate_historical_rates(base_rate, months=12, volatility=0.02, trend=-0.01):
    """Generate realistic historical rate data"""
    rates = []
    rate = base_rate * (1 - trend * months)
    now = datetime.now(timezone.utc)
    for i in range(months * 30, -1, -1):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        change = random.gauss(trend / 30, volatility)
        rate *= (1 + change)
        rates.append({"date": date, "rate": round(rate, 2)})
    return rates

@api_router.get("/currencies")
async def get_currencies():
    return CURRENCY_DATA

@api_router.get("/currencies/history/{currency}")
async def get_currency_history(currency: str):
    if currency not in CURRENCY_DATA:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    base = CURRENCY_DATA[currency]["rate"]
    if currency == "ARS":
        return generate_historical_rates(base, 12, 0.03, -0.04)
    elif currency == "NGN":
        return generate_historical_rates(base, 12, 0.02, -0.02)
    else:
        return generate_historical_rates(base, 12, 0.01, -0.005)

@api_router.get("/analytics")
async def get_analytics(request: Request):
    user = await get_current_user(request)
    txs = await db.transactions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    
    total_sent = sum(t["amount"] for t in txs if t["type"] == "send")
    total_received = sum(t["amount"] for t in txs if t["type"] == "receive")
    total_fees = sum(t.get("fee", 0.03) for t in txs if t["type"] == "send")
    
    # Fee savings compared to Western Union (avg 6.5% fee)
    wu_fees = total_sent * 0.065
    wise_fees = total_sent * 0.021
    our_fees = total_fees
    
    # Spending by category
    categories = {}
    for tx in txs:
        if tx["type"] == "send":
            cat = tx.get("category", "other")
            categories[cat] = categories.get(cat, 0) + tx["amount"]
    
    spending_by_category = [{"name": k, "value": round(v, 2)} for k, v in categories.items()]
    
    return {
        "total_sent": round(total_sent, 2),
        "total_received": round(total_received, 2),
        "total_transactions": len(txs),
        "total_fees_paid": round(our_fees, 2),
        "fee_savings": {
            "vs_western_union": round(wu_fees - our_fees, 2),
            "vs_wise": round(wise_fees - our_fees, 2),
            "vs_banks": round(total_sent * 0.08 - our_fees, 2)
        },
        "spending_by_category": spending_by_category,
        "monthly_volume": round(total_sent + total_received, 2),
    }

# ==================== INFLATION SHIELD ====================

@api_router.get("/inflation-shield")
async def get_inflation_shield(request: Request):
    user = await get_current_user(request)
    currency = user.get("currency", "USD")
    
    # Calculate simulated savings
    if currency in CURRENCY_DATA:
        rate_data = CURRENCY_DATA[currency]
        depreciation_6m = {
            "ARS": 47.2, "NGN": 18.5, "PHP": 3.2, "KES": 5.8, "INR": 1.5
        }.get(currency, 2.0)
    else:
        depreciation_6m = 2.0
    
    return {
        "enabled": user.get("inflation_shield", False),
        "shield_percentage": user.get("shield_percentage", 100),
        "currency": currency,
        "depreciation_6m": depreciation_6m,
        "usdc_loss_6m": 0.1,
        "money_saved": round(depreciation_6m * 5.2, 2),
        "historical_comparison": f"If you held {currency} for 6 months, you'd have lost {depreciation_6m}%. With DollarFlow Shield, you'd have lost 0.1%."
    }

@api_router.put("/inflation-shield")
async def update_inflation_shield(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    update = {}
    if "enabled" in body:
        update["inflation_shield"] = body["enabled"]
    if "shield_percentage" in body:
        update["shield_percentage"] = body["shield_percentage"]
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    return await get_inflation_shield(request)

# ==================== CHAT-TO-PAY ====================

@api_router.post("/chat")
@limiter.limit("15/minute")
async def chat_to_pay(request: Request):
    user = await get_current_user(request)
    body = await request.json()

    try:
        chat_req = ChatRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    user_message = sanitize_string(chat_req.message, MAX_CHAT_MSG)
    
    # Store user message
    user_msg = {
        "id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "role": "user",
        "content": user_message,
        "action": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg)
    
    # Get recent transactions for context
    recent_txs = await db.transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(10)
    
    # Get family members for context
    vault = await db.family_vaults.find_one({"user_id": user["user_id"]}, {"_id": 0})
    members = []
    if vault:
        members = await db.family_members.find({"vault_id": vault["id"]}, {"_id": 0}).to_list(20)
    
    member_names = [m["name"] for m in members]
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_prompt = f"""You are Flow, a friendly payment assistant for DollarFlow. You help users send money, check balances, and manage payments through natural conversation.

Current user: {user['name']}
Family members: {', '.join(member_names) if member_names else 'None set up yet'}
Recent transactions: {json.dumps(recent_txs[:5], default=str) if recent_txs else 'No recent transactions'}

When a user wants to send money, respond with a JSON action block embedded in your message like this:
If they say "send $50 to Mom", respond with something friendly and include:
[ACTION]{{"type":"send","amount":50,"recipient":"Maria","note":"From {user['name']}"}}[/ACTION]

If they want to split money, like "split $120 between Alex and Sarah":
[ACTION]{{"type":"split","total":120,"recipients":["Alex","Sarah"],"amounts":[60,60]}}[/ACTION]

If they ask about spending, give a brief summary based on recent transactions.
If they ask about balance, tell them to check their dashboard.

Keep responses SHORT (1-2 sentences max), friendly, and helpful. Use casual language. Never mention blockchain, USDC tokens, or crypto jargon. Say "dollars" not "USDC"."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chat_{user['user_id']}_{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        msg = UserMessage(text=user_message)
        response_text = await chat.send_message(msg)
        
    except Exception as e:
        logger.error(f"Chat LLM error: {e}")
        # Fallback: simple pattern matching
        response_text = parse_chat_fallback(user_message, user["name"], member_names)
    
    # Parse action from response
    action = None
    if "[ACTION]" in response_text and "[/ACTION]" in response_text:
        try:
            action_str = response_text.split("[ACTION]")[1].split("[/ACTION]")[0]
            action = json.loads(action_str)
            response_text = response_text.split("[ACTION]")[0].strip()
        except Exception:
            pass
    
    assistant_msg = {
        "id": f"msg_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "role": "assistant",
        "content": response_text,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(assistant_msg)
    
    return {"message": response_text, "action": action}

def parse_chat_fallback(message: str, user_name: str, member_names: list) -> str:
    """Simple fallback parser when LLM is unavailable"""
    msg = message.lower()
    if "send" in msg:
        import re
        amount_match = re.search(r'\$?(\d+(?:\.\d{2})?)', msg)
        amount = float(amount_match.group(1)) if amount_match else 50
        recipient = "someone"
        for name in member_names:
            if name.lower() in msg:
                recipient = name
                break
        return f"Got it! I'll send ${amount:.2f} to {recipient}. [ACTION]{{\"type\":\"send\",\"amount\":{amount},\"recipient\":\"{recipient}\"}}[/ACTION]"
    elif "balance" in msg or "how much" in msg:
        return "Check your balance on the dashboard - it's always up to date!"
    elif "split" in msg:
        return "I can help with that! Who would you like to split with and how much?"
    return "I'm Flow, your payment buddy! I can help you send money, check spending, or split bills. What would you like to do?"

@api_router.get("/chat/history")
async def get_chat_history(request: Request):
    user = await get_current_user(request)
    messages = await db.chat_messages.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    messages.reverse()
    return messages

# ==================== USER SETTINGS ====================

@api_router.put("/settings")
async def update_settings(request: Request):
    user = await get_current_user(request)
    body = await request.json()

    try:
        settings_req = SettingsRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    update = {}
    if settings_req.country is not None:
        update["country"] = sanitize_string(settings_req.country, 50)
    if settings_req.currency is not None:
        update["currency"] = settings_req.currency
    if settings_req.use_case is not None:
        update["use_case"] = sanitize_string(settings_req.use_case, 100)
    if settings_req.inflation_shield is not None:
        update["inflation_shield"] = settings_req.inflation_shield
    if settings_req.shield_percentage is not None:
        update["shield_percentage"] = settings_req.shield_percentage
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ==================== SECURITY: TRANSACTION PIN ====================

@api_router.post("/security/pin")
async def set_transaction_pin(request: Request):
    """Set or update the user's transaction PIN (4-6 digits)."""
    user = await get_current_user(request)
    body = await request.json()
    try:
        pin_req = PinRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    hashed = hash_pin(pin_req.pin)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"transaction_pin": hashed}}
    )
    return {"message": "Transaction PIN set successfully", "has_pin": True}

@api_router.get("/security/pin/status")
async def pin_status(request: Request):
    """Check if user has a transaction PIN set."""
    user = await get_current_user(request)
    return {"has_pin": bool(user.get("transaction_pin"))}

@api_router.delete("/security/pin")
async def remove_transaction_pin(request: Request):
    """Remove the transaction PIN (requires current PIN)."""
    user = await get_current_user(request)
    body = await request.json()
    current_pin = body.get("pin", "")
    if not user.get("transaction_pin"):
        raise HTTPException(status_code=400, detail="No PIN set")
    if hash_pin(current_pin) != user["transaction_pin"]:
        raise HTTPException(status_code=403, detail="Incorrect PIN")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$unset": {"transaction_pin": ""}}
    )
    return {"message": "Transaction PIN removed", "has_pin": False}

# ==================== SESSION SECURITY ====================

@api_router.post("/security/sessions/cleanup")
async def cleanup_expired_sessions(request: Request):
    """Purge expired sessions for the current user."""
    user = await get_current_user(request)
    now = datetime.now(timezone.utc).isoformat()
    result = await db.user_sessions.delete_many({
        "user_id": user["user_id"],
        "expires_at": {"$lt": now}
    })
    return {"purged": result.deleted_count}

@api_router.get("/dashboard")
async def get_dashboard(request: Request):
    user = await get_current_user(request)
    txs = await db.transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(10)
    
    # Compute balance from all transactions (deterministic)
    all_txs = await db.transactions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    received = sum(t["amount"] for t in all_txs if t["type"] == "receive")
    sent = sum(t["amount"] + t.get("fee", 0.03) for t in all_txs if t["type"] == "send")
    # Start with a base of 2500 USDC (initial deposit) and adjust with transactions
    base_balance = user.get("initial_balance", 2500.00)
    total_balance = round(base_balance + received - sent, 2)
    
    currency = user.get("currency", "USD")
    local_rate = CURRENCY_DATA.get(currency, {}).get("rate", 1)
    
    return {
        "balance": total_balance,
        "balance_local": round(total_balance * local_rate, 2),
        "local_currency": currency,
        "local_symbol": CURRENCY_DATA.get(currency, {}).get("symbol", "$"),
        "recent_transactions": txs,
        "inflation_shield_active": user.get("inflation_shield", False),
        "monthly_sent": round(sum(t["amount"] for t in txs if t["type"] == "send"), 2),
        "monthly_received": round(sum(t["amount"] for t in txs if t["type"] == "receive"), 2),
        "has_pin": bool(user.get("transaction_pin")),
    }

# ==================== LIVE FEE DATA ====================

# Cache to avoid hammering APIs on every page load
_fee_cache = {"data": None, "expires": 0}

@api_router.get("/fees/live")
async def get_live_fees(amount: float = 200, source: str = "USD", target: str = "PHP"):
    """Returns live fee comparison data: Wise (real API) + DollarFlow gas estimate."""
    import time
    now = time.time()

    # Return cache if fresh (60s TTL)
    if _fee_cache["data"] and now < _fee_cache["expires"]:
        return _fee_cache["data"]

    wise_fee = None
    wise_rate = None
    dollarflow_fee = 0.03  # fallback
    base_gas_gwei = None

    # 1) Wise fee quote (free public POST /v3/quotes endpoint, no key needed)
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            resp = await c.post(
                "https://api.wise.com/v3/quotes",
                json={
                    "sourceCurrency": source,
                    "targetCurrency": target,
                    "sourceAmount": amount,
                },
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code == 200:
                q = resp.json()
                # Fee is in paymentOptions → pick cheapest
                options = q.get("paymentOptions", [])
                if options:
                    cheapest = min(options, key=lambda o: o.get("fee", {}).get("total", 9999))
                    wise_fee = cheapest["fee"]["total"]
                    wise_rate = q.get("rate")
                elif "fee" in q:
                    wise_fee = q["fee"]
                    wise_rate = q.get("rate")
    except Exception as e:
        logger.info(f"Wise API unavailable: {e}")

    # 2) Base Sepolia gas price via public RPC
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            resp = await c.post(
                "https://sepolia.base.org",
                json={"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1},
            )
            if resp.status_code == 200:
                hex_gas = resp.json().get("result", "0x0")
                gas_wei = int(hex_gas, 16)
                base_gas_gwei = round(gas_wei / 1e9, 4)
                # ERC-20 transfer ≈ 65 000 gas units; ETH price ≈ $2 500
                eth_price_usd = 2500
                dollarflow_fee = round((65000 * gas_wei / 1e18) * eth_price_usd, 4)
                if dollarflow_fee < 0.01:
                    dollarflow_fee = 0.01  # realistic Base mainnet floor
    except Exception as e:
        logger.info(f"Base RPC unavailable: {e}")

    result = {
        "amount": amount,
        "source": source,
        "target": target,
        "services": [
            {
                "name": "Western Union",
                "fee": 14.00,
                "speed": "1-3 days",
                "rate_quality": "Bad",
                "live": False,
            },
            {
                "name": "Bank Wire",
                "fee": 35.00,
                "speed": "3-5 days",
                "rate_quality": "Poor",
                "live": False,
            },
            {
                "name": "Wise",
                "fee": round(wise_fee, 2) if wise_fee is not None else 4.20,
                "speed": "1-2 days",
                "rate_quality": "Good",
                "exchange_rate": wise_rate,
                "live": wise_fee is not None,
            },
            {
                "name": "DollarFlow",
                "fee": round(dollarflow_fee, 2),
                "speed": "~15 sec",
                "rate_quality": "Best",
                "live": base_gas_gwei is not None,
            },
        ],
        "base_gas_gwei": base_gas_gwei,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    _fee_cache["data"] = result
    _fee_cache["expires"] = now + 60  # cache 60s

    return result

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
