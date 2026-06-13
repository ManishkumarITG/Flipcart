import mongoose from "mongoose";

// A settled/attempted payment record tied to a PaymentOrder. Created or
// updated when PhonePe confirms the outcome via callback (or status reconcile).

const schema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            required: true,
            index: true,
        },
        merchant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchent",
            required: true,
            index: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        amount: {
            type: Number, // INR
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING",
        },
        provider: {
            type: String,
            default: "PHONEPE",
        },
        // PhonePe identifiers / response codes for reconciliation & support.
        phonepeTransactionId: {
            type: String,
            index: true,
        },
        providerReferenceId: {
            type: String,
        },
        paymentInstrument: {
            type: String, // e.g. UPI
        },
        responseCode: {
            type: String,
        },
        paidAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Payment = mongoose.models.Payment || mongoose.model("Payment", schema);

export default Payment;
