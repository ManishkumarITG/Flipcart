import User from "../modals/user.modal";
import { errors, messages } from "../utils/constants/codes"
export const signup = async (body) => {
    try {
        const { name, email, password, phone } = body

        if (!name || !password || !email) {
            return messages.BAD_REQUEST;
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errors.USER_ALREADY_EXISTS
        }
        const userPayload = { name, password, email };
        if (phone) userPayload.phone = phone;

        const user = await User.create(userPayload);
        return user.toObject();
    } catch (error) {
        console.error("Error creating user", error);
        return messages.INTERNAL_SERVER_ERROR
    }
}


export const login = async (body) => {
    try {
        const { email, password } = body || {};

        if (!email || !password) {
            return messages.BAD_REQUEST;
        }

        const user = await User.findOne({ email });
        if (!user) {
            return errors.USER_NOT_FOUND;
        }
        
        if (user.password !== password) {
            return messages.UNAUTHORIZED;
        }

        return user.toObject();
    } catch (error) {
        console.error("Error logging in user", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
}
