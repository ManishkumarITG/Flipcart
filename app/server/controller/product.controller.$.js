import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server"
import { createProduct } from "../service/product.service";


export const action = async ({ request }) => {
    await connectDB();
    try {
        const body = await request?.json();
        const url = new URL(request.url);
        const pathname = url.pathname;
        const endpoint = pathname.split("/").pop();
        let result = null;

        switch (endpoint) {
            case "createproduct":
                result = await createProduct(body);
                break;
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
        console.error("Error in product controller:", error);
        return errorResponse(messages.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR)
    }

}