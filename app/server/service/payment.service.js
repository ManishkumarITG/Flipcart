import mongoose from "mongoose";
import crypto from "node:crypto";

import Product from "../modals/product.modal";
import Merchent from "../modals/merchant.modal";
import PaymentOrder from "../modals/paymentOrder.modal";
import Payment from "../modals/payment.modal";
import MerchantLedger from "../modals/ledger.modal";
import Notification from "../modals/notification.modal";
import WebhookEvent from "../modals/webhookEvent.modal";

import { messages, errors, paymentStatus, ledgerType } from "../utils/constants/codes";
import { serializeDoc } from "../utils/serialize";
import { phonepeConfig, isPhonePeConfigured } from "../configs/phonepe.server";
import {
    createDynamicQr,
    verifyCallbackSignature,
    decodeCallback,
    checkTransactionStatus,
} from "./phonepe.service";

// PhonePe callback states/codes that mean "money received".
const SUCCESS_STATES = new Set(["COMPLETED", "SUCCESS", "PAYMENT_SUCCESS"]);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function finalUnitPrice(product) {
    const price = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    return discount > 0 && discount < 100
        ? Math.round(price - (price * discount) / 100)
        : price;
}

function newOrderId() {
    return `ORD_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

// PhonePe merchant transaction id: alphanumeric, kept well under the 35-char cap.
function newTransactionId() {
    return `TXN${Date.now()}${crypto.randomBytes(3).toString("hex")}`.slice(0, 34);
}

async function generateQrImage(qrString) {
    try {
        const QRCode = (await import("qrcode")).default;
        return await QRCode.toDataURL(qrString, { margin: 1, width: 320 });
    } catch (error) {
        console.error("QR image generation failed", error?.message || error);
        return ""; // image is optional — the qrString is still returned
    }
}

function isTransactionUnsupported(err) {
    const msg = String(err?.message || "");
    return (
        err?.code === 20 ||
        err?.codeName === "IllegalOperation" ||
        /Transaction numbers are only allowed on a replica set/i.test(msg) ||
        /Transactions are not supported/i.test(msg)
    );
}

// Shape a PaymentOrder doc into the public status payload (no internal fields).
function toStatusPayload(order, payment) {
    return {
        orderId: order.orderId,
        paymentStatus: order.status,
        amount: order.amount,
        currency: order.currency,
        paidAt: order.paidAt || null,
        phonepeTransactionId: order.phonepeTransactionId || null,
        providerReferenceId: payment?.providerReferenceId || null,
    };
}

// ---------------------------------------------------------------------------
// 1) Create an order-specific Dynamic QR
// ---------------------------------------------------------------------------

/**
 * @param {{ items: Array<{productId,quantity,variant}>, customerId?: string }} input
 * Returns a serialized order (with qr fields) or a `messages.*`/`errors.*` sentinel.
 */
export const createOrderAndQr = async ({ items, customerId = null }) => {
    try {
        if (!Array.isArray(items) || items.length === 0) {
            return messages.BAD_REQUEST;
        }

        const productIds = items
            .map((i) => i?.productId)
            .filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (!productIds.length) return messages.BAD_REQUEST;

        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((p) => [String(p._id), p]));

        // One order == one seller. Reject carts that mix merchants.
        let merchantId = null;
        const orderItems = [];
        let amount = 0;

        for (const item of items) {
            const product = productMap.get(String(item?.productId));
            if (!product) return messages.BAD_REQUEST;

            const m = String(product.Merchent);
            if (merchantId && merchantId !== m) return errors.MIXED_MERCHANT_CART;
            merchantId = m;

            const qty = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = finalUnitPrice(product);
            amount += unitPrice * qty;

            orderItems.push({
                product: product._id,
                title: product.title,
                quantity: qty,
                unitPrice,
                variant: item.variant
                    ? { name: item.variant.name, value: item.variant.value }
                    : undefined,
            });
        }

        if (!merchantId || amount <= 0) return messages.BAD_REQUEST;

        const merchant = await Merchent.findById(merchantId);
        if (!merchant) return messages.NOT_FOUND;
        if (!merchant.paymentEnabled) return errors.PAYMENT_NOT_ENABLED;
        if (!merchant.phonepeMerchantId) return errors.MERCHANT_PHONEPE_MISSING;
        if (!isPhonePeConfigured()) {
            console.error("PhonePe platform credentials missing — cannot create QR");
            return errors.QR_GENERATION_FAILED;
        }

        const orderId = newOrderId();
        const transactionId = newTransactionId();
        const expiresAt = new Date(Date.now() + phonepeConfig.qrExpirySeconds * 1000);

        // Persist the intent first so a later QR/network failure still leaves a trail.
        const order = await PaymentOrder.create({
            orderId,
            merchantId,
            customerId: mongoose.Types.ObjectId.isValid(customerId) ? customerId : null,
            items: orderItems,
            amount,
            currency: "INR",
            status: paymentStatus.PENDING,
            phonepeTransactionId: transactionId,
            phonepeMerchantOrderId: orderId,
            expiresAt,
        });

        const qr = await createDynamicQr({
            merchant,
            amountPaise: Math.round(amount * 100),
            transactionId,
            merchantOrderId: orderId,
            expiresInSec: phonepeConfig.qrExpirySeconds,
        });

        if (!qr.ok) {
            order.status = paymentStatus.FAILED;
            await order.save();
            console.error("PhonePe QR init failed", qr.code, qr.message);
            return errors.QR_GENERATION_FAILED;
        }

        const qrImage = await generateQrImage(qr.qrString);
        order.phonepeQrString = qr.qrString;
        order.phonepeQrImage = qrImage;
        await order.save();

        return serializeDoc({
            orderId: order.orderId,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            phonepeQrString: order.phonepeQrString,
            phonepeQrImage: order.phonepeQrImage,
            phonepeTransactionId: order.phonepeTransactionId,
            expiresAt: order.expiresAt,
        });
    } catch (error) {
        console.error("Error creating order/QR", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

// ---------------------------------------------------------------------------
// 2) Payment status (used by frontend polling)
// ---------------------------------------------------------------------------

export const getOrderStatus = async ({ orderId }) => {
    try {
        if (!orderId) return messages.BAD_REQUEST;
        const order = await PaymentOrder.findOne({ orderId });
        if (!order) return errors.ORDER_NOT_FOUND;

        // Lazily expire a stale pending QR.
        if (
            order.status === paymentStatus.PENDING &&
            order.expiresAt &&
            order.expiresAt.getTime() < Date.now()
        ) {
            // Best-effort reconcile with PhonePe before giving up — the callback
            // may have been missed even though the user actually paid.
            await reconcilePendingOrder(order).catch(() => {});
            if (order.status === paymentStatus.PENDING) {
                order.status = paymentStatus.EXPIRED;
                await order.save();
            }
        }

        const payment = await Payment.findOne({ order: order._id }).lean();
        return toStatusPayload(order, payment);
    } catch (error) {
        console.error("Error fetching order status", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

// Best-effort: ask PhonePe directly and process a success we may have missed.
async function reconcilePendingOrder(order) {
    if (!isPhonePeConfigured() || !order.phonepeTransactionId) return;
    const merchant = await Merchent.findById(order.merchantId);
    if (!merchant?.phonepeMerchantId) return;

    const status = await checkTransactionStatus({
        merchant,
        transactionId: order.phonepeTransactionId,
    });
    if (status.ok && SUCCESS_STATES.has(String(status.state).toUpperCase())) {
        await processSuccessfulPayment(order, {
            phonepeTransactionId: order.phonepeTransactionId,
            providerReferenceId: status.providerReferenceId,
            responseCode: status.code,
            paymentInstrument: "UPI",
        });
        // refresh in-memory doc so the caller sees the new status
        const fresh = await PaymentOrder.findById(order._id);
        if (fresh) {
            order.status = fresh.status;
            order.paidAt = fresh.paidAt;
        }
    }
}

// ---------------------------------------------------------------------------
// 3) PhonePe callback / webhook
// ---------------------------------------------------------------------------

/**
 * Verify, audit (idempotently) and process a PhonePe callback.
 * Returns an object describing the outcome; the controller maps it to a response.
 */
export const handlePhonePeCallback = async ({ base64Response, xVerifyHeader }) => {
    try {
        const signatureValid = verifyCallbackSignature(base64Response, xVerifyHeader);
        const decoded = decodeCallback(base64Response);
        const data = decoded?.data || {};

        const transactionId = data.transactionId || data.merchantTransactionId || "";
        const state = String(data.state || decoded?.code || "").toUpperCase();
        const dedupeKey = `${transactionId || "unknown"}:${state || "unknown"}`;

        // Idempotency + audit: a duplicate (same txn + state) is rejected here.
        let event;
        try {
            event = await WebhookEvent.create({
                provider: "PHONEPE",
                dedupeKey,
                phonepeTransactionId: transactionId,
                signatureValid,
                rawBody: { base64Response },
                decodedPayload: decoded,
            });
        } catch (err) {
            if (err?.code === 11000) {
                return { duplicate: true }; // already seen — safe no-op
            }
            throw err;
        }

        if (!signatureValid) {
            // Logged for audit; never reveal why verification failed.
            console.warn("PhonePe callback signature verification failed", { dedupeKey });
            event.processingError = "INVALID_SIGNATURE";
            await event.save();
            return { invalidSignature: true };
        }

        if (!transactionId) {
            event.processingError = "MISSING_TRANSACTION_ID";
            await event.save();
            return { badRequest: true };
        }

        const order = await PaymentOrder.findOne({ phonepeTransactionId: transactionId });
        if (!order) {
            event.processingError = "ORDER_NOT_FOUND";
            await event.save();
            return { orderNotFound: true };
        }

        if (order.status === paymentStatus.PAID) {
            event.processed = true;
            await event.save();
            return { alreadyPaid: true };
        }

        // Amount verification — callback amount is in paise.
        if (data.amount != null) {
            const expectedPaise = Math.round(order.amount * 100);
            if (Number(data.amount) !== expectedPaise) {
                console.warn("PhonePe callback amount mismatch", {
                    orderId: order.orderId,
                    expectedPaise,
                    got: data.amount,
                });
                event.processingError = "AMOUNT_MISMATCH";
                await event.save();
                return { amountMismatch: true };
            }
        }

        const isSuccess = signatureValid && SUCCESS_STATES.has(state);
        if (isSuccess) {
            await processSuccessfulPayment(order, {
                phonepeTransactionId: transactionId,
                providerReferenceId: data.providerReferenceId,
                responseCode: data.responseCode || decoded?.code,
                paymentInstrument:
                    data.paymentInstrument?.type || data.paymentInstrument || "UPI",
                customerId: order.customerId,
            });
            event.processed = true;
            await event.save();
            return { paid: true, orderId: order.orderId };
        }

        // Explicit failure — record it without crediting anyone.
        if (order.status === paymentStatus.PENDING) {
            order.status = paymentStatus.FAILED;
            await order.save();
        }
        await upsertPayment(order, {
            status: "FAILED",
            phonepeTransactionId: transactionId,
            responseCode: data.responseCode || decoded?.code,
        });
        event.processed = true;
        await event.save();
        return { failed: true, orderId: order.orderId };
    } catch (error) {
        console.error("Error handling PhonePe callback", error);
        return { error: true };
    }
};

// ---------------------------------------------------------------------------
// 4) Successful-payment processing (atomic where the DB supports it)
// ---------------------------------------------------------------------------

async function processSuccessfulPayment(order, paymentData) {
    let session = null;
    try {
        session = await mongoose.startSession();
        let result;
        await session.withTransaction(async () => {
            result = await applyPayment(order._id, paymentData, session);
        });
        return result;
    } catch (err) {
        if (isTransactionUnsupported(err)) {
            // Standalone Mongo (no replica set): run the same steps without a txn.
            return applyPayment(order._id, paymentData, null);
        }
        throw err;
    } finally {
        if (session) session.endSession();
    }
}

// All the state changes for a confirmed payment, in one place.
async function applyPayment(orderObjectId, paymentData, session) {
    const opts = session ? { session } : {};

    const order = await PaymentOrder.findById(orderObjectId).session(session || null);
    if (!order) return { error: true };
    if (order.status === paymentStatus.PAID) return { alreadyPaid: true }; // re-entrancy guard

    const paidAt = new Date();
    order.status = paymentStatus.PAID;
    order.paidAt = paidAt;
    if (paymentData.phonepeTransactionId) {
        order.phonepeTransactionId = paymentData.phonepeTransactionId;
    }
    await order.save(opts);

    const payment = await upsertPayment(
        order,
        {
            status: "PAID",
            phonepeTransactionId: paymentData.phonepeTransactionId,
            providerReferenceId: paymentData.providerReferenceId,
            paymentInstrument: paymentData.paymentInstrument,
            responseCode: paymentData.responseCode,
            paidAt,
        },
        session
    );

    // Atomically credit the merchant's running balance, then snapshot it.
    const merchant = await Merchent.findByIdAndUpdate(
        order.merchantId,
        { $inc: { balance: order.amount } },
        { new: true, ...opts }
    );

    await MerchantLedger.create(
        [
            {
                merchantId: order.merchantId,
                orderId: order._id,
                paymentId: payment?._id || null,
                credit: order.amount,
                debit: 0,
                balance: merchant?.balance ?? order.amount,
                type: ledgerType.CREDIT,
                status: "SETTLED",
                note: `Payment for order ${order.orderId}`,
            },
        ],
        session ? { session } : {}
    );

    await createPaymentNotifications(order, merchant, session);
    return { paid: true };
}

// Create or update the Payment record for an order (idempotent on order).
async function upsertPayment(order, fields, session) {
    const update = {
        order: order._id,
        merchant: order.merchantId,
        customer: order.customerId || null,
        amount: order.amount,
        currency: order.currency,
        provider: "PHONEPE",
        ...fields,
    };
    return Payment.findOneAndUpdate({ order: order._id }, { $set: update }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        ...(session ? { session } : {}),
    });
}

// Notify the merchant (always) and the customer (when known).
// Integration hook: if a real push system is added, fan out from here.
async function createPaymentNotifications(order, merchant, session) {
    const docs = [
        {
            recipient: merchant?.basicInfo || null,
            recipientType: "MERCHANT",
            type: "PAYMENT",
            title: "New payment received",
            message: `You received ₹${order.amount} for order ${order.orderId}.`,
            relatedOrder: order._id,
        },
    ];
    if (order.customerId) {
        docs.push({
            recipient: order.customerId,
            recipientType: "CUSTOMER",
            type: "PAYMENT",
            title: "Payment successful",
            message: `Your payment of ₹${order.amount} for order ${order.orderId} was successful.`,
            relatedOrder: order._id,
        });
    }
    await Notification.create(docs, session ? { session } : {});
}
