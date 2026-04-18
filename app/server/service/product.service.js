import Product from "../modals/product.modal";
import Merchent from "../modals/merchant.modal";
import { messages } from "../utils/constants/codes";
import cloudinary from "../configs/cloudinary.server";
import { serializeDoc, serializeDocs } from "../utils/serialize";

function uploadBuffer(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
}

async function uploadFiles(files, folder) {
    const valid = (files || []).filter(
        (f) => f && typeof f.arrayBuffer === "function" && f.size > 0
    );
    if (!valid.length) return [];
    const buffers = await Promise.all(
        valid.map(async (f) => Buffer.from(await f.arrayBuffer()))
    );
    return Promise.all(buffers.map((buf) => uploadBuffer(buf, folder)));
}

async function resolveMerchant(userId) {
    return Merchent.findOne({ basicInfo: userId });
}

export const getMyProducts = async ({ userId }) => {
    try {
        const merchant = await resolveMerchant(userId);
        if (!merchant) return messages.UNAUTHORIZED;
        const products = await Product.find({ Merchent: merchant._id })
            .sort({ createdAt: -1 })
            .lean();
        return serializeDocs(products);
    } catch (error) {
        console.error("Error fetching merchant products", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

export const getProductById = async ({ productId, userId }) => {
    try {
        const merchant = await resolveMerchant(userId);
        if (!merchant) return messages.UNAUTHORIZED;
        const product = await Product.findOne({
            _id: productId,
            Merchent: merchant._id,
        }).lean();
        if (!product) return messages.NOT_FOUND;
        return serializeDoc(product);
    } catch (error) {
        console.error("Error fetching product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

const EDITABLE_FIELDS = [
    "title",
    "description",
    "price",
    "category",
    "discount",
    "stock",
    "status",
];

export const updateProduct = async ({ formData, productId, userId }) => {
    try {
        const merchant = await resolveMerchant(userId);
        if (!merchant) return messages.UNAUTHORIZED;

        const product = await Product.findOne({
            _id: productId,
            Merchent: merchant._id,
        });
        if (!product) return messages.NOT_FOUND;

        for (const key of EDITABLE_FIELDS) {
            if (!formData.has(key)) continue;
            const raw = formData.get(key)?.toString();
            if (raw == null) continue;

            if (key === "price" || key === "discount" || key === "stock") {
                const num = Number(raw);
                if (Number.isNaN(num) || num < 0) return messages.BAD_REQUEST;
                product[key] = num;
            } else if (key === "status") {
                const allowed = ["active", "inactive", "draft", "out_of_stock"];
                if (!allowed.includes(raw)) return messages.BAD_REQUEST;
                product.status = raw;
            } else {
                const v = raw.trim();
                if (!v) return messages.BAD_REQUEST;
                product[key] = v;
            }
        }

        let keepPublicIds = null;
        const keepRaw = formData.get("keepImages")?.toString();
        if (keepRaw) {
            try {
                const parsed = JSON.parse(keepRaw);
                if (Array.isArray(parsed)) keepPublicIds = parsed;
            } catch {
                return messages.BAD_REQUEST;
            }
        }

        if (keepPublicIds) {
            const removed = product.images.filter(
                (img) => !keepPublicIds.includes(img.publicId)
            );
            await Promise.all(
                removed.map((img) =>
                    cloudinary.uploader
                        .destroy(img.publicId)
                        .catch((e) => console.error("Cloudinary destroy failed", e))
                )
            );
            product.images = product.images.filter((img) =>
                keepPublicIds.includes(img.publicId)
            );
        }

        const newFiles = formData.getAll("newImages").filter((f) => f && f.size > 0);
        if (newFiles.length) {
            const folder = `flipcart/products/${merchant._id}`;
            const uploaded = await uploadFiles(newFiles, folder);
            product.images.push(...uploaded);
        }

        if (product.stock === 0 && product.status === "active") {
            product.status = "out_of_stock";
        }

        await product.save();
        return serializeDoc(product.toObject());
    } catch (error) {
        console.error("Error updating product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

export const deleteProduct = async ({ productId, userId }) => {
    try {
        const merchant = await resolveMerchant(userId);
        if (!merchant) return messages.UNAUTHORIZED;

        const product = await Product.findOne({
            _id: productId,
            Merchent: merchant._id,
        });
        if (!product) return messages.NOT_FOUND;

        const allPublicIds = [
            ...(product.images || []).map((i) => i.publicId),
            ...(product.variants || []).flatMap((v) =>
                (v.images || []).map((i) => i.publicId)
            ),
        ].filter(Boolean);

        await Promise.all(
            allPublicIds.map((pid) =>
                cloudinary.uploader
                    .destroy(pid)
                    .catch((e) => console.error("Cloudinary destroy failed", e))
            )
        );

        await product.deleteOne();
        return { deleted: true, id: productId };
    } catch (error) {
        console.error("Error deleting product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

export const getPublicProductById = async (productId) => {
    try {
        if (!productId) return messages.BAD_REQUEST;
        const product = await Product.findOne({
            _id: productId,
            status: { $in: ["active", "out_of_stock"] },
        })
            .populate({ path: "Merchent", select: "shopName basicInfo" })
            .lean();
        if (!product) return messages.NOT_FOUND;
        return serializeDoc(product);
    } catch (error) {
        console.error("Error fetching public product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};

export const getRandomProducts = async (count = 4) => {
    try {
        const size = Math.max(1, Math.min(20, Number(count) || 4));
        const products = await Product.aggregate([
            { $match: { status: { $in: ["active", "out_of_stock"] } } },
            { $sample: { size } },
            {
                $project: {
                    title: 1,
                    description: 1,
                    price: 1,
                    category: 1,
                    discount: 1,
                    rating: 1,
                    images: 1,
                    createdAt: 1,
                },
            },
        ]);
        return serializeDocs(products);
    } catch (error) {
        console.error("Error fetching random products", error);
        return [];
    }
};

export const createProduct = async ({ formData, userId }) => {
    try {
        const title = formData.get("title")?.toString().trim();
        const description = formData.get("description")?.toString().trim();
        const priceRaw = formData.get("price");
        const category = formData.get("category")?.toString().trim();
        const discountRaw = formData.get("discount");
        const variantsRaw = formData.get("variants")?.toString();

        const price = priceRaw ? Number(priceRaw) : NaN;
        const discount = discountRaw ? Number(discountRaw) : 0;

        if (!title || !description || !category || Number.isNaN(price) || price <= 0) {
            return messages.BAD_REQUEST;
        }

        const merchant = await Merchent.findOne({ basicInfo: userId });
        if (!merchant) {
            return messages.UNAUTHORIZED;
        }

        let variantsMeta = [];
        if (variantsRaw) {
            try {
                const parsed = JSON.parse(variantsRaw);
                if (Array.isArray(parsed)) variantsMeta = parsed;
            } catch {
                return messages.BAD_REQUEST;
            }
        }

        const productFiles = formData.getAll("images").filter((f) => f && f.size > 0);
        if (!productFiles.length) {
            return messages.BAD_REQUEST;
        }

        const folder = `flipcart/products/${merchant._id}`;
        const productImages = await uploadFiles(productFiles, folder);

        const variants = await Promise.all(
            variantsMeta.map(async (v, idx) => {
                const name = v?.name?.toString().trim();
                const value = v?.value?.toString().trim();
                if (!name || !value) return null;

                const vFiles = formData
                    .getAll(`variantImages_${idx}`)
                    .filter((f) => f && f.size > 0);
                const images = await uploadFiles(vFiles, `${folder}/variants`);
                return { name, value, images };
            })
        );

        const cleanVariants = variants.filter(Boolean);

        const product = await Product.create({
            title,
            description,
            price,
            category,
            discount: Number.isFinite(discount) ? discount : 0,
            Merchent: merchant._id,
            images: productImages,
            variants: cleanVariants,
        });

        return serializeDoc(product.toObject());
    } catch (error) {
        console.error("Error creating product", error);
        return messages.INTERNAL_SERVER_ERROR;
    }
};
