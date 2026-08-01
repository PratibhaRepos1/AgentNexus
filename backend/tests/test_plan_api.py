"""API-level tests for the plan/billing endpoints in app/api/businesses.py."""


def test_plan_catalog_is_public_and_has_four_plans(client):
    resp = client.get("/api/businesses/plans")
    assert resp.status_code == 200
    keys = {p["key"] for p in resp.json()}
    assert keys == {"free", "basic", "business", "growth"}


def test_plan_catalog_prices_match_pricing_page(client):
    resp = client.get("/api/businesses/plans")
    prices = {p["key"]: p["price_usd"] for p in resp.json()}
    assert prices == {"free": 0, "basic": 24, "business": 48, "growth": 96}


def test_get_my_plan_requires_auth(client):
    resp = client.get("/api/businesses/me/plan")
    assert resp.status_code in (401, 403)


def test_get_my_plan_defaults_to_free(client, business):
    resp = client.get("/api/businesses/me/plan", headers=business["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["plan"] == "free"
    assert body["usage"]["documents"] == 0


def test_choose_plan_updates_current_plan(client, business):
    resp = client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "growth"})
    assert resp.status_code == 200
    assert resp.json()["plan"] == "growth"

    check = client.get("/api/businesses/me/plan", headers=business["headers"])
    assert check.json()["plan"] == "growth"


def test_choose_unknown_plan_rejected(client, business):
    resp = client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "enterprise-plus"})
    assert resp.status_code == 400


def test_switching_away_from_business_clears_api_addon(client, business):
    client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "business"})
    client.patch("/api/businesses/me/plan/api-access-addon", headers=business["headers"], json={"enabled": True})

    resp = client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "basic"})
    assert resp.status_code == 200
    assert resp.json()["api_access_addon"] is False
    assert resp.json()["features"]["api_access"] is False


def test_api_addon_only_available_on_business_plan(client, business):
    # Still on Free by default.
    resp = client.patch("/api/businesses/me/plan/api-access-addon", headers=business["headers"], json={"enabled": True})
    assert resp.status_code == 403


def test_api_addon_toggle_on_business_plan(client, business):
    client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "business"})
    resp = client.patch("/api/businesses/me/plan/api-access-addon", headers=business["headers"], json={"enabled": True})
    assert resp.status_code == 200
    assert resp.json()["features"]["api_access"] is True


# ---------------------------------------------------------------------------
# API key
# ---------------------------------------------------------------------------

def test_create_api_key_blocked_without_access(client, business):
    resp = client.post("/api/businesses/me/api-key", headers=business["headers"])
    assert resp.status_code == 403


def test_create_api_key_succeeds_on_growth(client, business):
    client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "growth"})
    resp = client.post("/api/businesses/me/api-key", headers=business["headers"])
    assert resp.status_code == 200
    assert resp.json()["api_key"].startswith("an_")


def test_revoke_api_key(client, business):
    client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "growth"})
    client.post("/api/businesses/me/api-key", headers=business["headers"])
    resp = client.delete("/api/businesses/me/api-key", headers=business["headers"])
    assert resp.status_code == 200
    assert resp.json()["api_key"] is None


# ---------------------------------------------------------------------------
# Notification channels -- 403 (wrong plan) vs 501 (right plan, not built)
# ---------------------------------------------------------------------------

def test_whatsapp_channel_forbidden_on_free(client, business):
    resp = client.post(
        "/api/businesses/me/notification-channels",
        headers=business["headers"],
        json={"channel": "whatsapp", "enabled": True},
    )
    assert resp.status_code == 403


def test_whatsapp_channel_not_implemented_on_business(client, business):
    client.patch("/api/businesses/me/plan", headers=business["headers"], json={"plan": "business"})
    resp = client.post(
        "/api/businesses/me/notification-channels",
        headers=business["headers"],
        json={"channel": "whatsapp", "enabled": True},
    )
    assert resp.status_code == 501


def test_unknown_notification_channel_rejected(client, business):
    resp = client.post(
        "/api/businesses/me/notification-channels",
        headers=business["headers"],
        json={"channel": "carrier-pigeon", "enabled": True},
    )
    assert resp.status_code == 400
