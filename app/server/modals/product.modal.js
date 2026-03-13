import mongoose from "mongoose";
const schema = new mongoose.Schema({
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
    ratting : {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    createdAt: {    
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Product = mongoose.model("Product", schema);
export default Product;