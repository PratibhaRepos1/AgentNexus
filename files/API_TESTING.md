# ChatCraft — Swagger API Testing Guide

A walkthrough for manually testing every backend endpoint via the interactive Swagger UI at
**http://127.0.0.1:8000/docs**. Follow it top to bottom the first time — later sections depend on
data created in earlier ones (a business, a JWT, an FAQ, etc.).

Backend must be running first:
```powershell
cd "C:\Pratibha2026\ProjectsIn2026\AI Projects\ChatCraft\backend"
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Two kinds of endpoints

- **Authenticated (dashboard) endpoints** — everything under `/api/businesses`, `/api/faqs`,
  `/api/products`, `/api/documents`, `/api/analytics`, plus `GET /api/leads` and
  `GET /api/chat/conversations`. These require a JWT (see step 1) and always scope data to
  *your* business via the token — never via a body/query param.
- **Public (widget-facing) endpoints** — `POST /api/chat/message`, `GET /api/chat/history/{id}`,
  `POST /api/leads`. No auth required, but you must pass a real `business_id` explicitly, since
  there's no JWT to infer it from (this is what the embeddable widget calls from a stranger's
  website).

---

## 1. Auth — `POST /api/auth/register`

```json
{
  "business_name": "Green Leaf Cafe",
  "business_slug": "green-leaf-cafe",
  "industry": "restaurant",
  "full_name": "Priya Sharma",
  "email": "priya@greenleafcafe.com",
  "password": "TestPass123!"
}
```
`industry` must be one of: `retail`, `restaurant`, `clinic`, `real_estate`, `service`, `other`.

Expect **200** with `{ "access_token": "...", "token_type": "bearer" }`.
Registering the same `email` or `business_slug` twice correctly returns **400** — that's the
duplicate check working, not a bug.

Then **`POST /api/auth/login`**:
```json
{ "email": "priya@greenleafcafe.com", "password": "TestPass123!" }
```
Same response shape. Copy the `access_token`.

### Authorize once, use everywhere
Click the green **Authorize** button (top of the Swagger page), paste the raw token (no `Bearer`
prefix needed — Swagger adds it), click Authorize, then Close. Every endpoint below that needs
auth will now use it automatically.

> Tip: the JWT payload also contains your `business_id` (decode it at jwt.io if you ever need to
> copy that UUID for testing a public endpoint below).

---

## 2. Business profile — `/api/businesses`

- **`GET /me`** → your business record (`name`, `slug`, `industry`, `plan`, `status`, ...).
- **`PATCH /me`** → update branding:
  ```json
  { "primary_color": "#22c55e", "logo_url": "https://example.com/logo.png" }
  ```
- **`GET /me/settings`** → tone, welcome/fallback messages, business hours, `llm_provider`.
- **`PATCH /me/settings`** → e.g. change the widget's greeting:
  ```json
  { "welcome_message": "Hey there! How can Green Leaf Cafe help you today?", "tone": "friendly" }
  ```

---

## 3. FAQs — `/api/faqs`

- **`POST ""`** — create a couple, since the chat/RAG step below depends on these existing:
  ```json
  { "question": "What are your opening hours?", "answer": "We're open 8am-8pm daily.", "category": "hours" }
  ```
  ```json
  { "question": "Do you have vegan options?", "answer": "Yes, our vegan menu is on page 2.", "category": "menu" }
  ```
- **`GET ""`** → list them back, note an `id` from the response.
- **`PATCH /{faq_id}`** → `{ "is_active": false }` to test soft-disabling one.
- **`DELETE /{faq_id}`** → remove it, then `GET ""` again to confirm it's gone.

---

## 4. Products/Services — `/api/products`

```json
{ "name": "Cappuccino", "description": "Espresso with steamed milk foam", "price": 3.50, "currency": "USD", "category": "drinks" }
```
Same CRUD shape as FAQs (`GET`, `POST`, `PATCH /{id}`, `DELETE /{id}`).

---

## 5. Documents — `/api/documents`

This one's a file upload, not JSON — in Swagger, `POST ""` shows a file picker instead of a body
box. Upload a small `.txt` or `.pdf` with some business info in it (e.g. a menu or policy doc).
Expect a `DocumentOut` back with `status: "pending"` or `"embedded"`.

- **`GET ""`** → confirm it's listed.
- **`DELETE /{doc_id}`** → remove it.

> Known gap: the current pipeline embeds chunks with a naive Python cosine-similarity scan
> (`app/rag/pipeline.py`), not a real pgvector index query — fine for testing, worth revisiting
> before this scales past toy data.

---

## 6. Chat / RAG — `POST /api/chat/message` (public, no auth)

This is the one endpoint that needs your **business UUID** pasted manually (decode it from the
JWT, or copy `id` from step 2's `GET /me` response) instead of relying on Authorize.

```json
{
  "business_id": "PASTE-YOUR-BUSINESS-UUID-HERE",
  "session_id": "test-session-1",
  "message": "What are your opening hours?"
}
```
Expect a reply that pulls from the FAQ you created in step 3, plus `intent` (`faq` / `product_inquiry`
/ `lead` / `support`) and a `confidence` score. Requires `GROQ_API_KEY` set in `.env` — if you get a
provider auth error, check that key.

Then (authenticated) **`GET /api/chat/conversations`** → your session should show up with its
messages nested.

---

## 7. Leads — `/api/leads`

**`POST ""`** is also public (widget submits it directly), needs `business_id` again:
```json
{
  "business_id": "PASTE-YOUR-BUSINESS-UUID-HERE",
  "name": "Test Visitor",
  "email": "visitor@example.com",
  "phone": "555-0100",
  "message": "Interested in catering for 50 people"
}
```
Then authenticated:
- **`GET ""`** → list it.
- **`PATCH /{lead_id}`** → `{ "status": "contacted" }` (valid values: `new`, `contacted`, `won`, `lost`).

---

## 8. Analytics — `GET /api/analytics/summary`

Run this last, after you've generated a bit of chat/lead activity above. Expect counts for
conversations, leads, messages, and a `top_questions` list built from repeated visitor messages.

---

## Troubleshooting notes from our own first run-through

- **500 with no JSON body, just plain "Internal Server Error"** → check the terminal running
  uvicorn for the traceback; that's Starlette's generic fallback for any unhandled exception.
- **`ResponseValidationError` mentioning a `UUID` input where a `string` was expected** → a
  schema in `app/schemas/*.py` typed an `id`/`business_id` field as `str` instead of `UUID`
  (already fixed across all `*Out` schemas as of this writing).
- **Two `uvicorn --reload` processes running at once** (e.g. one from an earlier terminal you
  forgot about) will fight over port 8000 and give inconsistent results request-to-request. If
  behavior seems to "flip" between fixed and broken, check for a second process:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 | Select OwningProcess
  ```
