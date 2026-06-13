import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server"
import {
    createMerchant,
    updatePhonePeSettings,
    getPhonePeSettings,
    getMerchantPayments,
} from "../service/merchant.service";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { getAuthUserFromRequest } from "../middleware/auth.server";

// Shared mapping for the simple sentinel strings the merchant services return.
function mapMerchantServiceError(result) {
    if (result === messages.BAD_REQUEST)
        return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
    if (result === messages.UNAUTHORIZED)
        return errorResponse("Merchant profile required.", statusCodes.UNAUTHORIZED);
    if (result === messages.NOT_FOUND)
        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    if (result === messages.INTERNAL_SERVER_ERROR)
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
    return null;
}

// GET endpoints for the authenticated merchant:
//   GET /api/merchant/payment-setup  -> current PhonePe settings
//   GET /api/merchant/payments       -> paginated payment history
export const loader = async ({ request }) => {
    await connectDB();
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser?.userId) {
            return errorResponse(messages.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
        }

        const url = new URL(request.url);
        const endpoint = url.pathname.split("/").pop();

        if (endpoint === "payment-setup") {
            const result = await getPhonePeSettings({ userId: authUser.userId });
            const err = mapMerchantServiceError(result);
            if (err) return err;
            return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS);
        }

        if (endpoint === "payments") {
            const result = await getMerchantPayments({
                userId: authUser.userId,
                page: url.searchParams.get("page"),
                limit: url.searchParams.get("limit"),
                status: url.searchParams.get("status") || undefined,
            });
            const err = mapMerchantServiceError(result);
            if (err) return err;
            return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS);
        }

        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    } catch (error) {
        console.error("Error in merchant loader:", error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
    }
};


export const action = async ({ request }) => {
    await connectDB()
    try {
        const body = await request?.json();
        const url = new URL(request.url);
        const pathname = url.pathname;
        const endpoint = pathname.split("/").pop();

        const authUser = await getAuthUserFromRequest(request);
        if (!authUser?.userId) {
            return errorResponse(messages.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
        }
        
        let result = null;
        switch (endpoint) {
            case "createmerchant":
                result = await createMerchant({
                    ...body,
                    basicInfo: authUser.userId,
                });
                if (result === messages.BAD_REQUEST) {
                    return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
                }
                if (result === messages.INTERNAL_SERVER_ERROR) {
                    return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
                }

                const token = jwt.sign(
                    { userId: result._id },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                const cookie = serialize("merchant", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 60 * 60 * 24 * 7,
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

            case "payment-setup": {
                // Save/update the authenticated merchant's PhonePe details.
                const settings = await updatePhonePeSettings({
                    userId: authUser.userId,
                    data: body,
                });
                const err = mapMerchantServiceError(settings);
                if (err) return err;
                return successResponse(
                    settings,
                    messages.PAYMENT_SETTINGS_SAVED,
                    statusCodes.SUCCESS
                );
            }
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
        return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS)
    } catch (error) {
        console.log(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR)
    }
}
