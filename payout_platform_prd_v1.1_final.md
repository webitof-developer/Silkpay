# Product Requirements Document (PRD)
## Payout Management Platform

**Document Version:** 1.2  
**Last Updated:** February 02, 2026  
**Status:** Implemented

---

## 1. Executive Summary

### 1.1 Product Overview
A specialized payout management platform that enables businesses to manage beneficiaries and execute financial payouts through a unified dashboard. The platform supports both one-time and recurring payouts with robust transaction tracking and reporting capabilities. Note: This platform is exclusively for payouts and does not process incoming payments (Payins).

### 1.2 Goals
- Streamline payout operations for businesses
- Provide real-time transaction visibility and reporting
- Enable efficient beneficiary management
- Ensure secure and compliant financial transactions
- Support multiple payout methods (Bank Transfer, UPI)

### 1.3 Success Metrics
- Transaction success rate > 95%
- Average payout processing time < 2 minutes
- Platform uptime > 99.5%
- User satisfaction score > 4.5/5

---

## 2. User Personas

### 2.1 Primary Users

**Finance Manager**
- Manages bulk payouts and reconciliation
- Needs detailed reporting and export capabilities
- Requires approval workflows for large transactions

**Operations Admin**
- Creates and manages beneficiaries
- Initiates payouts regularly
- Monitors transaction status

**Business Owner**
- Reviews financial summaries and dashboards
- Monitors platform balance and usage
- Makes strategic decisions based on payout trends

---

## 3. Core Features & Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 User Authentication
- **Login Page**
  - Email/username and password authentication
  - "Remember me" functionality
  - Password reset via email
  - Session timeout after 30 minutes of inactivity

#### 3.1.2 Merchant Center
- API credentials management (Secret Key)
- IP whitelisting for API security (Payout API)
- Merchant profile management
  - Merchant No.
  - Status (Active/Inactive)
  - Name
  - Mobile
  - Email
- Password change functionality

---

### 3.2 Dashboard

#### 3.2.1 Balance Overview
Display three key metrics at the top:
- **Available Balance** - Current usable funds
- **Pending Payout Amount** - Funds in processing
- **Total Balance** - Available + Pending

#### 3.2.2 Today's Payout Info
Real-time metrics for outgoing payments:
- Payout Pending Amount
- Payout Pending Fee
- Payout Pending Count
- Payout Count
- Payout Pending Rate (%)
- Success Payout Fee
- Success Payout Count
- Success Payout Amount
- Payout Success Rate (%)

---

### 3.3 Transaction Management


#### 3.3.2 Payout (Outgoing Payments)

**Payout List View**
- Columns:
  - Merchant No.
  - Merchant Order No.
  - Plat Order No.
  - Amount
  - Merchant Fee
  - Status (SUCCESS, FAILED)
  - Account Number
  - IFSC Code
  - UTR
  - Notify
  - Notify Time
  - Create Time
  - Update Time
  - Operate (Receipt button)

**Filters:**
- Merchant Order No.
- Plat Order No.
- Account Number
- Status (Select dropdown)
- Currency (INR, etc.)
- Create Time (Date range)
- Update Time (Date range)

**Actions:**
- Search
- Reset filters
- Export to CSV/Excel
- Receipt generation (PDF)

---

#### 3.3.3 Transaction Detail View

**Unified Detail Page** (Accessible from Payout list)
- Columns:
  - ID
  - Merchant No.
  - Merchant Order No.
  - Type (PAYOUT, REFUND, FEE)
  - Amount
  - Merchant Fee
  - Before Total Amount
  - After Total Amount
  - Before Avail Amount (Balance Before)
  - After Avail Amount (Balance After)
  - Description (e.g., "Payout Success", "Payout Rollback")
  - Create Time

**Filters:**
- Date Range
- Type (Payout, Refund, Fee)

**Actions:**
- Search
- Reset
- Export

---

### 3.4 Payout Creation & Management

#### 3.4.1 Create Payout Flow

**Step 1: Payout Type Selection**
- One-time Payout
- Regular/Recurring Payout (with beneficiary selection)

**Step 2: Payout Form**

For **One-time Payout:**
- Beneficiary Name*
- Mobile Number*
- Account Number*
- IFSC Code*
- Bank Name (auto-populated from IFSC or manual)
- UPI ID (Optional - Implemented)
- Amount*
- Description/Notes

For **Regular/Recurring Payout:**
- Select from Beneficiary List (dropdown/searchable)
- Amount*
- Description/Notes
- Schedule (if recurring):
  - Frequency (Daily, Weekly, Monthly)
  - Start Date
  - End Date (optional)

**Step 3: Review & Confirm**
- Summary of payout details
- Available balance check
- Fee calculation display
- Final amount to be debited

**Step 4: Proceed Payout**
- Submit button
- Success/Error notification
- Redirect to payout list or detail page

---

### 3.5 Beneficiary Management

