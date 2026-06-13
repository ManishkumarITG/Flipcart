export const statusCodes = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
}

export const messages = {
    LOGOUT_SUCCESS: "User logged out successfully",
    SUCCESS: "Success",
    BAD_REQUEST: "Bad Request",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    NOT_FOUND: "Not Found",
    INTERNAL_SERVER_ERROR: "Internal Server Error",
    SIGN_UP : "user ragistration successfully",
    MERCHANT_CREATED: "Merchant created successfully",
    // OTP / email verification
    OTP_SENT: "OTP sent to your email",
    OTP_VERIFIED: "OTP verified successfully",
    // Payment / PhonePe related
    PAYMENT_SETTINGS_SAVED: "PhonePe payment settings saved",
    QR_CREATED: "Dynamic QR generated",
    PAYMENT_PENDING: "Payment is pending",
    PAYMENT_SUCCESS: "Payment successful",
}

export const errors = {
    ALL_FIELDS_ARE_REQUIRED: "All fields are required",
    USER_ALREADY_EXISTS: "User already exists",
    USER_NOT_FOUND: "User not found",
    USER_CREATED_SUCCESSFULLY: "User created successfully",
    USER_LOGIN_SUCCESSFULLY: "User logged in successfully",
    USER_LOGOUT_SUCCESSFULLY: "User logged out successfully",
    // OTP / email verification sentinels (returned by service, mapped in controller)
    OTP_REQUIRED: "OTP is required",
    OTP_INVALID: "Invalid OTP, please try again",
    OTP_EXPIRED: "OTP has expired, please request a new one",
    OTP_NOT_FOUND: "No pending verification found, please sign up again",
    OTP_TOO_MANY_ATTEMPTS: "Too many incorrect attempts, please request a new OTP",
    EMAIL_SEND_FAILED: "Could not send OTP email, please try again later",
    // Payment / PhonePe related sentinels (returned by services, mapped in controllers)
    PAYMENT_NOT_ENABLED: "Merchant has not enabled PhonePe payments",
    MERCHANT_PHONEPE_MISSING: "Merchant PhonePe details are incomplete",
    MIXED_MERCHANT_CART: "All items in a single order must belong to the same seller",
    QR_GENERATION_FAILED: "Failed to generate PhonePe QR",
    ORDER_NOT_FOUND: "Order not found",
    ORDER_EXPIRED: "This QR has expired, please retry",
    ORDER_ALREADY_PAID: "Order already paid",
    AMOUNT_MISMATCH: "Payment amount does not match the order",
    INVALID_SIGNATURE: "Invalid callback signature",
}

// Order / payment lifecycle states (PhonePe dynamic QR flow)
export const paymentStatus = {
    PENDING: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED",
}

// Merchant onboarding state for PhonePe
export const onboardingStatus = {
    NOT_STARTED: "NOT_STARTED",
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    REJECTED: "REJECTED",
}

// Ledger entry types
export const ledgerType = {
    CREDIT: "CREDIT",
    DEBIT: "DEBIT",
}

