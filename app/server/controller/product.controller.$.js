import { errorResponse, successResponse } from "../utils/responseHandler";
import { messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server";
import {
    createProduct,
    deleteProduct,
    getMyProducts,
    getProductById,
    updateProduct,
} from "../service/product.service";
import { getAuthUserFromRequest } from "../middleware/auth.server";

function normalizeServiceResult(result) {
    if (result === messages.BAD_REQUEST) {
        return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
    }
    if (result === messages.UNAUTHORIZED) {
        return errorResponse(
            "Merchant profile required.",
            statusCodes.UNAUTHORIZED
        );
    }
    if (result === messages.NOT_FOUND) {
        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    }
    if (result === messages.INTERNAL_SERVER_ERROR) {
        return errorResponse(
            messages.INTERNAL_SERVER_ERROR,
            statusCodes.INTERNAL_SERVER_ERROR
        );
    }
    return null;
}

export const loader = async ({ request }) => {
    await connectDB();
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser?.userId) {
            return errorResponse(messages.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
        }

        const url = new URL(request.url);
        const endpoint = url.pathname.split("/").pop();

        if (endpoint === "my") {
            const result = await getMyProducts({ userId: authUser.userId });
            const err = normalizeServiceResult(result);
            if (err) return err;
            return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS);
        }

        if (endpoint === "detail") {
            const productId = url.searchParams.get("id");
            if (!productId) {
                return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
            }
            const result = await getProductById({
                productId,
                userId: authUser.userId,
            });
            const err = normalizeServiceResult(result);
            if (err) return err;
            return successResponse(result, messages.SUCCESS, statusCodes.SUCCESS);
        }

        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    } catch (error) {
        console.error("Error in product loader:", error);
        return errorResponse(
            messages.INTERNAL_SERVER_ERROR,
            statusCodes.INTERNAL_SERVER_ERROR
        );
    }
};

export const action = async ({ request }) => {
    await connectDB();
    try {
        const authUser = await getAuthUserFromRequest(request);
        if (!authUser?.userId) {
            return errorResponse(messages.UNAUTHORIZED, statusCodes.UNAUTHORIZED);
        }

        const url = new URL(request.url);
        const endpoint = url.pathname.split("/").pop();

        if (endpoint === "createproduct") {
            const formData = await request.formData();
            const result = await createProduct({
                formData,
                userId: authUser.userId,
            });
            const err = normalizeServiceResult(result);
            if (err) return err;
            return successResponse(
                result,
                "Product created successfully",
                statusCodes.SUCCESS
            );
        }

        if (endpoint === "update") {
            const formData = await request.formData();
            const productId = formData.get("id")?.toString();
            if (!productId) {
                return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
            }
            const result = await updateProduct({
                formData,
                productId,
                userId: authUser.userId,
            });
            const err = normalizeServiceResult(result);
            if (err) return err;
            return successResponse(
                result,
                "Product updated successfully",
                statusCodes.SUCCESS
            );
        }

        if (endpoint === "delete") {
            const body = await request.json().catch(() => ({}));
            const productId = body?.id;
            if (!productId) {
                return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
            }
            const result = await deleteProduct({
                productId,
                userId: authUser.userId,
            });
            const err = normalizeServiceResult(result);
            if (err) return err;
            return successResponse(
                result,
                "Product deleted successfully",
                statusCodes.SUCCESS
            );
        }

        return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    } catch (error) {
        console.error("Error in product controller:", error);
        return errorResponse(
            messages.INTERNAL_SERVER_ERROR,
            statusCodes.INTERNAL_SERVER_ERROR
        );
    }
};
