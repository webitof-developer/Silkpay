# Beneficiary CRUD Semantics & Consistency Analysis

## 1. Current Beneficiary Lifecycle

*   **Create**: Creates a beneficiary with `status: 'ACTIVE'`, `type: 'REGULAR'`.
*   **Update**: Updates details (Name, Bank, etc.). Does not change status.
*   **Delete**: **Soft Delete**. Sets `status = 'INACTIVE'`.
    *   *Note*: The record remains in the database.
*   **List (Beneficiaries Page)**: Fetches ALL beneficiaries (Active + Inactive) by default.
    *   *Correction Needed*: The UI shows Inactive beneficiaries mixed with Active ones unless filtered.

## 2. Delete vs Inactive Semantics

*   **Backend Truth**: "Delete" = "Deactivate".
*   **Frontend Reality**: The user clicks "Delete", but the item remains in the list (just status changes to INACTIVE). Valid behavior for an audit-trail financial system, but might be confusing without a "Hide Inactive" filter standard.
*   **Risk**: If "deleted" (Inactive) beneficiaries are selectable for payouts, users might pay the wrong account.

## 3. Cross-Page Consistency Issues (🚨 CRITICAL)

### Payout Page Beneficiary Selector (`PayoutForm.jsx`)
*   **Issue 1: Inactive Selectable**: The form calls `api.get('/beneficiaries')` without `status=ACTIVE`.
    *   **Result**: "Deleted" (Inactive) beneficiaries appear in the dropdown. This is **unsafe**.
*   **Issue 2: The "First 10" Bug**: The form calls the API without `limit`.
    *   **Result**: Only the top 10 beneficiaries are available in the dropdown. You cannot select any beneficiary beyond the first 10.

### Beneficiaries Page
*   **Issue 3: No "Hide Inactive" Default**: Deleted items clutter the view.

## 4. Recommended Correct Model

1.  **Delete Action**: Should continue to be **Soft Delete (Deactivate)**. This is correct for financial data integrity.
2.  **Payout Selector**:
    *   **MUST** select only `ACTIVE` beneficiaries.
    *   **MUST** handle >10 beneficiaries (either increase limit or implement search-as-you-type).
3.  **Beneficiaries Page**:
    *   Should show Active & Inactive, but clearly visually distinguish them (already done via StatusBadge).
    *   Ideally, default to showing only 'Active' or providing a quick toggle? Current "All" defaults to consistency with "Ledger" view.

## 5. Required Changes

### backend-required (None)
*   The backend supports `status` filter correctly.

### UI-only Fixes (Recommended)
1.  **Update `PayoutForm.jsx`**:
    *   Fetch **only** `ACTIVE` beneficiaries: `api.get('/beneficiaries', { params: { status: 'ACTIVE', limit: 100 } })`.
    *   *Note*: Setting limit to 100 is a temporary patch. Real solution is async select, but 100 covers most SMB use cases for now.
2.  **Update `BeneficiariesPage`**:
    *   Ensure "Delete" action result is clear (e.g., toast saying "Beneficiary Deactivated").

## 6. UX Clarification
*   The system should correctly label the action as "Deactivate" if it doesn't disappear, OR hide Inactive items by default. Given the current "Delete" button, users expect removal.
*   **Proposal**: Keep "Delete" button, but in Payout Form, **HIDE** Inactive items. This aligns expectations (Deleted = Gone from usage).
