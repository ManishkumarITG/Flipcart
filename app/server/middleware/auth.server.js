import jwt from "jsonwebtoken";
import { parse } from "cookie";

export async function getAuthUserFromRequest(request) {
    if (!process.env.JWT_SECRET) {
        throw new Error("Please define JWT_SECRET in .env");
    }

    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = parse(cookieHeader);
    const token = cookies.token;

    if (!token || typeof token !== "string") {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch {
        return null;
    }
}
