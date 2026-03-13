import Merchent from "../modals/merchant.modal";
import { messages } from "../utils/constants/codes";

export const createMerchant = async (data) => {
    try {
        const { Brand, GST_NO,HeadOfficeAddress,OwnerName,OwnerPhone,prefaredCOuntries, basicInfo } = data       
        if (!Brand || !GST_NO || !HeadOfficeAddress || !OwnerName || !OwnerPhone || !prefaredCOuntries) {
            return messages.BAD_REQUEST;
        }

        const userPayload = { Brand, GST_NO,HeadOfficeAddress,OwnerName,OwnerPhone,prefaredCOuntries,basicInfo };

        const user = await Merchent.create(userPayload);
        return user.toObject();

    } catch (error) {
        console.error("Error creating user", error);
        return messages.INTERNAL_SERVER_ERROR
    }
}