#### 3.5.1 Beneficiary List
- Columns:
  - ID
  - Name
  - Mobile
  - Account Number
  - IFSC Code
  - Bank Name
  - UPI ID
  - Status (Active/Inactive)
  - Total Payouts
  - Total Amount Transferred
  - Created Date
  - Last Payout Date

**Actions:**
- Add New Beneficiary
- Edit Beneficiary
- Deactivate/Activate
- Delete (with confirmation)
- View Details

#### 3.5.2 Beneficiary Details Page
- Complete beneficiary information
- Transaction history with filters:
  - Date range
  - Status
  - Amount range
- Total statistics:
  - Total payouts
  - Total amount transferred
  - Success rate
  - Average payout amount

#### 3.5.3 Add/Edit Beneficiary Form
- Name*
- Mobile Number* (with validation)
- Account Number* (with validation)
- IFSC Code* (with bank name auto-fetch)
- Bank Name
- UPI ID (optional)
- Email (optional)
- Notes/Tags

**Validations:**
- IFSC code format validation
- Account number validation
- Mobile number format (10 digits)
- UPI ID format validation
- Duplicate account number check

---

### 3.6 Bank Account (Digital Wallet)

#### 3.6.1 Balance Display
- Current Available Balance (large display)
- Breakdown:
  - Total Balance
  - Available Balance
  - Reserved/Pending Amount
- Last updated timestamp

#### 3.6.2 Transaction Ledger
- All balance affecting transactions
- Filters:
  - Date range
  - Transaction type (Credit/Debit)
  - Source (Payout, Adjustment, Manual Credit, etc.)

#### 3.6.3 Add Funds (if applicable)
- Manual balance addition (admin only)
- Integration with payment gateway for top-up

---

### 3.7 Settings

#### 3.7.1 SilkPay Settings
- Platform configuration
- Notification preferences:
  - Email notifications for payouts
  - SMS notifications
  - Webhook URLs
- API webhook configuration
- Transaction limits:
  - Minimum payout amount
  - Maximum payout amount
  - Daily payout limit
- Security settings:
  - 2FA enable/disable
  - IP restrictions
  - Session timeout duration

#### 3.7.2 User Management (if multi-user)
- Add/Remove users
- Role assignment
- Permission management

---

## 4. Technical Requirements

### 4.1 API Integration

#### 4.1.1 Environment URLs
**Sandbox/Test Environment:**
- Base URL: `https://api.dev.silkpay.ai`
- Merchant Console: `https://merchant.silkpay.ai/` (for testing)

**Production Environment:**
- Primary Base URL: `https://api.silkpay.ai/`
- Backup Domain: `https://api.silkpay.help/`
- Merchant Console: `https://merchant.silkpay.help/`

**Documentation:**
- API Guide: https://silkpay.stoplight.io/docs/silkpay/branches/main/30sk57lgvy7qx-guide

**Important Setup Notes:**
1. After receiving production merchant account, login and change password immediately
2. Obtain the production secret key from 'Merchant Console' section
3. Add your service IP to the IP whitelist in Merchant Console
4. All requests and responses are in JSON format

#### 4.1.2 API Authentication
- **Secret Key Based Authentication:** Obtained from Merchant Console
- **IP Whitelisting:** Required for API security (add service IPs in Merchant Console)
- **Request Signing:** For secure API communication

#### 4.1.3 Core API Endpoints

**Workflow Overview:**
The SilkPay API follows a specific workflow for payout management:

| Step | API Endpoint | Method | Description |
|------|-------------|--------|-------------|
| 1 | `/transaction/payout` | POST | Create a payout order |
| 2 | `/transaction/payout/query` | POST | Query payout order status |
| 3 | `/callback` | POST | Receive callback notifications (merchant implements) |
| 4 | `/transaction/balance` | POST | Query merchant balance |

---

**Detailed API Specifications:**

**1. Create Payout Order**
- **Endpoint:** `POST /transaction/payout`
- **Description:** Create a new payout order to transfer funds to beneficiary
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "amount": "100.00",
  "mId": "TEST",
  "mOrderId": "o001",
  "timestamp": 1738917430509,
  "notifyUrl": "http://localhost/silkpay",
  "upi": "",
  "bankNo": "2983900989",
  "ifsc": "ICIC0000001",
  "name": "MAND",
  "sign": "d7ab0026e9c3059edabfb9b0a0a51df2"
}
```

**Request Parameters:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `amount` | string | Yes | Order amount in INR (e.g. "100.00") | "100.00" |
| `mId` | string | Yes | Merchant number (provided after account opening) | "TEST" |
| `mOrderId` | string | Yes | Merchant order number (max 64 characters, must be unique) | "o001" |
| `timestamp` | number | Yes | Timestamp in milliseconds | 1738917430509 |
| `notifyUrl` | string | Yes | Callback notification URL | "http://localhost/silkpay" |
| `upi` | string | No | UPI ID of beneficiary (optional) | "" |
| `bankNo` | string | No* | Bank account number of beneficiary | "2983900989" |
| `ifsc` | string | No* | IFSC code of beneficiary bank | "ICIC0000001" |
| `name` | string | Yes | Name of beneficiary | "MAND" |
| `sign` | string | Yes | MD5 signature: `md5(mId+mOrderId+amount+timestamp+secret)` (lowercase, 32 chars) | "d7ab0026e9c3059edabfb9b0a0a51df2" |

*Note: Either `upi` OR (`bankNo` + `ifsc`) must be provided

**Response (200 Success):**
```json
{
  "status": "200",
  "message": "success",
  "data": {
    "payOrderId": "DF-0207163775560828775345156"
  }
}
```

**Important Notes:**
- Request success (status 200) does NOT mean payment success
- Check actual payment status via callback or query endpoint
- `mOrderId` must be unique per merchant

---

**2. Query Payout Status**
- **Endpoint:** `POST /transaction/payout/query`
- **Description:** Check the status of existing payout orders
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "mId": "TEST",
  "mOrderId": "o001",
  "timestamp": 1738917430509,
  "sign": "c4725c96cb90acbf49bdfbf72ce41ed2"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mId` | string | Yes | Merchant number |
