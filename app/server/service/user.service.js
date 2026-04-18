import User from "../modals/user.modal";
import { errors, messages } from "../utils/constants/codes"

async function verifyGoogleIdToken(idToken) {
    if (!idToken) return null;
    try {
        const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (!res.ok) return null;
        const payload = await res.json();

        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (!expectedClientId || payload.aud !== expectedClientId) return null;
        if (payload.iss !== "https://accounts.google.com" &&
            payload.iss !== "accounts.google.com") return null;
        if (payload.exp && Number(payload.exp) * 1000 < Date.now()) return null;

        return payload;
    } catch (error) {
        console.error("Error verifying Google token", error);
        return null;
    }
}

export const googleAuth = async (body) => {
    try {
        const { idToken } = body || {};
        const payload = await verifyGoogleIdToken(idToken);
        if (!payload || !payload.sub || !payload.email) {
            return messages.UNAUTHORIZED;
        }

        let user = await User.findOne({
            $or: [{ googleId: payload.sub }, { email: payload.email }],
        });

        if (user) {
            if (!user.googleId) {
                user.googleId = payload.sub;
                if (!user.avatar && payload.picture) user.avatar = payload.picture;
                await user.save();
            }
        } else {
            user = await User.create({
                name: payload.name || payload.email.split("@")[0],
                email: payload.email,
                googleId: payload.sub,
                avatar: payload.picture,
            });
        }

        return user.toObject();
    } catch (error) {
        console.error("Error in googleAuth", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
}
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
