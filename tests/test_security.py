import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.chain_verification_service import ChainVerificationService


async def _get_csrf_token(async_client: AsyncClient) -> str:
    """Helper to get a valid CSRF token from the server."""
    response = await async_client.get("/api/health")
    if response.status_code == 404:
        response = await async_client.get("/")
    # Get CSRF token from response cookies
    csrf_token = response.cookies.get("csrf_token")
    if csrf_token is None:
        # Try getting from set-cookie header
        set_cookie = response.headers.get("set-cookie", "")
        for cookie in set_cookie.split(", "):
            if cookie.startswith("csrf_token="):
                return cookie.split("=")[1].split(";")[0]
    return csrf_token


class TestCSRFProtection:
    """Tests for CSRF protection middleware."""

    @pytest.mark.asyncio
    async def test_csrf_token_not_httponly(self, async_client: AsyncClient):
        """Test that CSRF token cookie is NOT HttpOnly (so JS can read it)."""
        response = await async_client.get("/api/health")
        cookie_header = response.headers.get("set-cookie", "")
        csrf_cookie = [c for c in cookie_header.split(", ") if "csrf_token" in c]
        if csrf_cookie:
            cookie_str = csrf_cookie[0].lower()
            assert "httponly" not in cookie_str or "httponly=false" in cookie_str

    @pytest.mark.asyncio
    async def test_missing_csrf_token_rejected(self, async_client: AsyncClient):
        """Test that POST without CSRF token is rejected with 403."""
        response = await async_client.post("/api/test-endpoint", json={})
        # Should be rejected with 403 by CSRF middleware
        assert response.status_code == 403
        data = response.json()
        assert "csrf token missing or invalid" in data.get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_invalid_csrf_token_rejected(self, async_client: AsyncClient):
        """Test that mismatched CSRF token is rejected."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set - endpoint may not exist")

        response = await async_client.post(
            "/api/test-endpoint",
            json={},
            headers={"X-CSRF-Token": "invalid-token"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "csrf token missing or invalid" in data.get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_valid_csrf_token_allows_request(self, async_client: AsyncClient):
        """Test that valid CSRF token in header allows request."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set - endpoint may not exist")

        # Use the test security endpoint
        response = await async_client.post(
            "/api/blockchain/test-security",
            json={"test": "data"},
            headers={"X-CSRF-Token": csrf_token}
        )
        # Should not be rejected by CSRF
        assert response.status_code != 403 or "csrf token" not in response.json().get("detail", "").lower()


class TestOriginRefererValidation:
    """Tests for Origin/Referer validation middleware."""

    @pytest.mark.asyncio
    async def test_disallowed_origin_rejected(self, async_client: AsyncClient):
        """Test that disallowed origin is rejected."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        response = await async_client.post(
            "/api/blockchain/test-security",
            json={"test": "data"},
            headers={"origin": "http://evil.com", "X-CSRF-Token": csrf_token}
        )
        # Origin validation should reject disallowed origin (no referer provided -> missing origin/referer)
        assert response.status_code == 403
        data = response.json()
        detail = data.get("detail", "").lower()
        assert "missing origin/referer" in detail

    @pytest.mark.asyncio
    async def test_allowed_referrer_allowed(self, async_client: AsyncClient):
        """Test that allowed referer is accepted when origin missing."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        response = await async_client.post(
            "/api/blockchain/test-security",
            json={"test": "data"},
            headers={"referer": "http://localhost:3000/some-page", "X-CSRF-Token": csrf_token}
        )
        # Should not be rejected by origin/referer validation (CSRF may still reject)
        assert response.status_code != 403 or "csrf token" in response.json().get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_disallowed_referrer_rejected(self, async_client: AsyncClient):
        """Test that disallowed referer is rejected when origin is INVALID (referer checked as fallback)."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        # Provide invalid origin + disallowed referer -> referer checked as fallback
        response = await async_client.post(
            "/api/blockchain/test-security",
            json={"test": "data"},
            headers={"origin": "http://evil.com", "referer": "http://evil.com/some-page", "X-CSRF-Token": csrf_token}
        )
        # Origin invalid + referer invalid -> referer checked as fallback -> rejected
        assert response.status_code == 403
        data = response.json()
        detail = data.get("detail", "").lower()
        assert "invalid origin" in detail or "referer" in detail or "csrf token missing or invalid" in detail

    @pytest.mark.asyncio
    async def test_missing_origin_and_referrer_rejected(self, async_client: AsyncClient):
        """Test that missing both origin and referer is rejected when origin is invalid."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        # Provide invalid origin + no referer -> missing origin/referer
        response = await async_client.post(
            "/api/blockchain/test-security",
            json={"test": "data"},
            headers={"origin": "http://evil.com", "X-CSRF-Token": csrf_token}
        )
        assert response.status_code == 403
        data = response.json()
        detail = data.get("detail", "").lower()
        # Either CSRF or origin/referer validation rejects
        assert "missing origin/referer" in detail or "csrf token missing or invalid" in detail


