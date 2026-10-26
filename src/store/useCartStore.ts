import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  packSize: string;
  image?: string;
  selectedSize?: string;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (
    product: {
      id: string;
      name: string;
      price: number;
      packSize: string;
      image?: string;
      selectedSize?: string;
      quantity?: number;
    },
    autoOpen?: boolean
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (product, autoOpen = false) => {
        const current = get().items;
        const itemCartId = product.selectedSize
          ? `${product.id}__size_${product.selectedSize}`
          : product.id;
        const qtyToAdd = product.quantity && product.quantity > 0 ? product.quantity : 1;

        const existing = current.find((item) => item.id === itemCartId);

        if (existing) {
          set({
            items: current.map((item) =>
              item.id === itemCartId
                ? { ...item, quantity: item.quantity + qtyToAdd }
                : item
            ),
            isCartOpen: autoOpen ? true : get().isCartOpen,
          });
        } else {
          set({
            items: [
              ...current,
              {
                ...product,
                id: itemCartId,
                productId: product.id,
                quantity: qtyToAdd,
              },
            ],
            isCartOpen: autoOpen ? true : get().isCartOpen,
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, delta) => {
        const updated = get()
          .items.map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        set({ items: updated });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set({ isCartOpen: !get().isCartOpen }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "almoman_cart_store",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
