#!/usr/bin/env python3

import requests
import json
import sys
import os
from datetime import datetime
import subprocess
import time

class DollarFlowAPITester:
    def __init__(self, base_url="https://shield-earnings-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.session_token and not headers:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint,
                    "response": response.text[:500]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def create_test_user_and_session(self):
        """Create a test user and session in MongoDB"""
        self.log("🔧 Creating test user and session in MongoDB...")
        
        timestamp = int(datetime.now().timestamp())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        email = f"test.user.{timestamp}@example.com"
        
        mongo_script = f"""
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
var email = '{email}';
db.users.insertOne({{
  user_id: userId,
  email: email,
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  country: 'US',
  currency: 'USD',
  use_case: 'testing',
  onboarded: true,
  inflation_shield: false,
  shield_percentage: 100,
  created_at: new Date().toISOString()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
}});
print('SUCCESS: User and session created');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                 capture_output=True, text=True, timeout=30)
            if result.returncode == 0 and 'SUCCESS' in result.stdout:
                self.user_id = user_id
                self.session_token = session_token
                self.log(f"✅ Test user created - ID: {user_id}")
                self.log(f"✅ Session token: {session_token}")
                return True
            else:
                self.log(f"❌ Failed to create test user: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ MongoDB operation failed: {str(e)}")
            return False

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        self.log("\n=== TESTING PUBLIC ENDPOINTS ===")
        
        # Test spots endpoint
        success, data = self.run_test("Get Spots", "GET", "spots", 200)
        if success and isinstance(data, list):
            spot_count = len(data)
            self.log(f"   📍 Found {spot_count} spots")
            if spot_count >= 25:
                self.log(f"   ✅ Expected 25+ spots, got {spot_count}")
            else:
                self.log(f"   ⚠️  Expected 25+ spots, got {spot_count}")

        # Test currencies endpoint
        success, data = self.run_test("Get Currencies", "GET", "currencies", 200)
        if success and isinstance(data, dict):
            currency_count = len(data)
            self.log(f"   💱 Found {currency_count} currencies")
            expected_currencies = ['PHP', 'NGN', 'ARS', 'KES', 'INR']
            for curr in expected_currencies:
                if curr in data:
                    self.log(f"   ✅ Found {curr}: {data[curr]['name']}")
                else:
                    self.log(f"   ❌ Missing currency: {curr}")

        # Test currency history endpoint
        self.run_test("Get ARS History", "GET", "currencies/history/ARS", 200)

    def test_auth_endpoints(self):
        """Test authentication-related endpoints"""
        self.log("\n=== TESTING AUTH ENDPOINTS ===")
        
        # Test /auth/me without session (should fail)
        self.run_test("Get Me (No Auth)", "GET", "auth/me", 401, headers={})
        
        # Test /auth/me with session (should work)
        if self.session_token:
            success, user_data = self.run_test("Get Me (With Auth)", "GET", "auth/me", 200)
            if success and isinstance(user_data, dict):
                self.log(f"   👤 User: {user_data.get('name', 'Unknown')}")
                self.log(f"   📧 Email: {user_data.get('email', 'Unknown')}")

    def test_protected_endpoints(self):
        """Test endpoints that require authentication"""
        self.log("\n=== TESTING PROTECTED ENDPOINTS ===")
        
        if not self.session_token:
            self.log("❌ No session token available, skipping protected endpoint tests")
            return

        # Dashboard
        success, dashboard = self.run_test("Get Dashboard", "GET", "dashboard", 200)
        initial_balance = 0
        if success and isinstance(dashboard, dict):
            initial_balance = dashboard.get('balance', 0)
            self.log(f"   💰 Balance: ${initial_balance}")
            self.log(f"   🏦 Local Balance: {dashboard.get('balance_local', 'Unknown')} {dashboard.get('local_currency', '')}")

        # Transactions
        success, txs = self.run_test("Get Transactions", "GET", "transactions", 200)
        if success and isinstance(txs, list):
            self.log(f"   💸 Found {len(txs)} transactions")

        # Family Vault
        success, vault_data = self.run_test("Get Family Vault", "GET", "family-vault", 200)
        if success and isinstance(vault_data, dict):
            vault = vault_data.get('vault')
            members = vault_data.get('members', [])
            if vault:
                self.log(f"   👪 Vault: {vault.get('name', 'Unknown')} - Balance: ${vault.get('total_balance', 0)}")
            self.log(f"   👥 Family Members: {len(members)}")

        # Analytics
        success, analytics = self.run_test("Get Analytics", "GET", "analytics", 200)
        if success and isinstance(analytics, dict):
            self.log(f"   📊 Total Sent: ${analytics.get('total_sent', 0)}")
            self.log(f"   📈 Fee Savings vs WU: ${analytics.get('fee_savings', {}).get('vs_western_union', 0)}")

        # Inflation Shield
        success, shield = self.run_test("Get Inflation Shield", "GET", "inflation-shield", 200)
        if success and isinstance(shield, dict):
            self.log(f"   🛡️  Shield Enabled: {shield.get('enabled', False)}")
            self.log(f"   💵 Money Saved: ${shield.get('money_saved', 0)}")
            
        return initial_balance

    def test_create_transaction(self):
        """Test creating a new transaction"""
        self.log("\n=== TESTING TRANSACTION CREATION ===")
        
        if not self.session_token:
            self.log("❌ No session token available, skipping transaction creation")
            return

        transaction_data = {
            "type": "send",
            "amount": 100.50,
            "recipient_name": "Test Recipient",
            "recipient_address": "0x1234567890abcdef",
            "category": "testing",
            "note": "Test transaction from API testing"
        }
        
        success, tx = self.run_test("Create Transaction", "POST", "transactions", 200, transaction_data)
        if success and isinstance(tx, dict):
            self.log(f"   💸 Created transaction: {tx.get('id', 'Unknown')}")
            self.log(f"   💰 Amount: ${tx.get('amount', 0)} to {tx.get('recipient_name', 'Unknown')}")

    def test_chat_endpoint(self):
        """Test chat-to-pay endpoint"""
        self.log("\n=== TESTING CHAT-TO-PAY ===")
        
        if not self.session_token:
            self.log("❌ No session token available, skipping chat test")
            return

        chat_message = {
            "message": "What's my balance?"
        }
        
        # Chat API can be slow due to LLM processing
        self.log("   ⏳ Testing chat (may take 5-10 seconds)...")
        success, response = self.run_test("Chat to Pay", "POST", "chat", 200, chat_message)
        if success and isinstance(response, dict):
            message = response.get('message', '')
            action = response.get('action')
            self.log(f"   💬 Chat Response: {message[:100]}...")
            if action:
                self.log(f"   🎯 Action Detected: {action}")

    def test_endpoints_without_auth(self):
        """Test that protected endpoints return 401 without auth"""
        self.log("\n=== TESTING UNAUTHORIZED ACCESS ===")
        
        protected_endpoints = [
            ("dashboard", "GET"),
            ("transactions", "GET"),
            ("family-vault", "GET"),
            ("analytics", "GET"),
            ("inflation-shield", "GET")
        ]
        
        for endpoint, method in protected_endpoints:
            self.run_test(f"{endpoint.title()} (No Auth)", method, endpoint, 401, headers={})

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        if not self.user_id:
            return
            
        self.log(f"\n🧹 Cleaning up test data for user: {self.user_id}")
        
        cleanup_script = f"""
use('test_database');
var userId = '{self.user_id}';
db.users.deleteMany({{user_id: userId}});
db.user_sessions.deleteMany({{user_id: userId}});
db.transactions.deleteMany({{user_id: userId}});
db.family_vaults.deleteMany({{user_id: userId}});
db.family_members.deleteMany({{user_id: userId}});
db.chat_messages.deleteMany({{user_id: userId}});
print('CLEANUP: Test data removed');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', cleanup_script], 
                                 capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.log("✅ Test data cleaned up successfully")
            else:
                self.log(f"⚠️  Cleanup warning: {result.stderr}")
        except Exception as e:
            self.log(f"⚠️  Cleanup error: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        self.log(f"\n{'='*50}")
        self.log(f"🏁 TEST SUMMARY")
        self.log(f"{'='*50}")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            self.log(f"\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                self.log(f"{i}. {test.get('test', 'Unknown')} - {test.get('endpoint', '')}")
                if 'expected' in test:
                    self.log(f"   Expected: {test['expected']}, Got: {test['actual']}")
                if 'error' in test:
                    self.log(f"   Error: {test['error']}")
                
        return self.tests_passed == self.tests_run

def main():
    tester = DollarFlowAPITester()
    
    try:
        # Step 1: Test public endpoints first
        tester.test_public_endpoints()
        
        # Step 2: Test unauthorized access to protected endpoints
        tester.test_endpoints_without_auth()
        
        # Step 3: Create test user and session
        if not tester.create_test_user_and_session():
            tester.log("❌ Could not create test user, skipping authenticated tests")
            return 1
            
        # Wait for MongoDB to propagate the changes
        time.sleep(2)
        
        # Step 4: Test auth endpoints
        tester.test_auth_endpoints()
        
        # Step 5: Test protected endpoints with auth
        tester.test_protected_endpoints()
        
        # Step 6: Test transaction creation
        tester.test_create_transaction()
        
        # Step 7: Test chat endpoint (might be slow)
        tester.test_chat_endpoint()
        
    finally:
        # Always clean up test data
        tester.cleanup_test_data()
        
        # Print summary
        success = tester.print_summary()
        return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)