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
    HeadOfficeAddress   : {
        type: String,
        required: true, 
    },
    OwnerName : {
        type: String,
        required: true, 
    },
    OwnerPhone : {
        type: Number,
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
    
});

const Merchent = mongoose.model("Merchent", schema);

export default Merchent;