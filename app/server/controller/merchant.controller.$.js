import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server"
import { createMerchant } from "../service/merchant.service";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { parse } from "cookie";


export const action = async ({ request }) => {
    await connectDB()
    try {
        const body = await request?.json();
        const url = new URL(request.url);
        const pathname = url.pathname;
        const endpoint = pathname.split("/").pop();

        const cookies = parse(request.headers.get("Cookie") || "");
        const token = cookies.token;
        console.log("----------------------",{token});
        
        let result = null;
        switch (endpoint) {
            case "createmerchant":
                result = await createMerchant(body);
                const token = jwt.sign(
                    { userId: result._id },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                const cookie = serialize("merchant", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 60 * 60 * 24 * 3, // 7 days
                    sameSite: "lax",
                    path: "/",
                });
                return successResponse(
                    result,
                    messages.MERCHANT_CREATED,
                    200,
                    {
                        "Set-Cookie": cookie,
                        "Content-Type": "application/json"
                    }
                )
        }


        if (result === errors.USER_ALREADY_EXISTS) {
            return errorResponse(errors.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST)
        }
        if (result === errors.USER_NOT_FOUND) {
            return errorResponse(errors.USER_NOT_FOUND, statusCodes.BAD_REQUEST)
        }
        if (result === messages.BAD_REQUEST) {
            return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST)
        }
        if (result === messages.INTERNAL_SERVER_ERROR) {
            return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR)
        }
        return successResponse(result, statusCodes.OK)
    } catch (error) {
        console.log(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR)
    }
}