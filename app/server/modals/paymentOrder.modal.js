import mongoose from "mongoose";

// An order-specific PhonePe payment intent. Kept separate from the
// fulfillment-focused Order model so payment status never collides with
// shipping status. One PaymentOrder == one merchant == one Dynamic QR.

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        title: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true }, // final price per unit (INR)
        variant: {
            name: { type: String },
            value: { type: String },
        },
    },
    { _id: false }
);

const schema = new mongoose.Schema(
    {
        // Internal, unguessable order reference exposed to the frontend.
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchent",
            required: true,
            index: true,
        },
        // Optional — guests may pay without an account.
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        items: {
            type: [orderItemSchema],
            default: [],
        },
        amount: {
            type: Number, // total payable in INR (rupees)
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        // ---- PhonePe references ----
        phonepeTransactionId: {
            type: String,
            index: true,
            sparse: true,
        },
        phonepeMerchantOrderId: {
            type: String,
        },
        phonepeQrString: {
            type: String,
        },
        phonepeQrImage: {
            type: String, // base64 data-URL, optional
        },
        paidAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

const PaymentOrder =
    mongoose.models.PaymentOrder || mongoose.model("PaymentOrder", schema);

export default PaymentOrder;