| `mOrderId` | string | Yes | Merchant order number |
| `timestamp` | number | Yes | Timestamp in milliseconds |
| `sign` | string | Yes | MD5 signature: `md5(mId+mOrderId+timestamp+secret)` (lowercase, 32 chars) |

**Response (200 Success):**
```json
{
  "status": "200",
  "message": "success",
  "data": {
    "amount": "100.00",
    "payOrderId": "DF-0207163775560828775345156",
    "utr": "null",
    "sign": "cd0b7a5cca06f7b9456692add9cae6ed",
    "mId": "TEST",
    "mOrderId": "o001",
    "status": "2",
    "timestamp": 1738917709881
  }
}
```

---

**3. Callback Handler (Merchant Implementation)**
- **Endpoint:** Provided by merchant in `notifyUrl` field
- **Method:** `POST`
- **Description:** Receive real-time notifications about payout status changes
- **Content-Type:** `application/json`

**Callback Payload (Sent by SilkPay):**
```json
{
  "amount": "102.33",
  "payOrderId": "DF-0207173510390431811270665",
  "mId": "TEST",
  "mOrderId": "12345679",
  "utr": "112233",
  "sign": "80f7eb17fec33a6b7963fc113484642a",
  "status": 2,
  "timestamp": 1687244719629
}
```

**Signature Verification:** `md5(mId+mOrderId+amount+timestamp+secret)`

**Required Merchant Response:**
- **Success:** Return plain text string `"OK"`
- **Content-Type:** `text/plain`

---

**4. Balance Inquiry**
- **Endpoint:** `POST /transaction/balance`
- **Description:** Query current merchant account balance
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "mId": "TEST",
  "timestamp": 1738917430509,
  "sign": "6fce1b7405dd7d11c0e45d3931c7ecb1"
}
```

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mId` | string | Yes | Merchant number |
| `timestamp` | number | Yes | Timestamp in milliseconds |
| `sign` | string | Yes | MD5 signature: `md5(mId+timestamp+secret)` (lowercase, 32 chars) |

**Response (200 Success):**
```json
{
  "status": "200",
  "message": "success",
  "data": {
    "availableAmount": 259.5,
    "pendingAmount": 0,
    "totalAmount": 259.5,
    "sign": null
  }
}
```

#### 4.1.4 Error Codes & Handling

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Request successful |
| 401 | Wrong password |
| 402 | Merchant no invalid |
| 403 | Merchant order no invalid / Wrong sign |
| 404 | Merchant order no max 64 / Merchant does not exist |
| 405 | Name is empty |
| 406 | Mobile is empty |
| 407 | Invalid IFSC code |
| 408 | Invalid bank account number |
| 409 | Account hold name is empty |
| 410 | Notify url is empty |
| 411 | Sign is empty |
| 412 | Param payAmount invalid |
| 413 | Order no invalid |
| 414 | Return url is empty |
| 415 | Order expired |
| 416 | Order/UTR submitted or Parameter missing |
| 506 | Channel is not available |
| 513 | Insufficient merchant balance |
| 515 | Merchant order exist |

#### 4.1.5 Signature Generation

All API requests require MD5 signature for authentication. The signature ensures request integrity and prevents tampering.

**Signature Algorithm:**
1. Concatenate required fields in specified order (no separators)
2. Append merchant secret key
3. Calculate MD5 hash
4. Convert to lowercase 32-character string

**Examples:**

**Create Payout Signature:**
`md5(mId + mOrderId + amount + timestamp + secret)`

**Query Status Signature:**
`md5(mId + mOrderId + timestamp + secret)`

**Balance Inquiry Signature:**
`md5(mId + timestamp + secret)`

**Callback Verification Signature:**
`md5(mId + mOrderId + amount + timestamp + secret)`

#### 4.1.6 Webhook/Callback Implementation