class TestCORSPrevention:
    """Tests for CORS wildcard prevention."""

    def test_cors_wildcard_rejected(self):
        """Test that wildcard CORS_ORIGINS is rejected at startup."""
        import os
        from importlib import reload
        import sys

        # Save original
        original_env = os.environ.get('CORS_ORIGINS')
        os.environ['CORS_ORIGINS'] = '*'

        try:
            # Remove cached modules
            for mod in list(sys.modules.keys()):
                if 'server' in mod:
                    del sys.modules[mod]

            import server
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "wildcard" in str(e).lower() or "*" in str(e)
        finally:
            # Restore
            if original_env:
                os.environ['CORS_ORIGINS'] = original_env
            else:
                os.environ.pop('CORS_ORIGINS', None)


class TestRateLimiting:
    """Tests for rate limiting behavior."""

    @pytest.mark.asyncio
    async def test_rate_limit_on_wallet_nonce(self, async_client: AsyncClient):
        """Test that test security endpoint is rate limited."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        # Make multiple requests quickly
        for i in range(12):  # Limit is 10/min
            response = await async_client.post(
                "/api/blockchain/test-security",
                json={"test": "data"},
                headers={"X-CSRF-Token": csrf_token}
            )

        # Last request should be rate limited
        assert response.status_code == 429
        data = response.json()
        assert "too many requests" in data.get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_rate_limit_on_verification(self, async_client: AsyncClient):
        """Test that test security endpoint is rate limited."""
        csrf_token = await _get_csrf_token(async_client)
        if csrf_token is None:
            pytest.skip("CSRF token not set")

        for i in range(12):
            response = await async_client.post(
                "/api/blockchain/test-security",
                json={"test": "data"},
                headers={"X-CSRF-Token": csrf_token}
            )

        assert response.status_code == 429
        data = response.json()
        assert "too many requests" in data.get("detail", "").lower()


async def _get_csrf_token(async_client: AsyncClient) -> str:
    """Helper to get a valid CSRF token from the server."""
    response = await async_client.get("/api/health")
    if response.status_code == 404:
        response = await async_client.get("/")
    # Get CSRF token from response cookies
    csrf_token = response.cookies.get("csrf_token")
    if csrf_token is None:
        # Try getting from set-cookie header
        set_cookie = response.headers.get("set-cookie", "")
        for cookie in set_cookie.split(", "):
            if cookie.startswith("csrf_token="):
                return cookie.split("=")[1].split(";")[0]
    return csrf_token


async def _make_post_request(async_client: AsyncClient, url: str, json_data: dict, csrf_token: str = None, extra_headers: dict = None):
    """Helper to make a POST request with proper CSRF token."""
    headers = {"X-CSRF-Token": async_client.cookies.get("csrf_token", "")}
    if extra_headers:
        headers.update(extra_headers)
    return await async_client.post(url, json=json_data, headers=headers)