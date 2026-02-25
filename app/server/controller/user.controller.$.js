import { signup } from "../service/user.service";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server"
import jwt from "jsonwebtoken";
import { serialize } from "cookie";



export const action = async ({ request }) => {
    await connectDB()
    try {
        const body = await request.json();

        const { name, email, password, phone } = body

        if (!name || !password || !email || !phone) {
            return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
        }
        
        const url = new URL(request.url);
        const pathname = url.pathname;
        const endpoint = pathname.split("/").pop();
        let result;
        switch (endpoint) {
            case "signup":
                result = await signup(name, password, email, phone);
                break;
        }
        
        const token = jwt.sign(
            { userId: result._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 3, // 7 days
            path: "/",
        });


        if (result === errors.USER_ALREADY_EXISTS) {
            return errorResponse(errors.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST)
        }
        if (result) {
            return successResponse(result, messages.SIGN_UP, statusCodes.SUCCESS, {
                "Set-Cookie": cookie,
                "Content-Type": "application/json",
            })
        }
    } catch (error) {
        console.log(messages.INTERNAL_SERVER_ERROR, error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR)
    }
}