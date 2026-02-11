# SilkPay Payout Platform

**A comprehensive payout management platform** for businesses to execute financial payouts through a unified dashboard.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D6.0-green.svg)](https://www.mongodb.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [License](#license)

---

## 🎯 Overview

SilkPay Payout Platform enables businesses to:
- Manage beneficiaries and execute payouts (Bank Transfer, UPI)
- Track transactions in real-time with comprehensive reporting
- Monitor balances and transaction history
- Integrate via RESTful API with signature-based authentication

**Note:** This platform is exclusively for **payouts only** (no payin functionality).

## 🔑 Key Concepts

- **Push-First Architecture:** Payout finality is determined by **SilkPay Webhooks** (Callback), not by synchronous API responses.
- **Latency:** Payouts may remain in `PROCESSING` state for minutes until the banking network confirms the transaction via webhook.
- **Ledger:** Transactions are recorded once at creation. Failed payouts generate a separate `REFUND` transaction.

---

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** - Secure merchant login
- 👥 **Beneficiary Management** - CRUD operations with validation
- 💸 **Payout Processing** - One-time & recurring payouts via SilkPay API
- 📊 **Real-time Dashboard** - Balance overview, metrics, charts
- 📜 **Transaction Ledger** - Complete audit trail with CSV export
- 🔔 **Webhook Integration** - Automatic status updates (Push) & Manual Sync (Pull)
- ⚙️ **Merchant Settings** - API keys, IP whitelisting, profile management

### Technical Features
- Hybrid Modular Monolith architecture
- MongoDB for data persistence
- Background workers for payout sync
- AES-256 encryption for sensitive data
- Rate limiting & security headers
- Comprehensive error handling

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **Job Queue:** Agenda (MongoDB-based)
- **Workers:** node-cron for scheduled tasks
- **Security:** bcryptjs, helmet, express-rate-limit
- **Validation:** Joi
- **Logging:** Winston

### Frontend
- **Framework:** Next.js 14+ (React)
- **Styling:** Tailwind CSS + Shadcn UI
- **State:** React Context + Hooks
- **Charts:** Recharts
- **HTTP:** Axios

### Integration
- **Payment Gateway:** SilkPay API
- **Signature:** MD5-based authentication

---

## 📚 Documentation Structure

This project uses **three READMEs** (monorepo best practice):
- **`/README.md`** (this file) - Project overview, quick start
- **`/server/README.md`** - Backend-specific setup, API endpoints
- **`/client/README.md`** - Frontend-specific setup, pages, components

**Why three?** Developers working on just frontend/backend can focus on relevant docs without scrolling through unrelated content.

**Full documentation:** See [`/docs`](./docs/) folder for complete guides.

---

## 📁 Project Structure

```
silkpay/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages (App Router)
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   └── utils/         # Helpers, formatters
│   └── package.json
│
├── server/                # Express.js backend
│   ├── src/
│   │   ├── modules/       # Feature modules (Auth, Payout, etc.)
│   │   ├── shared/        # Config, middleware, utils
│   │   └── app.js         # Express app
│   ├── workers/           # Background workers
│   ├── scripts/           # Seed, migrations
│   └── package.json
│
├── docs/                  # Documentation
│   ├── API.md            # API reference
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── ARCHITECTURE.md   # System architecture
│
├── payout_platform_prd_v1.1_final.md    # Product spec
├── api_frontend_alignment_analysis.md   # API mapping
└── README.md             # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd silkpay
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env      # Configure environment variables
npm run seed              # Create test merchant
npm run dev               # Start on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.local.example .env.local  # Configure API URL
npm run dev               # Start on http://localhost:3000
```

### 4. Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Test Login:** `test@silkpay.local` / `password123`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Server README](./server/README.md) | Backend setup, API endpoints, architecture |
| [Client README](./client/README.md) | Frontend setup, components, routing |
| [API Documentation](./docs/API.md) | Complete API reference |
| [Architecture Guide](./docs/ARCHITECTURE.md) | System design, data flow |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Production deployment steps |
| [API Alignment](./docs/API.md) | SilkPay API mapping |

---

## 💻 Development

### Available Scripts

**Backend:**
```bash
npm run dev           # Start dev server with nodemon
npm run seed          # Seed test data
npm run worker:payout # Start payout sync worker
npm run worker:email  # Start email worker
npm run worker:balance # Start balance sync worker
```

**Frontend:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

See `.env.example` (server) and `.env.local.example` (client) for required configuration.

---

## 🌐 Production Deployment

**Before deploying to production:**

1. Review [`server/PRODUCTION_CHECKLIST.md`](./server/PRODUCTION_CHECKLIST.md)
2. Update all environment variables
3. Change JWT_SECRET and ENCRYPTION_KEY
4. Configure production MongoDB cluster
5. Set up SilkPay production credentials
6. Enable HTTPS and proper CORS
7. Review [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

---

## 📊 Architecture

**Backend:** Hybrid Modular Monolith
- 8 core modules (Auth, Merchant, Beneficiary, Payout, Transaction, Dashboard, Balance, Webhook)
- 3 background workers (Payout Sync, Balance Sync, Email)
- MongoDB for persistence and job queue

**Frontend:** Next.js with hybrid rendering
- SSR for dashboard/analytics
- CSR for real-time updates
- Client-side CSV export for tables
- Server-side report generation

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support

For issues and questions:
- **Issues:** [GitHub Issues](https://github.com/your-org/silkpay/issues)
- **Docs:** [Documentation](./docs/)
- **Email:** support@yourdomain.com

---

**Built with ❤️ for seamless payout management**