**Merchant Callback Requirements:**
1. **Endpoint Setup:** Merchant must provide a callback URL in the `notifyUrl` field when creating payout
2. **Response Protocol:** Must return plain text string "OK" upon successful receipt
3. **Retry Mechanism:** SilkPay retries callback every 5 minutes, maximum 5 attempts
4. **Security:** Validate callback signature to ensure authenticity
5. **Idempotency:** Handle duplicate callbacks gracefully (same order may trigger multiple callbacks)

**Callback Verification Steps:**
```javascript
// Example callback handler (Node.js/Express)
app.post('/silkpay/callback', async (req, res) => {
  const { mId, mOrderId, amount, timestamp, sign, status, utr, payOrderId } = req.body;
  
  // 1. Verify signature
  const expectedSign = generateSignature(
    [mId, mOrderId, amount, timestamp],
    YOUR_SECRET_KEY
  );
  
  if (sign !== expectedSign) {
    console.error('Invalid signature');
    return res.status(400).send('Invalid signature');
  }
  
  // 2. Check if order already processed (idempotency)
  const existingOrder = await db.findOrder(mOrderId);
  if (existingOrder && existingOrder.status === status) {
    return res.send('OK'); // Already processed
  }
  
  // 3. Process the callback
  await db.updateOrder(mOrderId, {
    status: status, // 2 = Success, 3 = Failed
    utr: utr,
    payOrderId: payOrderId,
    updated_at: new Date()
  });
  
  // 4. Send notifications, update UI, etc.
  if (status === 2) {
    await notifyUser('Payout successful');
  } else if (status === 3) {
    await notifyUser('Payout failed');
  }
  
  // 5. Return OK to confirm receipt
  res.send('OK');
});
```

**Important Security Notes:**
- Always verify signature before processing
- Log all callback attempts for audit
- Implement rate limiting on callback endpoint
- Use HTTPS for callback URLs
- Consider IP whitelisting for SilkPay servers

---

### 4.2 Technology Stack (Recommendations)

#### 4.2.1 Frontend

**Framework & Rendering:**
- **Framework:** Next.js 14+ (React.js)
- **Language:** JavaScript (ES6+)
- **Rendering Strategy:** Hybrid Approach
  - **SSR (Server-Side Rendering):** For dashboard, analytics, and initial page loads
  - **CSR (Client-Side Rendering):** For real-time updates and interactive components
  - **Static Generation:** For marketing pages and documentation
  
**UI & Styling:**
- **UI Library:** Shadcn UI + Tailwind CSS
- **State Management:** React Context + Hooks
- **Charts:** Recharts
- **Icons:** Lucide React

**Export & Download Handling - Hybrid Two-Tier Strategy:**

**1. Frontend-Driven Table Exports (Client-Side CSV):**
- **Use Case:** Quick exports of visible table data (Transactions, Payouts, Beneficiaries)
- **Implementation:** Client-side CSV generation from current filtered view
- **Benefits:** 
  - Instant downloads, no backend load
  - "What you see is what you get" - exports current page/filters
  - Perfect for quick data sharing
- **Limitations:** Limited to visible/loaded data

**2. Backend-Driven Dashboard Reports (Server-Side):**
- **Use Case:** Complex reports with historical data (Account Statements, Tax Reports)
- **Implementation:** 
  - Backend endpoint: `/api/reports/download` (or `/api/transactions/export` for transactions)
  - Server generates using `json2csv` for CSV, `pdfkit` or similar for PDF
  - "Download Reports" modal on Dashboard
- **Features:**
  - Report type selection (Account Statement, Transaction History, Tax Report)
  - Date range customization (Last 30 Days, This Month, Custom)
  - Format selection (PDF, CSV)
  - Max 10,000 records per export
- **Benefits:** 
  - Can generate large datasets beyond frontend memory limits
  - Complex formatting (PDFs with branding, multi-sheet Excel)
  - Consistent server-side logic

**When to Use Which:**
- ✅ **Frontend:** Quick exports, current table view, < 1000 records
- ✅ **Backend:** Formal reports, large datasets, PDFs, historical data

**Data Caching:** React Query for optimistic updates and background sync

**Key Implementation Details:**
- Next.js App Router for file-based routing
- API routes for frontend-backend integration (`/api/*` → Express backend)
- Environment-based configuration (`.env.local`)
- Responsive design (mobile-first approach)

#### 4.2.2 Backend Architecture: Hybrid Modular Monolith

**Architecture Decision:** The backend will use a **Hybrid Modular Monolith** approach with separate worker processes for background jobs.

**Main API Server (Express.js Monolith):**
- **Framework:** Node.js 18+ LTS with Express.js 4.x
- **Language:** JavaScript (ES6+ with CommonJS modules)
- **Database:** MongoDB 6.x with Mongoose ODM
- **Job Queue:** Agenda (MongoDB-based job scheduling)
- **Authentication:** JWT (jsonwebtoken) + bcryptjs for password hashing
- **API Design:** RESTful with feature-based modular organization

