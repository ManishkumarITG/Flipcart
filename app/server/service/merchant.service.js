import Merchent from "../modals/merchant.modal";
import { messages } from "../utils/constants/codes";
import User from "../modals/user.modal";
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

    const user = await Merchent.create(userPayload);
    
    if (user) {
      const setAdmin = await User.updateOne(
        { _id: id }, // filter (which user)
        { $set: { isAdmin: true } }, // update
      );
    }
    return user.toObject();
  } catch (error) {
    console.error("Error creating user", error);
    return messages.INTERNAL_SERVER_ERROR;
  }
};
