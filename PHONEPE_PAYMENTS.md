# PhonePe Dynamic QR Payments

Order-specific PhonePe Dynamic QR payments for the multi-merchant FlipCart app.
A customer triggers **Buy Now** / **Place Order**, the backend creates an
order-specific Dynamic QR, the customer pays with any UPI app, PhonePe calls our
verified webhook, and the backend marks the order **PAID**, credits the merchant
ledger, and creates notifications.

The implementation follows the existing project conventions: Mongoose models in
`app/server/modals`, services that return data or a `messages.*`/`errors.*`
sentinel, resource-route controllers (`*.controller.$.js`) using
`successResponse`/`errorResponse`, JWT-cookie auth via `getAuthUserFromRequest`,
and the `API_SERVICES` fetch client on the frontend.

---

## Files changed

### New — backend
| File | Purpose |
|---|---|
| `app/server/configs/phonepe.server.js` | Env-driven PhonePe config (base URL, salt, paths, expiry). |
| `app/server/modals/paymentOrder.modal.js` | `PaymentOrder` — order-specific payment intent + QR. |
| `app/server/modals/payment.modal.js` | `Payment` — settled/attempted payment record. |
| `app/server/modals/ledger.modal.js` | `MerchantLedger` — credit/debit + running balance. |
| `app/server/modals/notification.modal.js` | `Notification` — merchant/customer alerts. |
| `app/server/modals/webhookEvent.modal.js` | `WebhookEvent` — raw callback audit + idempotency. |
| `app/server/service/phonepe.service.js` | PhonePe wire layer: X-VERIFY, DQR init, callback verify, status. |
| `app/server/service/payment.service.js` | Orchestration: create order+QR, status, callback, ledger, notifications. |
| `app/server/controller/payment.controller.$.js` | `/api/payment/*` routes. |

### New — frontend
| File | Purpose |
|---|---|
| `app/routes/components/PhonePeQrModal.jsx` | QR modal with amount, expiry countdown, status polling. |
| `app/routes/components/merchant/MerchantPayments.jsx` | PhonePe setup form + paginated payment history. |

### Modified
| File | Change |
|---|---|
| `app/server/modals/merchant.modal.js` | Added `phonepeMerchantId/StoreId/TerminalId/ProviderId`, `phonepeOnboardingStatus`, `paymentEnabled`, `balance`; guarded model export. |
| `app/server/service/merchant.service.js` | Added `updatePhonePeSettings`, `getPhonePeSettings`, `getMerchantPayments`. |
| `app/server/controller/merchant.controller.$.js` | Added `loader` (GET settings/payments) + `payment-setup` action case. |
| `app/server/utils/constants/codes.js` | Added payment messages/errors + `paymentStatus`, `onboardingStatus`, `ledgerType` enums. |
| `app/routes.ts` | Registered `api/payment/*` and `merchant/payments` routes. |
| `app/routes/Services/Apis.js` | Added `savePhonePeSettings`, `getPhonePeSettings`, `getMerchantPayments`, `createPaymentQr`, `getPaymentStatus`. |
| `app/routes/components/ProductDetail.jsx` | **Buy Now** now creates a QR and opens the modal. |
| `app/routes/components/Checkout.jsx` | **Place Order** now creates a QR and opens the modal. |
| `app/routes/components/merchant/MerchantLayout.jsx` | Added "Payments" nav link. |
| `.env` | Added PhonePe env placeholders. |
| `package.json` | Added `qrcode` dependency (server-side QR image generation). |

---

## New APIs

