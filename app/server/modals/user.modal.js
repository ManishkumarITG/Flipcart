import mongoose from "mongoose";
const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
    },
    wishlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wishlist",
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
    },
    merchentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Merchent",
        default: null,
    },
});

const User = mongoose.model("User", schema);

export default User;    