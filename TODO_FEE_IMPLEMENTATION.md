# TODO: Implement Transaction Fee Tracking

## Context
The frontend `Transactions` page has been updated to display a `Fee` column, but the backend currently does not store or return this data.

## Implementation Steps

### 1. Database Schema Updates
- [ ] **Modify `Transaction` Model** (`server/src/modules/transaction/transaction.model.js`)
    - Add `fee` field:
      ```javascript
      fee: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
        get: (v) => v ? parseFloat(v.toString()) : 0
      }
      ```
- [ ] **Modify `Payout` Model** (`server/src/modules/payout/payout.model.js`) (Optional but recommended)
    - Add `fee` field to track fees per payout source.

### 2. Service Logic Updates
- [ ] **Update `PayoutService`** (`server/src/modules/payout/payout.service.js`)
    - In `createPayout`, calculate the fee.
    - **Method A (Fixed/Percentage)**:
      ```javascript
      const fee = calculateFee(data.amount, merchant.fee_rate);
      ```
    - **Method B (Response-based)**:
      - If Silkpay returns the fee in the response (currently not observed), extract it.
    - Pass the `fee` to `transactionService.createTransaction`.

- [ ] **Update `TransactionService`**
    - Ensure `createTransaction` accepts and saves the `fee`.

### 3. Verification
- [ ] Create a new payout.
- [ ] Check MongoDB `transactions` collection to ensure `fee` is saved.
- [ ] Verify frontend shows the correct fee in the "Fee" column.
