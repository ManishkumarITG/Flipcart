import mongoose from "mongoose";

// Double-entry style ledger for merchant balances. Every successful payment
// writes one CREDIT row carrying the running balance after the entry, so the
// merchant's balance is always auditable from this table.

const schema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchent",
            required: true,
            index: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            default: null,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            default: null,
        },
        credit: {
            type: Number,
            default: 0,
        },
        debit: {
            type: Number,
            default: 0,
        },
        // Running balance after this entry was applied.
        balance: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["CREDIT", "DEBIT"],
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "SETTLED", "REVERSED"],
            default: "SETTLED",
        },
        note: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const MerchantLedger =
    mongoose.models.MerchantLedger || mongoose.model("MerchantLedger", schema);

export default MerchantLedger;
