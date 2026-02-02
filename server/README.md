# SilkPay Backend API

Backend server for SilkPay Payout Management Platform using Express.js, MongoDB, and Agenda (job queue).

## Architecture

- **Hybrid Modular Monolith** - Feature-based modules with separate worker processes
- **MongoDB Only** - No Redis dependency, using Agenda for job scheduling
- **8 Core Modules**: Auth, Merchant, Beneficiary, Payout, Transaction, Dashboard, Balance, Webhook

## Prerequisites

- Node.js 18+ LTS
- MongoDB 6+

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

**Key variables to set:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Strong random secret for JWT
- `ENCRYPTION_KEY` - 64 hex characters (32 bytes) for AES-256

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Seed Database (Development)
```bash
node scripts/seed.js
```

This creates a test merchant:
- Email: `test@silkpay.local`
- Password: `password123`

### 4. Start Development Server
```bash
npm run dev
```

Server runs on: `http://localhost:3001`

## API Endpoints

### Auth
- `POST /api/auth/login` - Login merchant
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current merchant (protected)

### Payouts
- `GET /api/payouts` - List payouts
- `POST /api/payouts` - Create payout
- `GET /api/payouts/:id` - Get payout details

### Transactions
- `GET /api/transactions` - List transaction history (ledger)

### Beneficiaries
- `GET /api/beneficiaries` - List beneficiaries
- `POST /api/beneficiaries` - Create beneficiary
- `PUT /api/beneficiaries/:id` - Update beneficiary

### Health Check
- `GET /health` - Server health status

## Testing

Test login with curl:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@silkpay.local","password":"password123"}'
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server (nodemon)
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run worker:payout-sync` - Start payout sync worker
- `npm run worker:email` - Start email worker
- `npm run worker:balance-sync` - Start balance sync worker

## Project Structure

```
server/
├── src/
│   ├── modules/          # Feature modules
│   │   ├── auth/
│   │   └── merchant/
│   ├── shared/
│   │   ├── config/       # Database, Agenda
│   │   ├── middleware/   # Auth, Error Handler
│   │   └── utils/        # Logger, Encryption
│   └── app.js
├── workers/              # Background workers
├── scripts/              # Seed, migration scripts
├── server.js
└── package.json
```

✅ **Completed Modules:**
- [x] Project structure & MongoDB
- [x] Auth module (login, JWT)
- [x] Merchant module (Profile, API Keys)
- [x] Beneficiary module (CRUD, UPI support)
- [x] Payout module (Create, List, Details)
- [x] Transaction module (Ledger, Exports)
- [x] Dashboard module (Metrics, Analytics)
- [x] Webhook module (SilkPay callbacks)
- [x] Background Workers (Payout Sync, Balance Sync)

## License

ISC

## SilkPay Integration Reference

### Status Codes
- `2`: Payment Successful
- `3`: Payment Failed
- `PROCESSING`: Payment in progress

### Required Fields (Payout Request)
- `mId`: Merchant ID
- `mOrderId`: Merchant Order ID (Unique)
- `payOrderId`: SilkPay Order ID
- `amount`: Transaction Amount
- `status`: Transaction Status (2=Success, 3=Failed)
- `sign`: MD5 Signature

