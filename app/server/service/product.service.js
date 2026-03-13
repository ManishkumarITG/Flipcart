import Product from "../modals/product.modal";

export const createProduct = async (data) => {
    try {
        const { title, description, price, category, Merchent } = data;
        if (!title || !description || !price || !category || !Merchent) {
            return messages.BAD_REQUEST;
        }   
        const productPayload = { title, description, price, category, Merchent ,discount };

        const product = await Product.create(productPayload);
        return product.toObject();
    } catch (error) {
        console.error("Error creating product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
}