# ChatBiz — Features Built So Far

A snapshot of what's actually implemented and verified working, as of this point in development. Useful as source material for promotional/marketing copy — everything listed here is real and tested, not aspirational.

## Customer-Facing Chat Widget

- **One-line embed** — businesses add a single `<script>` tag to their site; no iframe hassle, no app to install.
- **Fully style-isolated** — mounts inside a Shadow DOM, so it never clashes with or is broken by the host site's own CSS.
- **On-brand** — configurable accent color and bot name per business.
- **Custom greeting** — the welcome message shown is pulled live from the business's own dashboard settings, not a generic default.
- **Formatted replies** — bot answers render real bold text and bullet/numbered lists, not raw markdown asterisks.
- **Built-in lead capture** — a contact form appears inline in the chat automatically when the bot can't fully answer or detects buying intent.
- **Abuse-resistant** — rate-limited per visitor so one bad actor can't spam a business's AI costs or flood their leads inbox.

## AI That Actually Knows the Business

- **Retrieval-grounded answers (RAG)** — the bot answers from a business's own FAQs, uploaded documents, and product/service catalog — not generic web knowledge.
- **Upload almost anything** — PDF, Word, Excel, CSV, and plain text documents are all supported out of the box.
- **Import directly from a web page** — paste a URL (e.g. an existing About or FAQ page) and the bot learns from it immediately, no copy-pasting content into forms.
- **Remembers the conversation** — follow-up questions like "and the cappuccino?" after "what's the price of a latte?" are understood in context, not answered as an isolated, disconnected question.
- **Won't make things up** — explicitly instructed to say "I don't know" rather than invent plausible-sounding but false details (hours, prices, policies) when it lacks real grounding.
- **Swappable AI engine** — works with Groq, Google Gemini, or a self-hosted Ollama model; free-tier friendly by default.
- **Adjustable personality** — friendly, formal, concise, or playful tone, chosen per business and genuinely reflected in every reply.
- **Custom fallback message** — businesses write their own "I don't have that info" wording instead of a generic canned response.
- **Automatic intent detection** — distinguishes FAQ questions, product inquiries, support issues, and lead-generating moments.

## Admin Dashboard

- **Multi-tenant from the ground up** — every business's data (FAQs, documents, leads, conversations) is fully isolated from every other business's.
- **FAQ management** — add, edit, delete, and categorize FAQs.
- **Product/service catalog** — name, description, price, category — and the chatbot can actually answer questions from it (e.g. exact pricing).
- **Document library** — upload files or import from URL, with live embedding-status tracking (processing → embedded).
- **Conversation history** — browse every visitor chat session, expand to read the full back-and-forth, delete individual sessions.
- **Leads inbox** — every captured lead in one place, with status tracking (new / contacted / won / lost).
- **Analytics overview** — conversation count, lead count, message count, and a "top visitor questions" ranking, so a business can see what people actually ask.
- **One-click embed snippet** — the exact `<script>` tag for a business's widget, ready to copy.
- **Full chatbot customization** — tone, welcome message, fallback message, AI provider/model, and contact info, all editable from Settings.

## Runs the Business Side Too

- **Automatic lead email notifications** — the business owner gets emailed the moment a new lead comes in, instead of needing to check the dashboard manually.
- **Pluggable notification delivery** — works with zero setup (logs locally) or with a real email provider (Resend) once configured.

## Security & Reliability

- **Tenant data isolation enforced everywhere** — every query is scoped to the authenticated business; a client's `business_id` alone is never enough to see or touch another tenant's data.
- **Smart CORS** — the public widget can be embedded on literally any client website, while the admin dashboard API stays locked to known origins.
- **Rate limiting** on both the public chat and lead-capture endpoints.
- **SSRF-safe URL import** — rejects attempts to fetch internal/private network addresses.
- **Fast, reliable startup** — the AI model warms up in ~5 seconds, not the 90+ seconds it took before a caching fix.

---

*Not yet built (known gaps, tracked separately): live human-agent handoff mid-conversation, business-hours-aware responses, full multi-page website crawling (only single-page import exists), multi-language support, billing/subscription automation.*
