import crypto from "node:crypto";
import { phonepeConfig } from "../configs/phonepe.server";

// Low-level PhonePe Dynamic QR (DQR) helpers: signing, the init call, callback
// verification and a server-to-server status check. This module deals only with
// PhonePe's wire contract — order/DB logic lives in payment.service.js.
//
// X-VERIFY scheme (PhonePe standard):
//   request : SHA256(base64Payload + apiPath + saltKey) + "###" + saltIndex
//   callback: SHA256(base64Response + saltKey)          + "###" + saltIndex

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

// Build the X-VERIFY header for an outgoing request.
function buildRequestXVerify(base64Payload, apiPath) {
    const { saltKey, saltIndex } = phonepeConfig;
    const hash = sha256(base64Payload + apiPath + saltKey);
    return `${hash}###${saltIndex}`;
}

// Constant-time comparison so we never leak signature info via timing.
function safeEqual(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

function toBase64(obj) {
    return Buffer.from(JSON.stringify(obj)).toString("base64");
}

/**
 * Create a PhonePe Dynamic QR for a single order.
 * `amountPaise` must be an integer amount in paise.
 * Returns { ok, qrString, providerData, code, raw } — never throws.
 */
export async function createDynamicQr({
    merchant,
    amountPaise,
    transactionId,
    merchantOrderId,
    expiresInSec,
}) {
    const apiPath = phonepeConfig.qrInitPath;

    // DQR init payload. Field set follows PhonePe's DQR/Stores contract.
    // TODO: confirm exact fields/casing against the PhonePe product enabled
    // for this account (Standard Checkout vs DQR differ slightly).
    const payload = {
        merchantId: merchant.phonepeMerchantId,
        transactionId,
        merchantOrderId,
        amount: amountPaise,
        storeId: merchant.phonepeStoreId || undefined,
        terminalId: merchant.phonepeTerminalId || undefined,
        expiresIn: expiresInSec,
    };

    const base64Payload = toBase64(payload);
    const xVerify = buildRequestXVerify(base64Payload, apiPath);

    const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
    };
    // Provider id is required by some PhonePe products and ignored by others.
    const providerId = merchant.phonepeProviderId || phonepeConfig.providerId;
    if (providerId) headers["X-PROVIDER-ID"] = providerId;
    if (phonepeConfig.callbackUrl) {
        headers["X-CALLBACK-URL"] = phonepeConfig.callbackUrl;
        headers["X-CALL-MODE"] = "POST";
    }

    try {
        const res = await fetch(`${phonepeConfig.baseUrl}${apiPath}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ request: base64Payload }),
        });

        const json = await res.json().catch(() => ({}));

        // PhonePe responses are shaped { success, code, message, data }.
        const data = json?.data || {};
        const qrString =
            data.qrString || data.qrData || data.upiIntent || json?.qrString || "";

        if (!res.ok || json?.success === false || !qrString) {
            return {
                ok: false,
                code: json?.code || `HTTP_${res.status}`,
                message: json?.message || "PhonePe QR init failed",
                raw: json,
            };
        }

        return { ok: true, qrString, providerData: data, code: json?.code, raw: json };
    } catch (error) {
        console.error("PhonePe createDynamicQr error", error?.message || error);
        return { ok: false, code: "NETWORK_ERROR", message: "PhonePe request failed" };
    }
}

/**
 * Verify the X-VERIFY header PhonePe sends on a callback against the raw
 * base64 response body. Returns boolean.
 */
export function verifyCallbackSignature(base64Response, xVerifyHeader) {
    if (!base64Response || !xVerifyHeader) return false;
    const { saltKey, saltIndex } = phonepeConfig;
    const expected = `${sha256(base64Response + saltKey)}###${saltIndex}`;
    return safeEqual(expected, xVerifyHeader);
}

/** Decode a base64 callback body into an object. Returns null on bad input. */
export function decodeCallback(base64Response) {
    try {
        const json = Buffer.from(base64Response, "base64").toString("utf-8");
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Server-to-server status check, used to reconcile a still-PENDING order.
 * Returns { ok, state, code, providerReferenceId, amount, raw }.
 */
export async function checkTransactionStatus({ merchant, transactionId }) {
    const apiPath = phonepeConfig.statusPathTemplate
        .replace("{merchantId}", merchant.phonepeMerchantId)
        .replace("{transactionId}", transactionId);

    const xVerify = `${sha256(apiPath + phonepeConfig.saltKey)}###${phonepeConfig.saltIndex}`;
    const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchant.phonepeMerchantId,
    };
    const providerId = merchant.phonepeProviderId || phonepeConfig.providerId;
    if (providerId) headers["X-PROVIDER-ID"] = providerId;

    try {
        const res = await fetch(`${phonepeConfig.baseUrl}${apiPath}`, {
            method: "GET",
            headers,
        });
        const json = await res.json().catch(() => ({}));
        const data = json?.data || {};
        return {
            ok: res.ok && json?.success !== false,
            state: data.state || data.status || json?.code,
            code: json?.code,
            providerReferenceId: data.providerReferenceId || data.transactionId,
            amount: data.amount,
            raw: json,
        };
    } catch (error) {
        console.error("PhonePe checkTransactionStatus error", error?.message || error);
        return { ok: false, code: "NETWORK_ERROR" };
    }
}