**Module Structure:**
The main API is organized into 8 feature modules, each self-contained with its own:
- Model (Mongoose schema)
- Service (Business logic)
- Controller (Request handlers)
- Routes (Express endpoints)
- Validator (Request validation)

**Core Modules:**
1. **Auth** - Login, JWT, password reset
2. **Merchant** - Profile, API keys, IP whitelist management
3. **Beneficiary** - Beneficiary CRUD operations
4. **Payout** - Payout creation and management
5. **Transaction** - Transaction ledger and history
6. **Dashboard** - Metrics, stats, analytics
7. **Balance** - Balance management and synchronization
8. **Webhook** - SilkPay callback handler

**Background Workers (Separate Processes):**
- **Payout Sync Worker** - Polls SilkPay API every 5 minutes for pending payout status updates
- **Email Worker** - Processes email jobs from MongoDB queue (Agenda)
- **Balance Sync Worker** - Syncs merchant balance with SilkPay hourly

**Why Hybrid Modular Approach:**
- ✅ **Clean separation** - Each feature is self-contained and independently testable
- ✅ **Single codebase** - Easier deployment and maintenance than microservices
- ✅ **Non-blocking** - Heavy tasks run in background workers
- ✅ **Scalable** - Workers can scale independently if needed
- ✅ **Maintainable** - Clear module boundaries prevent code entanglement
- ✅ **Simple infrastructure** - Only MongoDB required (no Redis)

**Technology Stack:**
- **Runtime:** Node.js 18+ LTS
- **Framework:** Express.js 4.x
- **Database:** MongoDB 6.x (Mongoose 8.x ODM)
- **Job Queue:** Agenda (MongoDB-based scheduling)
- **Validation:** Joi
- **Logging:** Winston
- **Testing:** Jest + Supertest
- **Process Management:** PM2 (production)
- **Rate Limiting:** express-rate-limit (memory store for single instance, MongoDB store for multi-instance)

**Session Management:**
- JWT tokens with expiration (no blacklist needed for most use cases)
- For logout: Client-side token deletion
- For enhanced security: Optional MongoDB-based token blacklist with TTL indexes

#### 4.2.3 Infrastructure
- **Hosting:** AWS, Azure, or GCP
- **Database:** MongoDB Atlas (managed cluster with replica set)
- **CDN:** CloudFlare
- **Monitoring:** New Relic or DataDog
- **Logging:** Winston + CloudWatch or ELK Stack
- **Process Management:** PM2 or Docker Compose

---

### 4.3 Security Requirements

#### 4.3.1 Data Security
- All sensitive data encrypted at rest (MongoDB Encryption at Rest, AES-256)
- Field-level encryption for sensitive data (Account Numbers, Mobile)
- TLS 1.3 for data in transit
- PCI DSS compliance for card data (if applicable)
- Regular security audits

#### 4.3.2 Authentication & Authorization
- Multi-factor authentication (2FA)
- Role-based access control (RBAC)
- Session management with automatic timeout
- Password policy enforcement (min 8 chars, special chars, etc.)

#### 4.3.3 API Security
- Rate limiting (per merchant)
- IP whitelisting
- Request signature validation
- API key rotation policy

#### 4.3.4 Audit Trail
- Complete audit log of all transactions
- User action logging
- Admin action logging
- Immutable transaction records

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time < 2 seconds
- API response time < 500ms for 95th percentile
- Support 1000+ concurrent users
- Database query optimization for large datasets

### 5.2 Scalability
- Horizontal scaling capability (MongoDB Sharding)
- Load balancing support
- Database sharding for transaction collections
- Caching strategy for frequently accessed data

### 5.3 Availability
- 99.9% uptime SLA
- Automated failover
- Regular backups (daily)
- Disaster recovery plan

### 5.4 Usability
- Responsive design (mobile, tablet, desktop)
- Intuitive navigation
- Consistent UI/UX patterns
- Accessibility compliance (WCAG 2.1 Level AA)

### 5.5 Compliance
- Data retention policy (7 years for financial records)
- GDPR compliance (if applicable)
- PCI DSS compliance
- Local financial regulations compliance

---

## 6. User Stories

### 6.1 As a Finance Manager

**Story 1: Bulk Payout Processing**
- I want to upload a CSV file with multiple beneficiary payouts
- So that I can process monthly salary payments efficiently

**Story 2: Transaction Reconciliation**
- I want to export transaction reports with filters
- So that I can reconcile accounts at month-end

**Story 3: Approval Workflow**
- I want to review and approve high-value payouts
- So that I can maintain financial controls

### 6.2 As an Operations Admin

**Story 4: Quick Payout**
- I want to create a one-time payout quickly
- So that I can handle urgent payment requests

**Story 5: Beneficiary Management**
- I want to add and manage beneficiaries
- So that I can streamline recurring payments

**Story 6: Status Tracking**
- I want to check the status of pending payouts
- So that I can respond to beneficiary inquiries

### 6.3 As a Business Owner

**Story 7: Dashboard Overview**
- I want to see a summary of today's transactions
- So that I can monitor business cash flow

