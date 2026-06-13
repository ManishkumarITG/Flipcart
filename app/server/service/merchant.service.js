import Merchent from "../modals/merchant.modal";
import { messages, errors, onboardingStatus } from "../utils/constants/codes";
import User from "../modals/user.modal";
import PaymentOrder from "../modals/paymentOrder.modal";
import { serializeDocs } from "../utils/serialize";
export const createMerchant = async (data) => {
  try {
    const {
      Brand,
      GST_NO,
      HeadOfficeAddress,
      OwnerName,
      OwnerPhone,
      prefaredCOuntries,
      basicInfo,
      // Optional PhonePe payment details collected at onboarding (step 3).
      phonepeMerchantId,
      phonepeStoreId,
      phonepeTerminalId,
      phonepeProviderId,
      paymentEnabled,
    } = data;
    if (
      !Brand ||
      !GST_NO ||
      !HeadOfficeAddress ||
      !OwnerName ||
      !OwnerPhone ||
      !prefaredCOuntries
    ) {
      return messages.BAD_REQUEST;
    }

    const userPayload = {
      Brand,
      GST_NO,
      HeadOfficeAddress,
      OwnerName,
      OwnerPhone,
      prefaredCOuntries,
      basicInfo,
    };

    // Persist PhonePe details if the seller filled them during onboarding.
    // They can always be edited later from the Seller Hub → Payments page.
    const mId = String(phonepeMerchantId || "").trim();
    const sId = String(phonepeStoreId || "").trim();
    const tId = String(phonepeTerminalId || "").trim();
    const hasPhonePeDetails = mId && sId && tId;

    if (mId || sId || tId || phonepeProviderId) {
      userPayload.phonepeMerchantId = mId;
      userPayload.phonepeStoreId = sId;
      userPayload.phonepeTerminalId = tId;
      userPayload.phonepeProviderId = String(phonepeProviderId || "").trim();
    }

    // Only enable payments when the required fields are actually present.
    const enabled = Boolean(paymentEnabled) && hasPhonePeDetails;
    userPayload.paymentEnabled = enabled;
    userPayload.phonepeOnboardingStatus = enabled
      ? onboardingStatus.ACTIVE
      : hasPhonePeDetails
        ? onboardingStatus.PENDING
        : onboardingStatus.NOT_STARTED;

    const user = await Merchent.create(userPayload);

    if (user) {
      await User.updateOne(
        { _id: basicInfo },
        { $set: { merchentId: user._id } },
      );
    }
    return user.toObject();
  } catch (error) {
    console.error("Error creating user", error);
    return messages.INTERNAL_SERVER_ERROR;
  }
};

// Resolve the merchant profile owned by the authenticated user.
async function resolveMerchant(userId) {
  return Merchent.findOne({ basicInfo: userId });
}

// Fields the frontend is allowed to read back (no platform secrets here —
// the salt key never leaves the server / .env).
function pickPhonePeSettings(merchant) {
  return {
    phonepeMerchantId: merchant.phonepeMerchantId || "",
    phonepeStoreId: merchant.phonepeStoreId || "",
    phonepeTerminalId: merchant.phonepeTerminalId || "",
    phonepeProviderId: merchant.phonepeProviderId || "",
    phonepeOnboardingStatus: merchant.phonepeOnboardingStatus || onboardingStatus.NOT_STARTED,
    paymentEnabled: Boolean(merchant.paymentEnabled),
    balance: merchant.balance || 0,
  };
}

// Save/update a merchant's PhonePe payment details.
export const updatePhonePeSettings = async ({ userId, data }) => {
  try {
    const merchant = await resolveMerchant(userId);
    if (!merchant) return messages.UNAUTHORIZED;

    const {
      phonepeMerchantId,
      phonepeStoreId,
      phonepeTerminalId,
      phonepeProviderId,
      paymentEnabled,
    } = data || {};

    // Required fields. providerId is optional per PhonePe product.
    if (
      !String(phonepeMerchantId || "").trim() ||
      !String(phonepeStoreId || "").trim() ||
      !String(phonepeTerminalId || "").trim()
    ) {
      return messages.BAD_REQUEST;
    }

    merchant.phonepeMerchantId = String(phonepeMerchantId).trim();
    merchant.phonepeStoreId = String(phonepeStoreId).trim();
    merchant.phonepeTerminalId = String(phonepeTerminalId).trim();
    merchant.phonepeProviderId = String(phonepeProviderId || "").trim();

    const enabled = Boolean(paymentEnabled);
    merchant.paymentEnabled = enabled;
    merchant.phonepeOnboardingStatus = enabled
      ? onboardingStatus.ACTIVE
      : onboardingStatus.PENDING;

    await merchant.save();
    return pickPhonePeSettings(merchant);
  } catch (error) {
    console.error("Error updating PhonePe settings", error);
    return messages.INTERNAL_SERVER_ERROR;
  }
};

// Read current PhonePe settings for the authenticated merchant.
export const getPhonePeSettings = async ({ userId }) => {
  try {
    const merchant = await resolveMerchant(userId);
    if (!merchant) return messages.UNAUTHORIZED;
    return pickPhonePeSettings(merchant);
  } catch (error) {
    console.error("Error fetching PhonePe settings", error);
    return messages.INTERNAL_SERVER_ERROR;
  }
};

// Paginated payment history for the authenticated merchant. Only ever returns
// orders belonging to this merchant.
export const getMerchantPayments = async ({ userId, page = 1, limit = 10, status }) => {
  try {
    const merchant = await resolveMerchant(userId);
    if (!merchant) return messages.UNAUTHORIZED;

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const query = { merchantId: merchant._id };
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      PaymentOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select(
          "orderId amount currency status phonepeTransactionId paidAt createdAt items"
        )
        .lean(),
      PaymentOrder.countDocuments(query),
    ]);

    return {
      items: serializeDocs(items),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      balance: merchant.balance || 0,
    };
  } catch (error) {
    console.error("Error fetching merchant payments", error);
    return messages.INTERNAL_SERVER_ERROR;
  }
};
