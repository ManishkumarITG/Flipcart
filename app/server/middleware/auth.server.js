import jwt from "jsonwebtoken";
import { authCookie } from "../utils/auth/authCookie.server"
export const autherisetion = async (cookieHeader) => {
    const token = await authCookie.parse(
        request.headers.get("Cookie")
    );
    if (!token) {
        return false
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("decode---------" , decoded);
    
} 