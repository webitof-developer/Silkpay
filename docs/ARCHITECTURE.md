# System Architecture

**SilkPay Payout Platform - Technical Architecture**

---

## Overview

The SilkPay Payout Platform is built as a **Hybrid Modular Monolith** with separate frontend and backend applications communicating via RESTful APIs.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER / MERCHANT                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 14+)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Payouts    │  │ Beneficiaries│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Transactions │  │   Merchant   │  │   Settings   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (JWT Auth)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js + MongoDB)                  │
│                                                              │
│  ┌─────────── API MODULES ────────────┐                     │
│  │ Auth │ Merchant │ Beneficiary      │                     │
│  │ Payout │ Transaction │ Dashboard   │                     │
│  │ Balance │ Webhook                  │                     │
│  └──────────────────────────────────┬─┘                     │
│                                     │                        │
│  ┌─────── SHARED SERVICES ──────────┤                       │
│  │ Logger │ Encryption │ Validation │                       │
│  │ SilkPay API Client (Adapter)     │ Auth Middleware       │
│  └──────────────────────────────────┘                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   MongoDB   │ │  SilkPay    │ │  Workers    │
│  Database   │ │  API (3rd)  │ │  (Cron)     │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Backend Architecture (Hybrid Modular Monolith)

### Module Structure

Each module is self-contained with:
- **Model** - Mongoose schema
- **Service** - Business logic
- **Controller** - HTTP handlers
- **Validator** - Joi validation
- **Routes** - Express routes

**Modules (8):**
1. **Auth** - JWT authentication
2. **Merchant** - Profile, API keys, IP whitelist
3. **Beneficiary** - CRUD operations
4. **Payout** - Create, track, query
5. **Transaction** - Ledger, exports
6. **Dashboard** - Metrics, analytics
7. **Balance** - Sync, reserve/release
8. **Webhook** - SilkPay callbacks

**Shared Layer:**
- Config (Database, Agenda)
- Middleware (Auth, Error Handler, Rate Limit)
- Utils (Logger, Encryption, Helpers)
- Services (SilkPay API Client)

### Background Workers (3)

Running as separate processes:

1. **Payout Sync Worker** (`payout-sync.worker.js`)
   - Frequency: Every 5 minutes
   - Purpose: Query pending payout status from SilkPay
   - Technology: node-cron

2. **Balance Sync Worker** (`balance-sync.worker.js`)
   - Frequency: Every hour
   - Purpose: Sync merchant balance with SilkPay
   - Technology: node-cron

3. **Email Worker** (`email.worker.js`)
   - Frequency: Continuous (queue-based)
   - Purpose: Send email notifications
   - Technology: Agenda (MongoDB-based queue)

---

## Frontend Architecture (Next.js)

### Rendering Strategy (Hybrid)

- **SSR (Server-Side Rendering):** Dashboard, Analytics (SEO, initial load performance)
- **CSR (Client-Side Rendering):** Real-time updates, Interactive components
- **Static Generation:** Marketing pages (if any)

### Pages & Routes

| Route | Component | Rendering | Purpose |
|-------|-----------|-----------|---------|
| `/` | Dashboard | SSR | Overview, metrics |
| `/login` | Login | SSR | Authentication |
| `/payouts` | Payouts List | CSR | List, filters |
| `/payouts/new` | Create Payout | CSR | Form, validation |
| `/transactions` | Transactions | CSR | Ledger view |
| `/beneficiaries` | Beneficiaries | CSR | CRUD management |
| `/merchant` | Merchant Center | CSR | Profile, keys |
| `/settings` | Settings | CSR | Preferences |

### Export Strategy (Two-Tier)

**Tier 1 - Client-Side CSV:**
- For table exports (Payouts, Transactions, Beneficiaries)
- Generates CSV from current filtered view
- Instant download, no backend load

**Tier 2 - Server-Side Reports:**
- For complex reports (Account Statements, Tax Reports)
- Backend generates via `/api/transactions/export`
- Max 10,000 records

---

## Data Flow

### 1. Payout Creation Flow

```
┌──────────┐    1. Submit Form        ┌──────────────┐
│ Frontend │ ─────────────────────────▶│   Backend    │
│ (Next.js)│                           │  (Express)   │
└──────────┘                           └──────┬───────┘
                                              │
                                              │ 2. Validate
                                              │ 3. Check Balance
                                              │ 4. Create DB Record
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │   MongoDB    │
                                       └──────────────┘
                                              │
                                              │ 5. Call SilkPay API
                                              ▼
                                       ┌──────────────┐
                                       │  SilkPay API │
                                       └──────┬───────┘
                                              │
                                              │ 6. Return Response
                                              ▼
┌──────────┐    7. Success/Error      ┌──────────────┐
│ Frontend │ ◀─────────────────────── │   Backend    │
└──────────┘                           └──────────────┘
```

### 2. Webhook Callback Flow

