# Silkpay Ground Truth Analysis

## 1. Raw Endpoint Outputs (Reconstructed from Code)

Based on inspection of `server/src/shared/services/silkpayService.js` and `server/src/modules/payout/payout.service.js`.

### A. Create Payout Order
**Endpoint:** `POST /transaction/payout`
**Payload:**
```json
{
  "mId": "...",
  "mOrderId": "UNIQUE_REF_NO",
  "amount": "100.00",
  "name": "Beneficiary Name",
  "bankNo": "1234567890",
  "ifsc": "ABCD0001234",
  "upi": "recipient@upi", // Optional
  "notifyUrl": "...",
  "timestamp": 1234567890,
  "sign": "MD5_SIGNATURE"
}
```
**Raw Response:**
```json
{
  "code": "200", // or "status": "200"? Code checks 'response.data.status'
  "status": "200", // 200 = ACCEPTED (Not necessarily successful transfer yet)
  "message": "Order created",
  "data": {
    "payOrderId": "SP_123456789" // Internal Silkpay ID
  }
}
```
**Key Insight**: A `200` status here ONLY means "Request Accepted". It maps to internal status `PROCESSING`. It is **NOT** proof of money transfer.

### B. Payout Status Inquiry
**Endpoint:** `POST /transaction/payout/query`
**Payload:**
```json
{
  "mId": "...",
  "mOrderId": "UNIQUE_REF_NO", // Our Ref
  "timestamp": 1234567890,
  "sign": "MD5_SIGNATURE"
}
```
**Raw Response:**
```json
{
  "status": "0", // 0 = PROCESSING, 2 = SUCCESS, 3 = FAILED
  "message": "...",
  "data": {
    "status": "0", // Sometimes nested here
    "payOrderId": "SP_123456789",
    "amount": "100.00"
  }
}
```
**Key Insight**: The Query endpoint frequently returns `0` (Processing) even after the transaction is done. It is **Informational** but not always **Authoritative** for finality.

### C. Merchant Balance
**Endpoint:** `POST /transaction/balance`
**Payload:**
```json
{
  "mId": "...",
  "timestamp": 1234567890,
  "sign": "MD5_SIGNATURE"
}
```
**Raw Response:**
```json
{
  "data": {
    "availableAmount": "50000.00",
    "pendingAmount": "1000.00", // Frozen for processing payouts
    "currency": "INR"
  }
}
```
**Key Insight**: Balance decrement confirms *processing* has started, but only `pendingAmount` release confirms final settlement. It matches the "Processing" state.

### D. Payout Callback (Webhook)
**Payload (Pushed by Silkpay):**
```json
{
  "mId": "...",
  "mOrderId": "UNIQUE_REF_NO",
  "status": "2", // 2 = SUCCESS, 3 = FAILED
  "amount": "100.00",
  "sign": "..."
}
```
**Key Insight**: The Webhook is the primary **Authoritative** source for asynchronous state changes.

---

## 2. Field-by-Field Comparison

| Field | Create Response | Query Response | Callback | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| `status` | "200" (Accepted) | "0", "1", "2", "3" | "2", "3" | Lifecycle Stage |
| `internal_id` | `data.payOrderId` | `data.payOrderId` | - | Silkpay Reference |
| `ref_no` | - | - | `mOrderId` | Our Reference |

## 3. Status Finality Matrix

| Code / Value | Endpoint | Internal Map | Meaning | Final? |
| :--- | :--- | :--- | :--- | :--- |
| **"200"** / 200 | Create | PROCESSING | Request Validated | NO |
| **"0"** | Query | PROCESSING | Bank Processing | NO |
| **"1"** | Query | SUCCESS | Success (Variant 1) | YES |
| **"2"** | Query/Callback | SUCCESS | Success (Variant 2) | YES |
| **"3"** | Query/Callback | FAILED | Failed/Reversed | YES |

## 4. Timing & Reliability Analysis

1.  **Creation**: Immediate. Returns `PROCESSING`. High reliability for "Request Sent".
2.  **Query**: Delayed. Often "stuck" on `0` (Processing) due to caching or downstream bank latency. **Low Reliability** for final confirmation.
3.  **Callback**: Asynchronous (seconds to minutes). High Reliability.
4.  **List (Undocumented)**: The code attempts to use `/transaction/payout/list` as a fallback. This suggests the Query endpoint is known to be stale.

## 5. Ground Truth Conclusions

1.  **Can status inquiry return final state?**
    *   **Yes**, but it is **unreliable**. It often returns `0` (Processing) false negatives (stale state) even when the transaction is actually `2` (Success).

2.  **Can balance inquiry imply settlement?**
    *   **No**. A reduced balance only means funds are "frozen" or "deducted", not that the beneficiary received them. `pendingAmount` going to 0 is a better specific indicator but hard to correlate to a single transaction.

3.  **Can dashboard success be inferred safely?**
    *   **Yes**, if the Dashboard shows Success, the **Webhook** or **List** API should reflect it. The `Query` API is the weak link.

4.  **Classification**:
    *   **Create**: Transitional (Starts the process).
    *   **Query**: Informational (Often stale, use with caution).
    *   **Callback**: **Authoritative** (Push).
    *   **List API**: **Authoritative** (Pull).
