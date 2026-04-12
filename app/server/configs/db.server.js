import mongoose from "mongoose";

const MONGO_URI = process.env.DB_URL;

if (!MONGO_URI) {
    throw new Error("Please define DB_URL in .env");
}

let cached = global._mongoose;

if (!cached) {
    cached = global._mongoose = {
        conn: null,
        promise: null,
    };
}

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, {
            bufferCommands: false,
        })
            .then((mongoose) => {
                console.log("MongoDB Connected ✅");
                return mongoose;
            })
            .catch((err) => {
                cached.promise = null; // important
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
