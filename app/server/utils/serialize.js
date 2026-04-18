import mongoose from "mongoose";

function convert(value) {
    if (value == null) return value;

    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Buffer.isBuffer(value)) return value.toString("base64");

    if (Array.isArray(value)) return value.map(convert);

    if (typeof value === "object") {
        if (typeof value.toObject === "function") value = value.toObject();
        const out = {};
        for (const key of Object.keys(value)) {
            if (key === "__v") continue;
            out[key] = convert(value[key]);
        }
        return out;
    }

    return value;
}

export function serializeDoc(doc) {
    return doc == null ? doc : convert(doc);
}

export function serializeDocs(docs) {
    return Array.isArray(docs) ? docs.map(convert) : [];
}
