# Payout Page Analysis

## 1. Page Overview

The **Payouts Page** (`client/src/app/payouts/page.js`) currently uses a **Client-Side Filtering & Pagination** pattern on top of a potentially limited Backend API.

*   **Data Fetching**: Calls `api.get('/payouts')` on mount.
*   **Filtering**: All filters (Status, Source, Account, Amount, Date) are applied in memory via `filteredPayouts`.
*   **Pagination**: Handled internally by `DataTable` (Client-Side).

## 2. Issues & Risks

### 🚨 Critical: The "First 20" Problem
*   **Current Behavior**: The frontend requests `/payouts` without parameters.
*   **Backend Behavior**: The backend (per `payout.service.js` analysis from previous tasks) typically acts on a default limit (e.g., 20 or 50).
*   **Result**: The frontend only receives the *most recent* 20 payouts.
    *   **Search Failure**: Searching for a beneficiary paid last month returns 0 results because they aren't in the top 20.
    *   **Filter Failure**: Filtering by "FAILED" only shows failures within the last 20 transactions.
    *   **Export Failure**: "Export CSV" only exports the visible slice (or the client-side filtered list of the top 20).

### ⚠️ Beneficiary Source Logic
*   **Logic**: `source: (p.beneficiary_id?.type === 'ONE_TIME') ? 'ONE_TIME' : 'SAVED'`
*   **Risk**: If `beneficiary_id` is not populated (i.e., it's just an ObjectId string), `p.beneficiary_id?.type` is `undefined`, and the source incorrectly defaults to `SAVED`.

## 3. Data Flow & Pagination (Recommended Refactor)

The page needs to be refactored to **Server-Side Pagination** to match the Transactions page.

*   **New Flow**:
    1.  UI State (`page`, `limit`, `filters`) -> `useEffect`.
    2.  `useEffect` -> `api.get('/payouts', { params: ... })`.
    3.  Backend returns matched results + total count.
    4.  `DataTable` uses `manualPagination={true}` to display the page.

## 4. Status Handling

*   **Displayed Statuses**: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `REVERSED`.
*   **Sync Logic**: The `handleSyncStatus` function (`PUT /payouts/:id/status` or `GET`) is correctly implemented and should remain.
*   **Visuals**: `StatusBadge` is used correctly.

## 5. Amount Field Analysis

*   **Current Handling**:
    ```javascript
    amount: p.amount?.$numberDecimal ? parseFloat(p.amount.$numberDecimal) : ...
    ```
    *   **Status**: ✅ Correctly extracts `Decimal128` values.
    *   **Note**: The Payout Model uses a getter `get: (v) => parseFloat(...)`, but sending over API often sends the raw object `{ $numberDecimal: ... }`. The frontend code handles both cases safely.

## 6. Field Display Recommendations

| Field | Visibility | Reasoning |
| :--- | :--- | :--- |
| **Order ID** | ✅ MUST | Essential for tracking (Silkpay ID vs Internal ID). |
| **Beneficiary** | ✅ MUST | Name + "One-Time" badge. |
| **Account** | ✅ MUST | Verification target. |
| **Amount** | ✅ MUST | Core value. |
| **Status** | ✅ MUST | Core state. |
| **UTR** | ✅ MUST | Proof of payment (often missing until Success/Sync). |
| **Date** | ✅ MUST | Audit trail. |
| **Actions** | ✅ MUST | Receipt (Success) or Sync (Processing). |

## 7. Next Steps

1.  **Refactor to Server-Side**:
    *   Adopt the pattern from `TransactionsPage`.
    *   Use `useMemo` for `queryParams`.
    *   Pass `manualPagination={true}` to `DataTable`.
2.  **Fix Source Logic**:
    *   Ideally backend should return a top-level `source` field.
    *   Frontend failsafe: If `beneficiary_details` is present but `beneficiary_id` is absent/string, assume `ONE_TIME` if not explicitly linked? (Needs backend clarification).
