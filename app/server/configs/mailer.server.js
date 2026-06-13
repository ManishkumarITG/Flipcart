// Nodemailer transporter for sending sign-up OTP emails.
// Credentials come from environment variables — never hard-code them.
// Default host/port target Gmail; with Gmail you MUST use an App Password
// (not the normal account password) generated from your Google account.

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
// Friendly "From" header; falls back to the authenticated user.
const SMTP_FROM = process.env.SMTP_FROM || `FlipCart <${SMTP_USER}>`;

// True only when SMTP credentials are present.
export function isMailerConfigured() {
    return Boolean(SMTP_USER && SMTP_PASS);
}

// Re-use a single transporter across requests.
let cachedTransporter = global._mailTransporter;

function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    cachedTransporter = global._mailTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        // 465 = implicit TLS, 587 = STARTTLS.
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    return cachedTransporter;
}

// Send a 6-digit OTP to the given address. Throws if SMTP isn't configured
// or the send fails — callers decide how to surface that.
export async function sendOtpEmail(to, otp) {
    if (!isMailerConfigured()) {
        throw new Error("SMTP is not configured (set SMTP_USER and SMTP_PASS in .env)");
    }

    const transporter = getTransporter();

    return transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject: "Your FlipCart sign-up OTP",
        text: `Your FlipCart verification code is ${otp}. It expires in 5 minutes. Do not share it with anyone.`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
                <h2 style="color:#2874f0;margin:0 0 8px">Flip<span style="color:#ffe11b">Cart</span></h2>
                <p style="color:#333;font-size:14px">Use the verification code below to complete your sign-up:</p>
                <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#111;margin:16px 0">${otp}</p>
                <p style="color:#888;font-size:12px">This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
        `,
    });
}

export default { sendOtpEmail, isMailerConfigured };
