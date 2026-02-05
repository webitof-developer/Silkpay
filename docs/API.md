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
  "notifications": { "email": true, "sms": false },
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