```
┌──────────────┐    1. Payout Status Update    ┌──────────────┐
│  SilkPay API │ ───────────────────────────────▶│   Backend    │
└──────────────┘                                 │ /api/webhook │
                                                 └──────┬───────┘
                                                        │
                                                        │ 2. Verify Signature
                                                        │ 3. Find Payout
                                                        │ 4. Update Status
                                                        │ 5. Adjust Balance
                                                        │
                                                        ▼
                                                 ┌──────────────┐
                                                 │   MongoDB    │
                                                 └──────────────┘
                                                        │
                                                        │ 6. Return "OK"
                                                        ▼
┌──────────────┐            ◀───────────────────┌──────────────┐
│  SilkPay API │                                 │   Backend    │
└──────────────┘                                 └──────────────┘
```

```

### 3. Payout State Machine & Finality

**Core Rule: Webhook is Authoritative.**

1.  **Creation**: `PENDING` -> `PROCESSING` (via API 200 OK)
2.  **Monitoring**: 
    - Worker polls `Query` endpoint (Informational only).
    - `Query` often returns `0` (Processing) indefinitely.
3.  **Completion**:
    - **Webhook** arrives with `2` (Success) or `3` (Failed).
    - Status updates to `SUCCESS` or `FAILED`.
    - `completed_at` is set. Matches "Final" state.
4.  **Ledger**:
    - `SUCCESS` -> No new transaction (already debited at creation).
    - `FAILED` -> New `REFUND` transaction created.

### 4. Balance Sync Flow

```
┌──────────────┐    1. Cron Trigger (Hourly)    ┌──────────────┐
│ Balance Sync │ ───────────────────────────────▶│   Worker     │
│   Worker     │                                 └──────┬───────┘
└──────────────┘                                        │
                                                        │ 2. Get Merchants
                                                        │
                                                        ▼
                                                 ┌──────────────┐
                                                 │   MongoDB    │
                                                 └──────┬───────┘
                                                        │
                                                        │ 3. For Each Merchant
                                                        │ 4. Query SilkPay Balance
                                                        ▼
                                                 ┌──────────────┐
                                                 │  SilkPay API │
                                                 └──────┬───────┘
                                                        │
                                                        │ 5. Update DB
                                                        ▼
                                                 ┌──────────────┐
                                                 │   MongoDB    │
                                                 └──────────────┘
```

---

## Database Design (MongoDB)

### Collections

1. **merchants** - Merchant profiles, balance, API keys
2. **beneficiaries** - Saved beneficiaries
3. **payouts** - Payout records (with beneficiary snapshot)
4. **transactions** - Double-entry ledger
5. **agendaJobs** - Email queue jobs

### Key Indexes

**Payouts:**
- `{ merchant_id: 1, created_at: -1 }` - List payouts
- `{ out_trade_no: 1 }` - Lookup by order number
- `{ status: 1, created_at: 1 }` - Query pending

**Beneficiaries:**
- `{ merchant_id: 1, status: 1 }` - List active
- `{ merchant_id: 1, bank_details.account_number: 1 }` - Prevent duplicates

**Transactions:**
- `{ merchant_id: 1, created_at: -1 }` - Ledger history
- `{ reference_no: 1 }` - Trace to payout

---

## Security Architecture

### Authentication & Authorization

- **JWT Tokens** - Bearer token in Authorization header
- **Password Hashing** - bcrypt with 10 salt rounds
- **AES-256 Encryption** - For account numbers, secret keys
- **Token Expiry** - 30 minutes (configurable)

### API Security

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Helmet** - Security headers (CSP, XSS protection)
- **CORS** - Whitelisted origins only
- **Input Validation** - Joi schemas for all inputs
- **Signature Verification** - MD5 for SilkPay webhooks
- **IP Whitelisting** - Per-merchant API access control

---

## Scalability Considerations

### Current Design (Monolith)

- ✅ Single deployment unit
- ✅ Simpler operational overhead
- ✅ Suitable for MVP/early stage
- ⚠️ Vertical scaling only

### Future Migration Path (Microservices)

If needed, modules can be extracted:
1. **Auth Service** - Centralized authentication
2. **Payout Service** - Core business logic
3. **Notification Service** - Emails, webhooks
4. **Analytics Service** - Dashboard, reports

### Horizontal Scaling

- **Stateless API** - Can run multiple instances behind load balancer
- **MongoDB Replica Set** - Read replicas for scaling
- **Worker Scaling** - Multiple worker instances with job locking

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|----------|---------|
| **Frontend** | Next.js 14+ | SSR/CSR hybrid |
| **Backend** | Express.js | RESTful API |
| **Database** | MongoDB 6+ | Document store |
| **Job Queue** | Agenda | Background jobs |
| **Workers** | node-cron | Scheduled tasks |
| **Authentication** | JWT | Stateless auth |
| **Validation** | Joi | Input validation |
| **Logging** | Winston | Structured logs |
| **Security** | Helmet, bcrypt | Headers, passwords |

---

**Last Updated:** 2026-01-29  
**Version:** 1.0
