import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server";
import { getAuthUserFromRequest } from "../middleware/auth.server";
import {
    createOrderAndQr,
    getOrderStatus,
    handlePhonePeCallback,
} from "../service/payment.service";

// Resource route for the customer-facing PhonePe flow. Mounted at /api/payment/*
//   POST /api/payment/phonepe/create-qr   -> create order + dynamic QR
//   POST /api/payment/phonepe/callback    -> PhonePe server-to-server webhook
//   GET  /api/payment/status/:orderId     -> poll payment status

// Map a service sentinel string to an HTTP error response, or null if `result`
// is real data.
function mapServiceError(result) {
    switch (result) {
        case messages.BAD_REQUEST:
            return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
        case messages.NOT_FOUND:
        case errors.ORDER_NOT_FOUND:
            return errorResponse(errors.ORDER_NOT_FOUND, statusCodes.NOT_FOUND);
        case messages.UNAUTHORIZED:
            return errorResponse(messages.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
        case errors.PAYMENT_NOT_ENABLED:
            return errorResponse(errors.PAYMENT_NOT_ENABLED, statusCodes.BAD_REQUEST);
        case errors.MERCHANT_PHONEPE_MISSING:
            return errorResponse(errors.MERCHANT_PHONEPE_MISSING, statusCodes.BAD_REQUEST);
        case errors.MIXED_MERCHANT_CART:
            return errorResponse(errors.MIXED_MERCHANT_CART, statusCodes.BAD_REQUEST);
        case errors.QR_GENERATION_FAILED:
            return errorResponse(errors.QR_GENERATION_FAILED, statusCodes.INTERNAL_SERVER_ERROR);
        case messages.INTERNAL_SERVER_ERROR:
            return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
        default:
            return null;
    }
}

export const loader = async ({ request }) => {
    await connectDB();
    try {
        const url = new URL(request.url);
        const segments = url.pathname.split("/").filter(Boolean); // [api, payment, status, :orderId]

        // GET /api/payment/status/:orderId  (public polling endpoint)
        if (segments[2] === "status" && segments[3]) {
            const result = await getOrderStatus({ orderId: segments[3] });
            const err = mapServiceError(result);
            if (err) return err;
            return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS);
        }

        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    } catch (error) {
        console.error("Error in payment loader:", error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
    }
};

export const action = async ({ request }) => {
    await connectDB();
    try {
        const url = new URL(request.url);
        const endpoint = url.pathname.split("/").filter(Boolean).slice(2).join("/");

        // ---- PhonePe webhook (NO auth — verified by X-VERIFY signature instead) ----
        if (endpoint === "phonepe/callback") {
            // PhonePe posts { response: base64 } with an X-VERIFY header.
            const body = await request.json().catch(() => ({}));
            const base64Response = body?.response || "";
            const xVerifyHeader = request.headers.get("X-VERIFY") || "";

            const result = await handlePhonePeCallback({ base64Response, xVerifyHeader });

            // Duplicates / already-paid are acknowledged with 200 so PhonePe stops retrying.
            if (result.duplicate || result.alreadyPaid || result.paid || result.failed) {
                return successResponse(
                    { acknowledged: true },
                    messages.SUCCESS,
                    statusCodes.SUCCESS
                );
            }
            if (result.invalidSignature) {
                return errorResponse(errors.INVALID_SIGNATURE, statusCodes.UNAUTHORIZED);
            }
            if (result.amountMismatch) {
                return errorResponse(errors.AMOUNT_MISMATCH, statusCodes.BAD_REQUEST);
            }
            if (result.orderNotFound) {
                return errorResponse(errors.ORDER_NOT_FOUND, statusCodes.NOT_FOUND);
            }
            if (result.badRequest) {
                return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
            }
            return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
        }

        // ---- Create order + dynamic QR (customer; auth optional) ----
        if (endpoint === "phonepe/create-qr") {
            const authUser = await getAuthUserFromRequest(request);
            const body = await request.json().catch(() => ({}));

            const result = await createOrderAndQr({
                items: body?.items,
                customerId: authUser?.userId || null,
            });
            const err = mapServiceError(result);
            if (err) return err;
            return successResponse(result, messages.QR_CREATED, statusCodes.SUCCESS);
        }

        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    } catch (error) {
        console.error("Error in payment controller:", error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR);
    }
};
