# SupportIQ
**Evidence-Based AI Support Ticket Resolution System**

Built for: Q4. Zepto Support Ticket Manager — DigiPlus IT Agentic AI Hackathon (6-hour build, TCET)

## 1. Overview

A 10-minute-delivery company gets thousands of near-identical support tickets a day.
SupportIQ matches each new ticket against historical resolved tickets, auto-resolves it
the same way history did **only when the evidence is strong and consistent**, and routes
everything else to a human lane with full context attached.

> "Do not let AI guess. Use historical evidence, validate the proposed action against
> order context, and act only when confidence is high — and know when not to act."

## 2. Problem → Solution

| Problem | Solution |
|---|---|
| Routine tickets wait in the same queue as unusual ones | TF-IDF similarity retrieves the top-3 most similar resolved tickets in milliseconds |
| Agents apply the same fix as last time, every time | If precedents agree and confidence clears the threshold, the ticket auto-resolves with the same action |
| AI systems can act on weak or conflicting evidence | Hard rules force human review on low similarity, conflicting precedents, or invalid order context — **no majority voting** |
| Refunds/redeliveries can be issued against bad orders | Guardrails block actions that violate order facts (e.g. redelivery on a cancelled order, refund above order value) regardless of confidence |

## 3. Architecture

```
New Ticket
    ↓
TF-IDF Similarity Search (over 300 resolved tickets)
    ↓
Top-3 Precedents
    ↓
Action Agreement Check  ──── conflicting? ──────────┐
    ↓ (unanimous)                                    │
Similarity Threshold Check ── below threshold? ──────┤
    ↓ (passes)                                        │
Order Context Lookup                                  │
    ↓                                                 │
Guardrails (refund cap, cancelled-order rule) ── fail─┤
    ↓ (pass)                                          ↓
Confidence Score                              → NEEDS HUMAN
    ↓                                             (with precedents,
≥ 0.75? ── no ──────────────────────────────────►  reason, suggested
    ↓ yes                                            action attached)
AUTO-RESOLVED
    ↓
Reply Generation (template, optional LLM for phrasing only)
    ↓
Decision Log (SQLite) → Dashboard
```

The **deterministic decision engine is the source of truth**. An LLM, if configured, is
only ever used to rephrase a reply — never to decide the action.

## 4. Dataset

| File | Rows | Columns |
|---|---|---|
| `resolved_tickets.csv` | 300 | ticket_id, category, description, resolution_action, resolution_note, time_to_resolve_min, csat |
| `new_tickets.csv` | 30 | ticket_id, created_at, order_id, description |
| `orders_context.csv` | 30 | order_id, items, value_inr, delivery_time_min, delivery_status |

No missing values in any field. Every category in `resolved_tickets.csv` has **two
dominant actions roughly split 50/50** (e.g. `missing_item` → 36 partial_refund / 27
redelivery), which is why the "no majority voting on conflict" rule matters so much in
practice — see Section 8.

## 5. Technology Stack

- **Backend:** Python, FastAPI, Pydantic, Pandas, scikit-learn, SQLite, Uvicorn
- **Similarity:** TF-IDF (1-2 grams, English stopwords) + cosine similarity, index built once at startup
- **Frontend:** React + Vite, Tailwind CSS
- **AI:** Optional Anthropic API call for reply phrasing only (system works fully without it)

## 6. Similarity Approach

`backend/services/similarity.py` builds a single `TfidfVectorizer` over all 300 resolved
ticket descriptions once, at import time. Each lookup transforms the new ticket text and
ranks by cosine similarity — no rebuilding per request. Returns the top-3 precedents with
`ticket_id, description, category, action, resolution_note, csat, similarity`.

## 7. Decision Engine & Confidence

```
confidence = 0.60 × top_similarity + 0.40 × action_agreement
action_agreement = (# of top-3 precedents matching the top action) / 3
```

Confidence is **not** a calibrated probability — it's an explainable heuristic. The
following override confidence entirely and force `needs_human`:

- **Conflicting precedents** — if the top-3 don't unanimously agree on an action, the
  system does not guess or take a majority vote.
- **Low similarity** — below a configurable threshold (default `0.35`).
- **Guardrail failure** — see below.

Auto-resolve threshold: `0.75` (configurable in `decision_engine.py`).

## 8. Guardrails (hard rules, always override confidence)

| Rule | Behavior |
|---|---|
| Refund > order value | Blocked → human review |
| Cancelled order + `redelivery` | Blocked → human review |
| Low similarity | Human review |
| Conflicting precedents | Human review |

Refunds are computed by a centralized, deterministic policy
(`decision_engine.REFUND_POLICY`) that caps every refund action at the order value by
construction — the guardrail check is a defense-in-depth safety net on top of that, not
the only thing preventing an over-limit refund.

