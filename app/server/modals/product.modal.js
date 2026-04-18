import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
    { _id: false }
);

const variantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        value: { type: String, required: true },
        images: { type: [imageSchema], default: [] },
    },
    { _id: false }
);

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        Merchent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchent",
            required: true,
        },
        rating: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "draft", "out_of_stock"],
            default: "active",
        },
        images: {
            type: [imageSchema],
            default: [],
        },
        variants: {
            type: [variantSchema],
            default: [],
        },
    },
    { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", schema);
export default Product;
