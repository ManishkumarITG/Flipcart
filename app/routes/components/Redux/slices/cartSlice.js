import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "flipcart_cart_v1";

function loadInitial() {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items };
  } catch {
    return { items: [] };
  }
}

function persist(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function keyOf(productId, variant) {
  if (!variant) return String(productId);
  return `${productId}::${variant.name || ""}:${variant.value || ""}`;
}

const cartSlice = createSlice({
  name: "cart",
  initialState: loadInitial(),
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, variant = null } = action.payload || {};
      if (!product?._id) return;
      const qty = Math.max(1, Number(quantity) || 1);
      const id = keyOf(product._id, variant);
      const existing = state.items.find((i) => i.id === id);

      if (existing) {
        existing.quantity += qty;
      } else {
        const price = Number(product.price) || 0;
        const discount = Number(product.discount) || 0;
        const finalPrice =
          discount > 0 && discount < 100
            ? Math.round(price - (price * discount) / 100)
            : price;

        state.items.push({
          id,
          productId: product._id,
          title: product.title,
          image: product.images?.[0]?.url || "",
          price,
          discount,
          finalPrice,
          variant,
          quantity: qty,
        });
      }
      persist(state);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload || {};
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      const next = Math.max(1, Number(quantity) || 1);
      item.quantity = next;
      persist(state);
    },

    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => i.id !== id);
      persist(state);
    },

    clearCart: (state) => {
      state.items = [];
      persist(state);
    },
  },
});

export const selectCartItems = (s) => s.cart.items;
export const selectCartCount = (s) =>
  s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartTotal = (s) =>
  s.cart.items.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);

export const { addToCart, updateQuantity, removeFromCart, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
