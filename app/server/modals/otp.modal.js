import mongoose from "mongoose";

// Holds a pending sign-up until the emailed OTP is verified. The user row in
// the User collection is only created AFTER a correct OTP is submitted, so we
// stash the registration details here in the meantime.
//
// One document per email (purpose = "signup"); requesting a new OTP overwrites
// the previous one. The `codeHash` is a salted SHA-256 of the 6-digit code —
// we never store the raw OTP. Expired documents are auto-removed by the TTL
// index on `expiresAt`.
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    purpose: {
        type: String,
        default: "signup",
    },
    // Registration details captured at request time, used to create the User
    // once the OTP is verified.
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
    },
    // Salted SHA-256 hash of the 6-digit code.
    codeHash: {
        type: String,
        required: true,
    },
    // Number of wrong verification attempts; used to lock out brute force.
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// One pending OTP per (email, purpose).
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
// TTL index: Mongo removes the doc once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);

export default Otp;
