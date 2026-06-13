import mongoose from "mongoose";
const schema = new mongoose.Schema({
    Brand: {
        type: String,
        required: true,
    },
    GST_NO: {
        type: String,
        required: true,
    },
    HeadOfficeAddress: {
        type: String,
        required: true,
    },
    OwnerName: {
        type: String,
        required: true,
    },
    OwnerPhone: {
        type: Number,
        required: true,
    },
    basicInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    prefaredCOuntries: {
        type: [String],
    },

    // ---- PhonePe Dynamic QR payment setup ----
    phonepeMerchantId: {
        type: String,
        default: "",
    },
    phonepeStoreId: {
        type: String,
        default: "",
    },
    phonepeTerminalId: {
        type: String,
        default: "",
    },
    phonepeProviderId: {
        type: String,
        default: "",
    },
    phonepeOnboardingStatus: {
        type: String,
        enum: ["NOT_STARTED", "PENDING", "ACTIVE", "REJECTED"],
        default: "NOT_STARTED",
    },
    paymentEnabled: {
        type: Boolean,
        default: false,
    },
    // Running settled balance (in INR), credited on each successful payment.
    balance: {
        type: Number,
        default: 0,
    },

});

const Merchent = mongoose.models.Merchent || mongoose.model("Merchent", schema);

export default Merchent;