import mongoose from "mongoose";

// Lightweight notification store. The payment flow writes a row for the
// merchant and (when known) the customer on a successful payment. If/when a
// real push system is added, fan these out from the same creation hook.

const schema = new mongoose.Schema(
    {
        // Who should see this notification.
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        recipientType: {
            type: String,
            enum: ["MERCHANT", "CUSTOMER"],
            required: true,
        },
        type: {
            type: String,
            default: "PAYMENT",
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentOrder",
            default: null,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification =
    mongoose.models.Notification || mongoose.model("Notification", schema);

export default Notification;