**Story 8: Balance Monitoring**
- I want to receive alerts when balance is low
- So that I can add funds before payouts fail

---

## 7. UI/UX Specifications

### 7.1 Design System

#### 7.1.1 Color Palette
Based on screenshots:
- **Primary:** Deep Blue (#2C3E79)
- **Secondary:** Light Blue (#4A90E2)
- **Success:** Green (#52C41A)
- **Warning:** Orange (#FAAD14)
- **Error:** Red (#F5222D)
- **Background:** Light Gray (#F5F7FA)
- **Text Primary:** Dark Gray (#262626)
- **Text Secondary:** Medium Gray (#8C8C8C)

#### 7.1.2 Typography
- **Primary Font:** Inter or SF Pro
- **Headings:** 24px, 20px, 16px (Bold)
- **Body:** 14px (Regular)
- **Small Text:** 12px (Regular)

#### 7.1.3 Spacing
- Base unit: 8px
- Component padding: 16px, 24px
- Section margins: 24px, 32px

### 7.2 Navigation Structure

**Sidebar Navigation (Fixed Left):**
**Sidebar Navigation (Fixed Left):**
1. Dashboard (Home icon)
2. Transactions (List of Payouts)
3. Payouts (Direct link for quick access)
4. Beneficiary
5. Bank Account
6. Merchant Center
7. Settings

**Top Navigation:**
- Breadcrumb trail
- User profile dropdown
- Notifications bell
- Language selector (if multi-language)

### 7.3 Component Specifications

#### 7.3.1 Data Tables
- Sticky header
- Row hover effect
- Pagination (10, 25, 50, 100 rows)
- Column sorting
- Column visibility toggle
- Responsive (horizontal scroll on mobile)

#### 7.3.2 Forms
- Inline validation
- Error messages below fields
- Required field indicators (*)
- Help text/tooltips
- Auto-save drafts (for long forms)

#### 7.3.3 Buttons
- Primary: Solid color, for main actions
- Secondary: Outlined, for secondary actions
- Danger: Red, for destructive actions
- Sizes: Small (28px), Medium (32px), Large (40px)

#### 7.3.4 Cards
- White background
- Subtle shadow
- 8px border radius
- 16px padding
- Hover effect for clickable cards

---

## 8. Data Models (MongoDB Schemas)

### 8.1 Core Collections

#### 8.1.1 Merchant
```javascript
{
  _id: ObjectId,
  merchant_no: String, // Unique, Indexed
  name: String,
  email: String,
  mobile: String,
  status: String, // "ACTIVE", "INACTIVE", "SUSPENDED"
  secret_key: String, // Encrypted
  whitelist_ips: [String], // Array of allowed IPs for Payout API
  balance: {
     available: Decimal128,
     pending: Decimal128,
     total: Decimal128
  },
  created_at: Date,
  updated_at: Date
}
```

#### 8.1.2 Beneficiary
```javascript
{
  _id: ObjectId,
  merchant_id: ObjectId, // Reference to Merchant
  merchant_no: String, // Denormalized for query speed
  name: String,
  contact_info: {
      mobile: String,
      email: String
  },
  bank_details: {
      account_number: String, // Encrypted
      ifsc_code: String,
      bank_name: String,
      upi_id: String
  },
  status: String, // "ACTIVE", "INACTIVE"
  stats: {
      total_payouts: Number,
      total_amount: Decimal128,
      last_payout_date: Date
  },
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

#### 8.1.3 Payout
```javascript
{
  _id: ObjectId,
  merchant_id: ObjectId, // Indexed
  merchant_no: String, // Denormalized
  merchant_order_no: String, // Unique per merchant
  plat_order_no: String, // Unique global
  beneficiary: { // Embedded Snapshot of Beneficiary at time of payout
      id: ObjectId,
      name: String,
      mobile: String,
      account_number: String, // Masked/Encrypted
      ifsc_code: String,
      bank_name: String,
      upi_id: String
  },
  amount_details: {
      amount: Decimal128,
      merchant_fee: Decimal128,
      currency: String, // Default "INR"
  },
  status: String, // "CREATED", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED"
  utr: String,
  notifications: {
      notify_status: Boolean,
      notify_time: Date
  },
  failure_reason: String,
  description: String,
  created_at: Date,
  updated_at: Date,
  processed_at: Date
}
```

#### 8.1.4 Transaction (Ledger)
```javascript
{
  _id: ObjectId,
  merchant_id: ObjectId, // Indexed
  merchant_no: String, // Denormalized
  merchant_order_no: String,
  type: String, // "PAYOUT", "ADJUSTMENT", "REFUND", "BONUS"
  amount: Decimal128,
  fee: Decimal128,
  balance_snapshot: {
      before_total: Decimal128,
      after_total: Decimal128,
      before_available: Decimal128,
      after_available: Decimal128
  },
  description: String,
  reference_id: ObjectId, // Reference to Payout ID
  created_at: Date
}
```

### 8.2 MongoDB Indexing Strategy

#### 8.2.1 Payout Collection Indexes
- `{ merchant_id: 1, created_at: -1 }`: Efficiently get latest payouts for a merchant.
- `{ merchant_order_no: 1, merchant_id: 1 }`: Unique constraint enforce & lookups.
- `{ plat_order_no: 1 }`: Global lookup by platform ID.
- `{ status: 1, created_at: 1 }`: Queue processing and status monitoring.

#### 8.2.2 Beneficiary Collection Indexes
- `{ merchant_id: 1, "bank_details.account_number": 1 }`: Prevent duplicate beneficiaries per merchant.
- `{ merchant_id: 1, name: 1 }`: Search beneficiaries by name.

#### 8.2.3 Merchant Collection Indexes
- `{ merchant_no: 1 }`: Unique index for fast merchant lookup.
- `{ email: 1 }`: Login and profile lookup.

#### 8.2.4 Transaction Collection Indexes
- `{ merchant_id: 1, created_at: -1 }`: Ledger history.
- `{ reference_id: 1 }`: Trace transaction back to payout.

---

## 9. Workflow Diagrams

### 9.1 Payout Creation Workflow

```
[Start] → [User Clicks "Create Payout"]
   ↓
[Select Payout Type]
   ↓
[One-time] → [Fill Form] → [Validate] → [Review] → [Confirm]
   |                                                    ↓
[Recurring] → [Select Beneficiary] → [Fill Amount] → [Review] → [Confirm]
                                                                   ↓
                                        [Check Balance Sufficient?]
                                             ↓ Yes          ↓ No
                                        [Submit to API]   [Show Error]
                                             ↓
                                        [Processing]
                                             ↓
                                    [Success/Failed]
                                             ↓
                                        [Notification]
                                             ↓
                                           [End]
```

### 9.2 Payout Processing (Backend)

```
[Payout Created] → [Validate Request]
       ↓
[Check Balance] → [Insufficient] → [Mark as FAILED]
       ↓ Sufficient
[Reserve Amount] → [Update Balance]
       ↓
[Call Bank API]
       ↓
[Pending Response] → [Poll Status / Webhook]
       ↓
[Success] → [Update Status] → [Release Reserved Amount] → [Send Notification]
   |
[Failed] → [Update Status] → [Rollback Amount] → [Send Notification]
```

---

## 10. Testing Requirements

### 10.1 Unit Testing
- All API endpoints
- Business logic functions
- Data validation functions
- Target: 80%+ code coverage

### 10.2 Integration Testing
- API integration with payment gateway
- Webhook handling
- Database transactions
- Third-party service integrations

### 10.3 User Acceptance Testing (UAT)
- End-to-end workflows
- Edge cases and error scenarios
- Cross-browser testing
- Mobile responsiveness

### 10.4 Performance Testing
- Load testing (1000+ concurrent users)
- Stress testing (peak load scenarios)
- API response time benchmarking
- Database query optimization

### 10.5 Security Testing
- Penetration testing
- Vulnerability scanning
- API security testing
- Data encryption verification

---

## 11. Deployment & DevOps

### 11.1 Deployment Strategy
- **Staging Environment** for UAT
- **Production Environment** with blue-green deployment
- **Rollback Plan** for failed deployments

### 11.2 CI/CD Pipeline
- Automated testing on every commit
- Code quality checks (ESLint, SonarQube)
- Automated deployment to staging
- Manual approval for production deployment

### 11.3 Monitoring & Alerting
- Application performance monitoring
- Error tracking (Sentry)
- Transaction monitoring
- Balance threshold alerts
- API health checks

### 11.4 Backup & Recovery
- Daily automated database backups
- Point-in-time recovery capability
- Disaster recovery testing (quarterly)

---

## 12. Future Enhancements (Phase 2+)

### 12.1 Advanced Features
- **Bulk Upload:** CSV/Excel upload for mass payouts
- **Approval Workflows:** Multi-level approval for large transactions
- **Scheduled Payouts:** Automated recurring payments
- **Advanced Analytics:** Transaction trends, success rate analytics
- **Multi-Currency Support:** Support for USD, EUR, etc.
- **Mobile App:** Native iOS and Android apps

### 12.2 Integration Enhancements
- **Accounting Software Integration:** QuickBooks, Tally, Zoho Books
- **ERP Integration:** SAP, Oracle
- **HR System Integration:** For salary payouts
- **WhatsApp Notifications:** Transaction updates via WhatsApp

### 12.3 Reporting Enhancements
- **Custom Report Builder**
- **Scheduled Reports** (daily, weekly, monthly)
- **Export to PDF, Excel, CSV**
- **Data Visualization Dashboard**

---

## 13. Documentation Requirements

### 13.1 Technical Documentation
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Architecture diagrams
- Deployment guides

### 13.2 User Documentation
- User manual
- Quick start guide
- Video tutorials
- FAQs

### 13.3 Developer Documentation
- Setup instructions
- Code contribution guidelines
- API integration examples
- Troubleshooting guide

---

## 14. Timeline & Milestones

### Phase 1: Foundation (Weeks 1-4)
- Project setup and environment configuration
- Database design and setup
- Authentication system
- Basic dashboard

### Phase 2: Core Features (Weeks 5-10)
- Payout creation and management
- Beneficiary management
- Transaction listing and filtering
- API integration

### Phase 3: Advanced Features (Weeks 11-14)
- Balance management
- Settings and configuration
- Reporting and exports
- Notifications

### Phase 4: Testing & Refinement (Weeks 15-16)
- UAT
- Bug fixes
- Performance optimization
- Security audit

### Phase 5: Deployment (Week 17-18)
- Production deployment
- User training
- Go-live support

---

## 15. Risks & Mitigation

### 15.1 Technical Risks
**Risk:** API integration failures
- **Mitigation:** Comprehensive testing, fallback mechanisms, retry logic

**Risk:** Database performance issues with large datasets
- **Mitigation:** Query optimization, indexing, caching strategy

### 15.2 Security Risks
**Risk:** Unauthorized access or data breach
- **Mitigation:** Strong authentication, encryption, regular security audits

**Risk:** API key compromise
- **Mitigation:** Key rotation policy, IP whitelisting, monitoring

### 15.3 Business Risks
**Risk:** User adoption challenges
- **Mitigation:** Comprehensive training, intuitive UI, support documentation

**Risk:** Regulatory compliance issues
- **Mitigation:** Legal review, compliance consulting, regular audits

---

## 15. Risks & Mitigation

### 16.1 Technical Risks
**Risk:** API integration failures
- **Mitigation:** Comprehensive testing, fallback mechanisms, retry logic

**Risk:** Database performance issues with large datasets
- **Mitigation:** Query optimization, indexing, caching strategy

**Risk:** Channel unavailability (Error 506)
- **Mitigation:** Implement queue-based retry mechanism, show clear status to users, provide alternative channels if available

### 16.2 Security Risks
**Risk:** Unauthorized access or data breach
- **Mitigation:** Strong authentication, encryption, regular security audits

**Risk:** API key compromise
- **Mitigation:** Key rotation policy, IP whitelisting, monitoring

**Risk:** Callback spoofing
- **Mitigation:** Signature verification, IP verification, request logging

### 16.3 Business Risks
**Risk:** User adoption challenges
- **Mitigation:** Comprehensive training, intuitive UI, support documentation

**Risk:** Regulatory compliance issues
- **Mitigation:** Legal review, compliance consulting, regular audits

**Risk:** Insufficient merchant balance leading to failed payouts
- **Mitigation:** Balance threshold alerts, automated low balance notifications, clear balance visibility on dashboard

---

## 16. Appendix

### 16.1 Glossary
- **Payout:** Outgoing payment transaction from merchant to beneficiary
- **UTR:** Unique Transaction Reference - Bank-provided unique identifier for successful transactions
- **IFSC:** Indian Financial System Code - 11-character code identifying bank branches
- **UPI:** Unified Payments Interface - Indian instant payment system
- **Merchant Fee:** Transaction processing fee charged by SilkPay
- **Merchant Order No:** Unique identifier generated by merchant for each payout
- **Plat Order No:** Unique identifier generated by SilkPay platform for each payout
- **Available Balance:** Funds available for immediate payouts
- **Pending Amount:** Funds reserved for payouts being processed
- **Secret Key:** API authentication credential obtained from Merchant Console
- **Callback:** Webhook notification sent to merchant's endpoint on transaction status changes
- **Channel:** Payment processing route/method used for executing payouts

### 16.2 References
- SilkPay API Documentation: https://silkpay.stoplight.io/docs/silkpay/branches/main/30sk57lgvy7qx-guide
- Production API: https://api.silkpay.ai/
- Production Console: https://merchant.silkpay.help/
- Backup API: https://api.silkpay.help/
- Backup Console: https://merchant.silkpay.help/
- Test API: https://api.dev.silkpay.ai
- Test Console: https://merchant.silkpay.ai/

### 16.3 API Error Code Quick Reference
| Code | Description | Action Required |
|------|-------------|----------------|
| 200 | Request successful | Continue processing |
| 401 | Wrong password | Check authentication credentials |
| 403 | Wrong signature | Verify request signing implementation |
| 404 | Merchant does not exist | Verify merchant account setup |
| 416 | Parameter missing | Check required parameters in request |
| 506 | Channel is not available | Retry later or contact support |
| 513 | Insufficient merchant balance | Add funds to merchant account |
| 515 | Merchant order exists | Use unique merchant order number |

### 16.4 Revision History
### 17.4 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 28, 2026 | Product Team | Initial draft |
| 1.1 | Jan 29, 2026 | Product Team | Updated with actual SilkPay API endpoints, error codes, and FAQ section. Removed payin functionality to focus on payout-only platform. |

---

**Document Approval:**
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] Business Stakeholder
