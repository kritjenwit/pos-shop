# ADR-0018: Receipt Upload After Order Completion

Added `uploadReceipt(transactionId, file)` to `orders.ts` — uploads the receipt file then updates the transaction's `receipt_url` in a single function. Added an `allowUpload` prop to `TransactionDetailView` that, when true, renders a file input and "Upload Receipt" / "Replace Receipt" button below the existing receipt image. The staff `TransactionDetail.tsx` passes `allowUpload={true}` and `onUpload={uploadReceipt}`; the customer wrapper (`CustomerTransactionDetail.tsx`) does not.

**Key constraint**: The receipt upload is separate from `confirmPayment` — it can happen at any time after an order is completed, not only during payment confirmation. The `uploadReceipt` function does not change the order status; it only updates the receipt URL field. This avoids coupling file upload to payment workflow.
