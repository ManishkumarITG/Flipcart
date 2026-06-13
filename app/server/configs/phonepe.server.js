// PhonePe Dynamic QR configuration.
// All secrets come from environment variables — never hard-code the salt key.
// Sandbox is the default; switch PHONEPE_ENV=production (and point PHONEPE_BASE_URL
// at the live host) to go live.

const DEFAULT_SANDBOX_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const DEFAULT_PRODUCTION_BASE_URL = "https://api.phonepe.com/apis/hermes";

function resolveBaseUrl() {
    if (process.env.PHONEPE_BASE_URL) return process.env.PHONEPE_BASE_URL.replace(/\/$/, "");
    const env = (process.env.PHONEPE_ENV || "sandbox").toLowerCase();
    return env === "production" ? DEFAULT_PRODUCTION_BASE_URL : DEFAULT_SANDBOX_BASE_URL;
}

export const phonepeConfig = {
    env: (process.env.PHONEPE_ENV || "sandbox").toLowerCase(),
    baseUrl: resolveBaseUrl(),

    // Credentials issued by PhonePe for the platform/aggregator account.
    saltKey: process.env.PHONEPE_SALT_KEY || "",
    saltIndex: process.env.PHONEPE_SALT_INDEX || "1",

    // Server-to-server callback PhonePe will POST payment results to.
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || "",

    // Optional aggregator provider id (sent as X-PROVIDER-ID on some PhonePe products).
    providerId: process.env.PHONEPE_PROVIDER_ID || "",

    // API paths are configurable because the exact contract differs across PhonePe
    // products (Standard Checkout vs DQR/Stores). Defaults follow the DQR init flow.
    // TODO: confirm these paths against the PhonePe product enabled for your account.
    qrInitPath: process.env.PHONEPE_QR_INIT_PATH || "/v3/qr/init",
    statusPathTemplate:
        process.env.PHONEPE_STATUS_PATH ||
        "/v3/transaction/{merchantId}/{transactionId}/status",

    // How long a generated QR stays valid (seconds) before we mark the order EXPIRED.
    qrExpirySeconds: Number(process.env.PHONEPE_QR_EXPIRY_SECONDS || 300),
};

// True only when the platform-level PhonePe credentials are present.
export function isPhonePeConfigured() {
    return Boolean(phonepeConfig.saltKey && phonepeConfig.saltIndex);
}

export default phonepeConfig;
