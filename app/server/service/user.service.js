import crypto from "node:crypto";
import User from "../modals/user.modal";
import Otp from "../modals/otp.modal";
import { sendOtpEmail } from "../configs/mailer.server";
import { errors, messages } from "../utils/constants/codes"

// OTP settings for the email-verified sign-up flow.
const OTP_TTL_MS = 5 * 60 * 1000; // codes are valid for 5 minutes
const MAX_OTP_ATTEMPTS = 5; // wrong tries before the code is invalidated

// Salted SHA-256 of the code — we never store/compare the raw OTP.
function hashOtp(code) {
    const secret = process.env.JWT_SECRET || "";
    return crypto.createHash("sha256").update(`${code}:${secret}`).digest("hex");
}

// Cryptographically-random, zero-padded 6-digit code.
function generateOtp() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

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
// Step 1 of sign-up: validate details, stash them in a pending Otp record and
// email a 6-digit code. The real User is NOT created here.
export const sendSignupOtp = async (body) => {
    try {
        const { name, email, password, phone } = body || {};

        if (!name || !password || !email) {
            return messages.BAD_REQUEST;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errors.USER_ALREADY_EXISTS;
        }

        const code = generateOtp();
        const update = {
            name,
            email,
            password,
            codeHash: hashOtp(code),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
            attempts: 0,
            purpose: "signup",
            createdAt: new Date(),
        };
        if (phone) update.phone = phone;

        // One pending record per email — a re-request overwrites the old code.
        await Otp.findOneAndUpdate(
            { email, purpose: "signup" },
            update,
            { upsert: true, setDefaultsOnInsert: true },
        );

        try {
            await sendOtpEmail(email, code);
        } catch (mailError) {
            // Surface the real SMTP reason (e.g. "Invalid login" = wrong/normal
            // password instead of a Gmail App Password) so it's easy to debug.
            console.error("Error sending OTP email:", mailError?.message || mailError);

            // Dev convenience: don't block local testing on SMTP. Keep the
            // pending record and print the code so it can be used to verify.
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    `\n[DEV] OTP email could not be sent. Use this code for ${email}: ${code}\n`,
                );
                return messages.OTP_SENT;
            }

            // Production: roll back so the user can retry cleanly.
            await Otp.deleteOne({ email, purpose: "signup" });
            return errors.EMAIL_SEND_FAILED;
        }

        return messages.OTP_SENT;
    } catch (error) {
        console.error("Error sending signup OTP", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

// Step 2 of sign-up: verify the emailed OTP and only then create the User.
export const signup = async (body) => {
    try {
        const { email, otp } = body || {};

        if (!email) {
            return messages.BAD_REQUEST;
        }
        if (!otp) {
            return errors.OTP_REQUIRED;
        }

        // Guard against a user created between request and verify.
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errors.USER_ALREADY_EXISTS;
        }

        const pending = await Otp.findOne({ email, purpose: "signup" });
        if (!pending) {
            return errors.OTP_NOT_FOUND;
        }

        if (pending.expiresAt.getTime() < Date.now()) {
            await Otp.deleteOne({ _id: pending._id });
            return errors.OTP_EXPIRED;
        }

        if (pending.attempts >= MAX_OTP_ATTEMPTS) {
            await Otp.deleteOne({ _id: pending._id });
            return errors.OTP_TOO_MANY_ATTEMPTS;
        }

        if (hashOtp(String(otp)) !== pending.codeHash) {
            pending.attempts += 1;
            await pending.save();
            return errors.OTP_INVALID;
        }

        // OTP is correct — create the real user from the stashed details.
        const userPayload = {
            name: pending.name,
            email: pending.email,
            password: pending.password,
        };
        if (pending.phone) userPayload.phone = pending.phone;

        const user = await User.create(userPayload);
        await Otp.deleteOne({ _id: pending._id });

        return user.toObject();
    } catch (error) {
        console.error("Error creating user", error);
        return messages.INTERNAL_SERVER_ERROR;
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
