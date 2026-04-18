import { googleAuth, login, signup } from "../service/user.service";
import { errorResponse, successResponse } from "../utils/responseHandler";
import { errors, messages, statusCodes } from "../utils/constants/codes";
import { connectDB } from "../configs/db.server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export const action = async ({ request }) => {
  await connectDB();
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("Please define JWT_SECRET in .env");
    }

    const body = await request?.json();

    const url = new URL(request.url);
    const pathname = url.pathname;
    const endpoint = pathname.split("/").pop();
    let result = null;
    switch (endpoint) {
      case "signup":
        result = await signup(body);
        break;
      case "login":
        result = await login(body);
        break;
      case "google":
        result = await googleAuth(body);
        break;
      case "logout":
        return successResponse(
          "",
          messages.LOGOUT_SUCCESS,
          statusCodes.SUCCESS,
          {
            "Set-Cookie": [
              serialize("token", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 0,
                path: "/",
              }),
              serialize("merchant", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 0,
                path: "/",
              }),
            ],
          },
        );
    }

    if (result === errors.USER_ALREADY_EXISTS) {
      return errorResponse(errors.USER_ALREADY_EXISTS, statusCodes.BAD_REQUEST);
    }
    if (result === messages.INTERNAL_SERVER_ERROR) {
      return errorResponse(
        messages.INTERNAL_SERVER_ERROR,
        statusCodes.INTERNAL_SERVER_ERROR,
      );
    }

    if (result === errors.USER_NOT_FOUND) {
      return errorResponse(errors.USER_NOT_FOUND, statusCodes.BAD_REQUEST);
    }
    if (result === messages.BAD_REQUEST) {
      return errorResponse(messages.BAD_REQUEST, statusCodes.BAD_REQUEST);
    }
    if (result === messages.UNAUTHORIZED) {
      return errorResponse(
        "Password or email may be wrong",
        statusCodes.UNAUTHORIZED,
      );
    }

    if (!result || !result._id) {
      return errorResponse(messages.NOT_FOUND, statusCodes.NOT_FOUND);
    }

    const token = jwt.sign({ userId: result._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    const successMessage =
      endpoint === "signup" ? messages.SIGN_UP : errors.USER_LOGIN_SUCCESSFULLY;

    return successResponse(result, successMessage, statusCodes.SUCCESS, {
      "Set-Cookie": cookie,
      "Content-Type": "application/json",
    });
  } catch (error) {
    console.log(messages.INTERNAL_SERVER_ERROR, error);
    return errorResponse(
      messages.INTERNAL_SERVER_ERROR,
      statusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
