import mongoose from "mongoose";

// Raw audit log of every PhonePe callback we receive. The unique `dedupeKey`
// gives us idempotency: a duplicate callback for the same transaction+state is
// rejected at the DB layer, so payment processing runs at most once.

const schema = new mongoose.Schema(
    {
        provider: {
            type: String,
            default: "PHONEPE",
        },
        // transactionId + ":" + state — stable across retries of the same event.
        dedupeKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        phonepeTransactionId: {
            type: String,
            index: true,
        },
        // Whether the X-VERIFY signature on the callback validated.
        signatureValid: {
            type: Boolean,
            default: false,
        },
        // Raw, untrusted payload as received (base64 + decoded) for debugging.
        rawBody: {
            type: mongoose.Schema.Types.Mixed,
        },
        decodedPayload: {
            type: mongoose.Schema.Types.Mixed,
        },
        // Did we successfully act on this event (mark order paid etc.)?
        processed: {
            type: Boolean,
            default: false,
        },
        processingError: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const WebhookEvent =
    mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", schema);

export default WebhookEvent;
