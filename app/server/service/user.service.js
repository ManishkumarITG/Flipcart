import User from "../modals/user.modal";
import { errors, messages, statusCodes } from "../utils/constants/codes"
export const signup = async (name, password, email, phone) => {
    try {
        const existingUser = await User.findOne({ $or: [{ email }, { phone: phone }] });
        if (existingUser) {
            return errors.USER_ALREADY_EXISTS
        }
        const user = await User.create({ name, password, email, phone });
        return user.toObject();
    } catch (error) {
        console.error("Error creating user", error);
        return messages.INTERNAL_SERVER_ERROR
    }
}