## 9. AI / Reply Layer

`backend/services/reply_generator.py` uses template replies by default. If
`ANTHROPIC_API_KEY` is set in `.env`, it optionally asks the model to rephrase the
already-decided reply more naturally — the action and refund amount are never touched by
the LLM, and any LLM failure silently falls back to the template.

## 10. Frontend

Two-lane dashboard (Auto-Resolved / Needs Human) with top stats, ticket cards showing
action + confidence, and a detail panel per ticket showing order context, full reasoning,
top-3 precedents, the drafted reply, and — for tickets needing review — Approve/Override
controls that log to SQLite.

## 11. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/tickets` | List all 30 new tickets |
| GET | `/tickets/{ticket_id}` | Ticket detail + order context |
| POST | `/tickets/{ticket_id}/resolve` | Run the full pipeline, return decision, log it |
| POST | `/tickets/{ticket_id}/override` | Record a human approve/override on the latest decision |
| GET | `/decisions` | All logged decisions |

## 12. Testing

26 tests, all passing:

- `tests/test_similarity.py` — retrieval correctness, ordering, index built once
- `tests/test_decision_engine.py` — all 5 required validation cases (strong precedent →
  auto; weak → human; conflict → human, no majority vote; cancelled+redelivery → blocked;
  refund cap defense-in-depth)
- `tests/test_guardrails.py` — rules in isolation
- `tests/test_api.py` — full pipeline through the live API, decision logging, override flow

```bash
cd backend
PYTHONPATH=. python3 -m pytest ../tests/ -v
```

**Verified result on the real 30 tickets (not a target, the actual output):**

```
Total tickets: 30
Auto-resolved: 3
Needs human: 27
Guardrail-blocked: 1  (N-003: cancelled order + redelivery)
Average confidence: 0.858
```

Only 3/30 auto-resolve because most categories in the historical data split close to
50/50 between two actions — the strict conflict rule correctly refuses to guess on the
majority of tickets. This is real behavior, not a placeholder.

## 13. Setup Instructions

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # optional: add ANTHROPIC_API_KEY to enable LLM reply phrasing
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` (defaults to `http://localhost:8000`) if the backend runs elsewhere.

## 14. Deployment Instructions

- **Backend:** any free-tier host that runs Uvicorn (Render, Railway, Fly.io). Set
  `ANTHROPIC_API_KEY` as an environment secret if using LLM reply phrasing — never commit
  it. CORS is currently open (`*`) for hackathon demo purposes; restrict it to your
  frontend's deployed origin before sharing publicly.
- **Frontend:** `npm run build` produces `dist/`, deployable to Vercel/Netlify/GitHub
  Pages. Set `VITE_API_URL` to the deployed backend URL at build time.

## 15. Demo Flow for Judges

1. Open the dashboard — 30 incoming tickets, stats at the top.
2. Open a strong ticket (e.g. **N-004 / N-009, "eggs broken in package"**) — 3/3
   precedents agree on `full_refund`, similarity 1.00, guardrails pass → **Auto-Resolved**,
   with a drafted reply and refund amount capped at order value.
3. Open a conflicting ticket (e.g. **N-002, "milk packet missing"**) — precedents split
   2 `redelivery` / 1 `partial_refund` → **Needs Human**, reasoning explicitly says
   "Historical precedents recommend conflicting actions."
4. Open **N-003** ("salted butter", cancelled order) — precedents agree on `redelivery`
   with confidence 1.00, but the order is cancelled → guardrail blocks it →
   **Needs Human**, "Order is cancelled — redelivery is not a valid action." This is the
   headline moment: high confidence alone doesn't win.
5. Click Approve or Override on a human-review ticket to show the logged decision trail.

**Key line for judges:** *"SupportIQ doesn't blindly trust AI. It uses historical
evidence, validates the action against the actual order, and knows when to escalate."*

## 16. Known Limitations

- TF-IDF is lexical, not semantic — paraphrased complaints with no shared vocabulary
  (e.g. "food arrived spoiled" vs. "package smelled bad") will show lower similarity than
  a true semantic match. Noted as a stated bonus (embeddings) in the hackathon brief, not
  implemented here to stay within scope.
- The refund policy (50% partial, 100% full/reissue) is a stated simulated assumption —
  the dataset has no ground-truth refund amounts, so this is intentionally simple and
  centralized for judges to inspect.
- CORS is fully open for demo convenience; tighten before any real deployment.
- Auto-resolve rate (3/30) is low because of genuine 50/50 action splits in the historical
  data per category — this is a property of the dataset, not a tunable the system should
  be forced to hit.