All under `/api/` to match the existing convention.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payment/phonepe/create-qr` | Optional (customer) | Body `{ items: [{ productId, quantity, variant }] }`. Computes amount **server-side**, creates a `PaymentOrder`, calls PhonePe DQR init, returns `{ orderId, amount, currency, status, phonepeQrString, phonepeQrImage, phonepeTransactionId, expiresAt }`. |
| `POST` | `/api/payment/phonepe/callback` | None (X-VERIFY signature) | PhonePe server-to-server webhook. Verifies signature, dedupes, verifies amount, marks PAID, updates ledger + notifications. |
| `GET`  | `/api/payment/status/:orderId` | None (unguessable id) | Returns `{ orderId, paymentStatus, amount, currency, paidAt, phonepeTransactionId, providerReferenceId }`. Used by frontend polling. |
| `POST` | `/api/merchant/payment-setup` | Merchant | Save/update PhonePe details. Required: `phonepeMerchantId`, `phonepeStoreId`, `phonepeTerminalId`. Optional: `phonepeProviderId`, `paymentEnabled`. |
| `GET`  | `/api/merchant/payment-setup` | Merchant | Read current PhonePe settings + balance. |
| `GET`  | `/api/merchant/payments?page=&limit=&status=` | Merchant | Paginated payment history, scoped to the authenticated merchant only. |

---

## New environment variables

Added to `.env` (placeholders — replace `PHONEPE_SALT_KEY` with real credentials):

```
PHONEPE_ENV=sandbox                # sandbox | production
PHONEPE_BASE_URL=                  # blank = auto sandbox/prod host
PHONEPE_SALT_KEY=test-salt-key-replace-me
PHONEPE_SALT_INDEX=1
PHONEPE_CALLBACK_URL=http://localhost:5173/api/payment/phonepe/callback
PHONEPE_PROVIDER_ID=               # optional
# PHONEPE_QR_INIT_PATH=/v3/qr/init
# PHONEPE_STATUS_PATH=/v3/transaction/{merchantId}/{transactionId}/status
PHONEPE_QR_EXPIRY_SECONDS=300
```

The **salt key never leaves the server** — it is only read in `phonepe.server.js`
and used to compute/verify `X-VERIFY`. It is never sent to the frontend.

---

## Database models added

No SQL migrations (MongoDB). Collections are created on first write:

- **PaymentOrder** — `orderId` (unique), `merchantId`, `customerId?`, `items[]`,
  `amount`, `currency`, `status` (PENDING/PAID/FAILED/EXPIRED/CANCELLED),
  `phonepeTransactionId`, `phonepeMerchantOrderId`, `phonepeQrString`,
  `phonepeQrImage?`, `paidAt`, `expiresAt`, timestamps.
- **Payment** — `order`, `merchant`, `customer?`, `amount`, `status`,
  `phonepeTransactionId`, `providerReferenceId`, `paymentInstrument`,
  `responseCode`, `paidAt`.
- **MerchantLedger** — `merchantId`, `orderId`, `paymentId`, `credit`, `debit`,
  `balance` (running), `type`, `status`, `note`.
- **Notification** — `recipient`, `recipientType` (MERCHANT/CUSTOMER), `title`,
  `message`, `relatedOrder`, `read`.
- **WebhookEvent** — `dedupeKey` (unique → idempotency), `phonepeTransactionId`,
  `signatureValid`, `rawBody`, `decodedPayload`, `processed`, `processingError`.
- **Merchent** (extended) — `phonepeMerchantId`, `phonepeStoreId`,
  `phonepeTerminalId`, `phonepeProviderId`, `phonepeOnboardingStatus`,
  `paymentEnabled`, `balance`.

---

## How to test QR creation

1. Add PhonePe env vars to `.env`, run `npm run dev`.
2. Register a seller, then in **Seller Hub → Payments** fill the PhonePe fields
   (e.g. `PGTESTPAYUAT` / `STORE001` / `TERMINAL001`), tick **Enable PhonePe
   payments**, and Save.
3. Open a product owned by that merchant and click **Buy Now** (or add to cart →
   **Place Order**). The QR modal should open with the amount and a countdown.

API check (the merchant must have `paymentEnabled` + valid PhonePe sandbox creds):

```bash
curl -X POST http://localhost:5173/api/payment/phonepe/create-qr \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<PRODUCT_ID>","quantity":1}]}'
```

> With placeholder credentials the call to PhonePe will fail and the API returns
> `QR_GENERATION_FAILED` — expected until real sandbox creds are set. The order is
> still created (status FAILED) for traceability.

## How to test the webhook callback

Compute the `X-VERIFY` the same way PhonePe does — `SHA256(base64 + saltKey)###index`
— and POST it. Run this Node snippet (uses the `PHONEPE_SALT_KEY` from `.env`):

