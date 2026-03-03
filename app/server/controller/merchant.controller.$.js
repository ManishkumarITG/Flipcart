import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server"
import { createMerchant } from "../service/merchant.service";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";


export const action = async ({ request }) => {
    await connectDB()
    console.log("test1----------------------------------");
    try {
        const body = await request?.json();
        const url = new URL(request.url);
        const pathname = url.pathname;
        const endpoint = pathname.split("/").pop();
        let result = null;
        console.log("test2----------------------------------");
        switch (endpoint) {
            case "createmerchant":
                result = await createMerchant(body);
                console.log("test3----------------------------------");
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
        console.log("test4----------------------------------");


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