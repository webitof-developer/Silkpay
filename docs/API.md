# API Reference

**SilkPay Payout Platform - Backend API Documentation**

**Base URL:** `http://localhost:3001/api` (development)  
**Production:** `https://api.yourdomain.com/api`

**Authentication:** JWT Bearer Token (except Login & Webhooks)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Merchant Management](#merchant-management)
3. [Beneficiaries](#beneficiaries)
4. [Payouts](#payouts)
5. [Transactions](#transactions)
6. [Dashboard](#dashboard)
7. [Balance](#balance)
8. [Webhooks](#webhooks)
9. [Error Codes](#error-codes)

---

## Authentication

All endpoints except `/auth/login`, `/auth/forgot-password`, and `/webhook/*` require JWT authentication.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### POST `/auth/login`

Authenticate merchant and receive JWT token.

**Request:**
```json
{
  "email": "test@silkpay.local",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "merchant": {
      "_id": "65b1234567890abcdef12345",
      "merchant_no": "M2024001",
      "name": "Test Merchant",
      "email": "test@silkpay.local",
      "status": "ACTIVE"
    }
  }
}
```

**Errors:**
- `429` - Too many login attempts
- `401` - Invalid credentials

### POST `/auth/forgot-password`

Request password reset link.

**Request:**
```json
{
  "email": "test@silkpay.local"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email",
  "data": { "token": "..." } // Only in Development
}
```

### POST `/auth/reset-password`

Reset password using token.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## Merchant Management

### GET `/merchant/profile`

Get current merchant profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65b1234567890abcdef12345",
    "merchant_no": "M2024001",
    "name": "Test Merchant",
    "email": "test@silkpay.local",
    "mobile": "+91 9876543210",
    "status": "ACTIVE",
    "balance": {
      "available": 125000.00,
      "pending": 15000.00,
      "total": 140000.00
    }
  }
}
```

### PUT `/merchant/profile`

Update merchant profile details.

**Request:**
```json
{
  "name": "Updated Business Name",
  "mobile": "+91 9988776655",
  "webhook": { "url": "https://callback.example.com" }
}
```

### POST `/merchant/change-password`

Change authenticated user's password.

**Request:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newPassword456"
}
```

---

## Beneficiaries

### GET `/beneficiaries`

List beneficiaries.

**Query Parameters:**
- `search`
- `status` (ACTIVE/INACTIVE)
- `page`, `limit`

### POST `/beneficiaries`

Create new beneficiary.

**Request:**
```json
{
  "name": "Priya Gupta",
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "bank_name": "SBI",
  "email": "priya@example.com",
  "mobile": "9988776655"
}
```

### PUT `/beneficiaries/:id`

Update beneficiary details.

### DELETE `/beneficiaries/:id`

Soft delete (sets status to INACTIVE).

---

## Payouts

### GET `/payouts`

List payouts.

**Query Parameters:**
- `status` (PENDING, PROCESSING, SUCCESS, FAILED, REVERSED)
  - `PROCESSING`: Request accepted by SilkPay, awaiting bank confirmation. NOT FINAL.
  - `SUCCESS`: Confirmed successful by Webhook (Authoritative).
  - `FAILED`: Confirmed failed.
- `beneficiary_id`
- `page`, `limit`

### POST `/payouts`

Create payout order.

**Request:**
```json
{
  "source": "SAVED", // or "ONE_TIME"
  "beneficiary_id": "optional_if_adhoc",
  "beneficiary_name": "Required if source=ONE_TIME",
  "account_number": "Required if source=ONE_TIME",
  "ifsc_code": "Required if source=ONE_TIME",
  "amount": 5000.00,
  "description": "Vendor Payment"
}
```

---

## Transactions

### GET `/transactions`

Get transaction ledger (Credits & Debits).

**Query Parameters:**
- `type` (PAYOUT, REFUND, CREDIT)
- `startDate`, `endDate`
- `search`

---

## Dashboard

### GET `/dashboard/overview`

Get aggregated metrics.

---

## Security

### Rate Limiting
- **Login:** 5 attempts per 15 mins (blocks brute force).
- **API:** 100 requests per 15 mins (Production).

### CORS
- Strict origin validation against `CORS_ORIGINS` env var.

---

## Webhooks

### POST `/webhook/silkpay`

**SilkPay Callback Endpoint** - Receives asynchronous status notifications from SilkPay.

**Important:** This endpoint does NOT require authentication (webhook from external service).

**Incoming Request from SilkPay:**

```json
{
  "mOrderId": "F7064_1770726907313_8199",
  "status": 2,
  "utr": "112233445566",
  "amount": "100.00",
  "payOrderId": "DF-0207173510390431811270665",
  "sign": "80f7eb17fec33a6b7963fc113484642a",
  "timestamp": 1687244719629
}
```

**Status Codes:**
- `2` = SUCCESS (Payment successful) ✅
- `3` = FAILED (Payment failed) ❌

**🚨 CRITICAL:** Webhook ONLY sends final states (2 or 3). You will NEVER receive a webhook for:
- `0` = INITIAL
- `1` = PROCESSING

**Your Response (Required):**
```
OK
```

**Signature Verification:**
```javascript
// Format: md5(mId+mOrderId+amount+timestamp+secretKey)
const expectedSign = md5(`${mId}${mOrderId}${amount}${timestamp}${secretKey}`);
if (sign !== expectedSign) {
  return 400; // Invalid signature
}
```

**Retry Logic:**
- If "OK" not returned, SilkPay retries every 5 minutes
- Maximum 5 retry attempts

---

### GET `/payouts/:id/status`

**Manual Status Query** - Check payout status on-demand.

**Authentication:** Required (Bearer token)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "67a23f042402526337818625",
    "out_trade_no": "F7064_1770726907313_8199",
    "status": "PROCESSING",
    "amount": 100.00,
    "utr": null,
    "external_id": "DF-0207173510390431811270665",
    ...
  }
}
```

**Status Values (from SilkPay query API):**
- `0` → `INITIAL` (Just created)
- `1` → `PROCESSING` (In progress)
- `2` → `SUCCESS` (Completed) ✅
- `3` → `FAILED` ❌

**Use Case:** Click "Sync" button to manually check status, especially useful for checking PROCESSING state since webhook doesn't send it.

---

## Error Codes

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request / Validation error
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `429` - Too many requests (rate limited)
- `500` - Internal server error