```js
// save as test-callback.mjs, then: node test-callback.mjs
import crypto from "node:crypto";

const SALT = "test-salt-key-replace-me";   // = PHONEPE_SALT_KEY
const INDEX = "1";
const TXN = "<phonepeTransactionId from create-qr>";
const AMOUNT_PAISE = 100 * /* order amount in INR */ 0; // set to amount*100

const payload = {
  success: true,
  code: "PAYMENT_SUCCESS",
  data: {
    merchantId: "PGTESTPAYUAT",
    transactionId: TXN,
    amount: AMOUNT_PAISE,
    state: "COMPLETED",
    responseCode: "SUCCESS",
    providerReferenceId: "P2406TEST",
    paymentInstrument: { type: "UPI" },
  },
};

const b64 = Buffer.from(JSON.stringify(payload)).toString("base64");
const xVerify = crypto.createHash("sha256").update(b64 + SALT).digest("hex") + "###" + INDEX;

const res = await fetch("http://localhost:5173/api/payment/phonepe/callback", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-VERIFY": xVerify },
  body: JSON.stringify({ response: b64 }),
});
console.log(res.status, await res.json());
```

Then `GET /api/payment/status/<orderId>` should return `paymentStatus: "PAID"`,
the open QR modal flips to "Payment successful", a `MerchantLedger` CREDIT and a
`Notification` are created, and the merchant `balance` increases.

Verifications to try:
- Wrong/blank `X-VERIFY` → `401 INVALID_SIGNATURE` (event logged, order untouched).
- Mismatched `amount` → `400 AMOUNT_MISMATCH` (order **not** marked paid).
- Re-POST the same body → `200 acknowledged` (idempotent, no double credit).

---

## Assumptions

- **Endpoint prefix**: spec paths like `/payment/...` are implemented under
  `/api/payment/...` to match the existing `/api/*` convention.
- **Order model**: payment orders use a new `PaymentOrder` model; the existing
  fulfillment-focused `Order` model is untouched.
- **One order = one seller**: PhonePe creds are per-merchant, so `create-qr`
  rejects carts mixing multiple sellers (`MIXED_MERCHANT_CART`). Buy Now always
  works. Multi-seller cart splitting is out of scope.
- **Amount is server-computed** from product price/discount — the client-sent
  amount is never trusted.
- **Status polling endpoint is public** (orderId is a random unguessable token);
  it does not require auth so guests can complete payment.
- **QR image** is generated server-side from the PhonePe QR string via the
  `qrcode` package and returned as a base64 data-URL (`phonepeQrImage`).
- **Notifications** are stored in a table with an integration hook
  (`createPaymentNotifications`) for a future push system.
- **Ledger update** runs in a Mongo transaction when supported (Atlas replica
  set) and falls back to atomic `$inc` + ledger write on standalone Mongo.

## TODOs (need real PhonePe credentials / product confirmation)

- Replace `PHONEPE_SALT_KEY` (and merchant `phonepeMerchantId/StoreId/TerminalId`)
  with real sandbox, then production values.
- Confirm `PHONEPE_QR_INIT_PATH` / `PHONEPE_STATUS_PATH` and the exact init
  payload fields against the PhonePe product enabled for the account (Standard
  Checkout vs DQR/Stores differ slightly) — see TODOs in
  `phonepe.service.js` / `phonepe.server.js`.
- `PHONEPE_CALLBACK_URL` must be a public HTTPS URL in production (use a tunnel
  like ngrok for local webhook testing).
- Confirm the success-state values PhonePe sends (`COMPLETED` / `PAYMENT_SUCCESS`)
  match production for your account; adjust `SUCCESS_STATES` in
  `payment.service.js` if needed.
- Admin override for editing PhonePe settings on behalf of a merchant is not
  implemented (only the owning merchant can edit their own settings today).
```
