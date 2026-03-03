import Merchent from "../modals/merchant.modal";

export const createMerchant = async (data) => {
    try {
        const { Brand, GST_NO,HeadOfficeAddress,OwnerName,OwnerPhone,prefaredCOuntries } = data       
        if (!Brand || !GST_NO || !HeadOfficeAddress || !OwnerName || !OwnerPhone || !prefaredCOuntries) {
            return messages.BAD_REQUEST;
        }

        const userPayload = { Brand, GST_NO,HeadOfficeAddress,OwnerName,OwnerPhone,prefaredCOuntries };

        const user = await Merchent.create(userPayload);
        return user.toObject();

    } catch (error) {
        console.error("Error creating user", error);
        return messages.INTERNAL_SERVER_ERROR
    }
}
