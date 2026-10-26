"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Check,
  X,
  AlertTriangle,
  Search,
  MessageCircle,
  FileSpreadsheet,
  Download,
  HardDrive,
  FolderCheck,
  Tag,
  Receipt,
  Layers,
  ChefHat,
  Truck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useAdminStore } from "@/store/useAdminStore";
import { ProductItem } from "@/components/ProductCard";
import OrderSlipModal, { SlipOrderData, SlipOrderItem } from "@/components/OrderSlipModal";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
}

interface OrderSummary {
  id: string;
  customer: string;
  email: string;
  phone?: string;
  amount: number;
  status: string;
  fulfillmentType?: string;
  shippingAddress?: string;
  deliveryFee?: number;
  customerLocationLink?: string;
  items?: SlipOrderItem[];
  paymentMethod?: string;
  notes?: string;
  date: string;
}

const CATEGORY_OPTIONS = [
  "Samosas",
  "Kebabs",
  "Rolls",
  "Pattis & Wrappers",
  "Patties",
  "Nuggets & Bites",
  "Parathas",
  "Other Frozen Delights",
];

const PRESET_IMAGES = [
  { name: "Chicken Samosa", path: "/products/chicken-samosa.jpg" },
  { name: "Beef Kebab", path: "/products/beef-kebab.jpg" },
  { name: "Spring Rolls", path: "/products/spring-rolls.jpg" },
  { name: "Nuggets", path: "/products/nuggets.jpg" },
  { name: "Chicken Patties", path: "/products/chicken-patties.jpg" },
  { name: "Chapli Kebab", path: "/products/chapli-kebab.jpg" },
  { name: "Aloo Samosa", path: "/products/aloo-samosa.jpg" },
  { name: "Paratha", path: "/products/paratha.jpg" },
];

export default function AdminPage() {
  const { admin, isLoading: authLoading, logoutAdmin, checkAdminSession } = useAdminStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "members" | "orders" | "excel">("products");
  const [syncingExcel, setSyncingExcel] = useState(false);
  const [excelStats, setExcelStats] = useState<{
    customerCount: number;
    orderCount: number;
    primaryFolder: string;
    mirrorFolder: string;
  } | null>(null);

  const triggerExcelSync = async () => {
    setSyncingExcel(true);
    try {
      const res = await fetch("/api/admin/excel/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Excel sync failed");
      showToast("Excel files successfully saved to D:\\Al Moman Customer Data!");
      setExcelStats({
        customerCount: data.customerCount,
        orderCount: data.orderCount,
        primaryFolder: data.primaryFolder,
        mirrorFolder: data.mirrorFolder,
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Sync failed", "error");
    } finally {
      setSyncingExcel(false);
    }
  };

  // Filter & Search states for products
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Category Management states
  const [categories, setCategories] = useState<string[]>(CATEGORY_OPTIONS);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Order Slip & Bill Modal states
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<SlipOrderData | null>(null);

  const openCreateSlipModal = () => {
    setSelectedSlipOrder(null);
    setIsSlipModalOpen(true);
  };

  const openOrderSlipModal = (order: OrderSummary) => {
    setSelectedSlipOrder({
      id: order.id,
      orderNumber: order.id.slice(-6),
      customerName: order.customer,
      phone: order.phone || "",
      email: order.email,
      shippingAddress: order.shippingAddress || "Model Town, Gujranwala",
      fulfillmentType: (order.fulfillmentType as "Home Delivery" | "Self-Pickup") || "Home Delivery",
      customerLocationLink: order.customerLocationLink || "",
      items: order.items && order.items.length > 0
        ? order.items
        : [
            {
              name: "Frozen Food Order",
              quantity: 1,
              price: order.amount || 0,
              packSize: "Pack",
            },
          ],
      deliveryFee: order.deliveryFee !== undefined ? order.deliveryFee : 150,
      paymentMethod: order.paymentMethod || "Cash on Delivery (COD)",
      notes: order.notes || "",
    });
    setIsSlipModalOpen(true);
  };

  // Order Management states & filters
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      setRecentOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const statusLabels: Record<string, string> = {
        pending: "Pending Confirmation",
        confirmed: "Confirmed (Approved)",
        preparing: "Preparing in Kitchen",
        ready: "Ready for Delivery / Pickup",
        delivered: "Delivered (Completed)",
        cancelled: "Cancelled",
      };

      showToast(`Order #${orderId.slice(-6)} updated to: ${statusLabels[newStatus] || newStatus}! Customer portal synced.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeConfig = (status: string) => {
    const s = (status || "pending").toLowerCase();
    if (s.includes("confirm")) {
      return {
        label: "Confirmed",
        badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-600",
        selectClass: "border-emerald-600 text-emerald-300 bg-emerald-950/90",
        dotClass: "bg-emerald-400",
      };
    }
    if (s.includes("prepar")) {
      return {
        label: "Preparing",
        badgeClass: "bg-blue-950/80 text-blue-300 border-blue-600",
        selectClass: "border-blue-600 text-blue-300 bg-blue-950/90",
        dotClass: "bg-blue-400",
      };
    }
    if (s.includes("ready") || s.includes("out")) {
      return {
        label: "Ready / Delivery",
        badgeClass: "bg-purple-950/80 text-purple-300 border-purple-600",
        selectClass: "border-purple-600 text-purple-300 bg-purple-950/90",
        dotClass: "bg-purple-400",
      };
    }
    if (s.includes("deliver")) {
      return {
        label: "Delivered",
        badgeClass: "bg-emerald-900/90 text-emerald-200 border-emerald-400",
        selectClass: "border-emerald-400 text-emerald-200 bg-emerald-900/90",
        dotClass: "bg-emerald-300",
      };
    }
    if (s.includes("cancel")) {
      return {
        label: "Cancelled",
        badgeClass: "bg-rose-950/80 text-rose-300 border-rose-600",
        selectClass: "border-rose-600 text-rose-300 bg-rose-950/90",
        dotClass: "bg-rose-400",
      };
    }
    return {
      label: "Pending",
      badgeClass: "bg-amber-950/80 text-amber-300 border-amber-600",
      selectClass: "border-amber-600 text-amber-300 bg-amber-950/90",
      dotClass: "bg-amber-400",
    };
  };

  const getWhatsAppMessageForOrder = (order: OrderSummary) => {
    const s = (order.status || "pending").toLowerCase();
    const idShort = order.id.slice(-6);
    if (s.includes("ready")) {
      return `Assalam-o-Alaikum ${order.customer}! AL-MOMAN Frozen Foods se aapka Order #${idShort} (Rs. ${order.amount.toLocaleString()}) bilkul TAYAR hai! Aap delivery receive kar saktay hain ya outlet se collect kar saktay hain. Helpline: 0337-1691006.`;
    }
    if (s.includes("prepar")) {
      return `Assalam-o-Alaikum ${order.customer}! AL-MOMAN Frozen Foods se aapka Order #${idShort} (Rs. ${order.amount.toLocaleString()}) kitchen main hygienically blast freeze aur tayar kiya ja raha hai. Helpline: 0337-1691006.`;
    }
    if (s.includes("deliver")) {
      return `Assalam-o-Alaikum ${order.customer}! AL-MOMAN Frozen Foods se aapka Order #${idShort} deliver ho chuka hai. Humse shopping ka shukriya! Helpline: 0337-1691006.`;
    }
    if (s.includes("cancel")) {
      return `Assalam-o-Alaikum ${order.customer}! Aapka AL-MOMAN Frozen Foods Order #${idShort} cancel kar diya gaya hai. Helpline: 0337-1691006.`;
    }
    return `Assalam-o-Alaikum ${order.customer}! Aapka Al Moman Frozen Foods Order #${idShort} (Rs. ${order.amount.toLocaleString()}) CONFIRM kar diya gaya hai aur schedule ho chuka hai. Helpline: 0337-1691006.`;
  };

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    urduName: "",
    category: "Samosas",
    price: "",
    packSize: "12 Pieces / Pack",
    availablePackSizes: [] as string[],
    description: "",
    image: "/products/chicken-samosa.jpg",
    inStock: true,
    availableSizes: [] as string[],
    availableHeights: [] as string[],
    availableWidths: [] as string[],
  });
  const [pattiWidthInput, setPattiWidthInput] = useState("");
  const [pattiHeightInput, setPattiHeightInput] = useState("");
  const [packSizeInput, setPackSizeInput] = useState("");

  // Pack Sizes Handler (e.g. 250 gram, 500 gram, 1 kg)
  const handleAddPackSize = (customPackSize?: string) => {
    const val = (customPackSize || packSizeInput).trim();
    if (!val) {
      showToast("Please enter a pack size or weight", "error");
      return;
    }
    if (formData.availablePackSizes?.some((s) => s.toLowerCase() === val.toLowerCase())) {
      showToast(`Pack size "${val}" is already added`, "error");
      return;
    }

    setFormData((prev) => {
      const nextSizes = [...(prev.availablePackSizes || []), val];
      return {
        ...prev,
        availablePackSizes: nextSizes,
        packSize: prev.packSize && prev.packSize !== "12 Pieces / Pack" ? prev.packSize : nextSizes[0],
      };
    });
    setPackSizeInput("");
    showToast(`Added pack size: ${val}`);
  };

  const handleRemovePackSize = (sizeToRemove: string) => {
    setFormData((prev) => {
      const nextSizes = (prev.availablePackSizes || []).filter((s) => s !== sizeToRemove);
      return {
        ...prev,
        availablePackSizes: nextSizes,
        packSize: nextSizes[0] || prev.packSize,
      };
    });
    showToast(`Removed pack size "${sizeToRemove}"`);
  };

  const handleClearAllPackSizes = () => {
    setFormData((prev) => ({
      ...prev,
      availablePackSizes: [],
    }));
    showToast("All pack sizes cleared");
  };

  // Patti Dimensions Handlers
  const handleAddDimensionSize = (customSize?: string) => {
    let sizeToAdd = customSize;
    if (!sizeToAdd) {
      const w = pattiWidthInput.trim().replace(/"/g, "");
      const h = pattiHeightInput.trim().replace(/"/g, "");
      if (!w || !h) {
        showToast("Please enter both Width and Height in inches", "error");
        return;
      }
      sizeToAdd = `${w}" × ${h}"`;
    }

    if (formData.availableSizes?.some((s) => s.replace(/×/g, "x").trim() === sizeToAdd?.replace(/×/g, "x").trim())) {
      showToast("This dimension size is already added", "error");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      availableSizes: [...(prev.availableSizes || []), sizeToAdd!],
    }));
    setPattiWidthInput("");
    setPattiHeightInput("");
    showToast(`Added dimension: ${sizeToAdd}`);
  };

  const handleRemoveDimensionSize = (sizeToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      availableSizes: (prev.availableSizes || []).filter(
        (s) =>
          s !== sizeToRemove &&
          s.replace(/×/g, "x").replace(/\s+/g, "") !== sizeToRemove.replace(/×/g, "x").replace(/\s+/g, "")
      ),
    }));
    showToast(`Removed dimension "${sizeToRemove}"`);
  };

  const handleClearAllDimensions = () => {
    setFormData((prev) => ({
      ...prev,
      availableSizes: [],
    }));
    showToast("All dimensions cleared");
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Members & Orders
      const resMembers = await fetch("/api/admin/members");
      const dataMembers = await resMembers.json();
      if (resMembers.ok) {
        setMembers(dataMembers.members || []);
        setTotalMembers(dataMembers.totalMembers || 0);
        setTotalOrders(dataMembers.totalOrders || 0);
        setTotalRevenue(dataMembers.totalRevenue || 0);
        setRecentOrders(dataMembers.recentOrders || []);
      }

      // 2. Fetch Products
      const resProducts = await fetch("/api/products");
      const dataProducts = await resProducts.json();
      if (dataProducts.products) {
        setProducts(dataProducts.products);
      }

      // 3. Fetch Categories
      try {
        const resCat = await fetch("/api/categories");
        const dataCat = await resCat.json();
        if (dataCat.categories && Array.isArray(dataCat.categories) && dataCat.categories.length > 0) {
          setCategories(dataCat.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Category Handlers
  const handleAddCategory = async (nameToAdd?: string) => {
    const val = (nameToAdd || newCategoryName).trim();
    if (!val) {
      showToast("Please enter a category name", "error");
      return;
    }
    if (categories.some((c) => c.toLowerCase() === val.toLowerCase())) {
      showToast(`Category "${val}" already exists`, "error");
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");

      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories((prev) => [...prev, val]);
      }
      setNewCategoryName("");
      showToast(`Category "${val}" added successfully!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to add category", "error");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const linked = products.filter(
      (p) => p.category.toLowerCase() === catToDelete.toLowerCase()
    );

    const msg =
      linked.length > 0
        ? `Warning: "${catToDelete}" has ${linked.length} linked product(s). Deleting this category will remove it from filters and dropdowns, but existing products will remain. Delete category anyway?`
        : `Are you sure you want to delete category "${catToDelete}"?`;

    if (!window.confirm(msg)) return;

    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/categories?name=${encodeURIComponent(catToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories((prev) => prev.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase()));
      }

      if (categoryFilter.toLowerCase() === catToDelete.toLowerCase()) {
        setCategoryFilter("All");
      }
      if (formData.category.toLowerCase() === catToDelete.toLowerCase()) {
        setFormData((prev) => ({ ...prev, category: categories[0] || "Samosas" }));
      }

      showToast(`Category "${catToDelete}" removed successfully!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete category", "error");
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkAdminSession();
  }, [checkAdminSession]);

  useEffect(() => {
    if (admin?.role === "admin") {
      loadData();
    }
  }, [admin]);

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: "",
      urduName: "",
      category: categories[0] || "Samosas",
      price: "",
      packSize: "12 Pieces / Pack",
      availablePackSizes: [],
      description: "",
      image: "/products/chicken-samosa.jpg",
      inStock: true,
      availableSizes: [],
      availableHeights: [],
      availableWidths: [],
    });
    setPattiWidthInput("");
    setPattiHeightInput("");
    setPackSizeInput("");
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: ProductItem) => {
    setSelectedProduct(p);
    const existingPackSizes: string[] =
      (p as any).availablePackSizes && Array.isArray((p as any).availablePackSizes) && (p as any).availablePackSizes.length > 0
        ? (p as any).availablePackSizes
        : p.packSize
        ? [p.packSize]
        : [];

    setFormData({
      name: p.name,
      urduName: p.urduName || "",
      category: p.category,
      price: p.price.toString(),
      packSize: p.packSize,
      availablePackSizes: existingPackSizes,
      description: p.description || "",
      image: p.image || "/products/chicken-samosa.jpg",
      inStock: p.inStock ?? true,
      availableSizes: p.availableSizes || [],
      availableHeights: p.availableHeights || [],
      availableWidths: p.availableWidths || [],
    });
    setPattiWidthInput("");
    setPattiHeightInput("");
    setPackSizeInput("");
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (p: ProductItem) => {
    setSelectedProduct(p);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast("Please enter product name and price", "error");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");

      showToast("New product added successfully!");
      setIsAddModalOpen(false);
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error adding item", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Product (Change Price & Details)
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const targetId = selectedProduct._id || selectedProduct.id;
    setFormLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          _id: targetId,
          oldName: selectedProduct.name,
          ...formData,
          price: Number(formData.price),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      showToast(`Product "${formData.name}" price and details updated successfully!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error updating item", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Delete Product (Cut / Remove Item)
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const targetId = selectedProduct._id || selectedProduct.id;
    setFormLoading(true);

    try {
      const res = await fetch(`/api/products?id=${targetId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      showToast(`Product "${selectedProduct.name}" removed from menu successfully!`);
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error deleting item", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Quick Toggle Stock Status
  const handleToggleStock = async (p: ProductItem) => {
    const targetId = p._id || p.id;
    const newStock = !(p.inStock ?? true);

    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((item) =>
          (item._id || item.id) === targetId ? { ...item, inStock: newStock } : item
        )
      );

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          _id: targetId,
          oldName: p.name,
          inStock: newStock,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle stock status");
      }

      showToast(
        `"${p.name}" marked as ${newStock ? "In Stock" : "Out of Stock"}!`
      );
    } catch (err) {
      console.error(err);
      showToast("Could not update stock status", "error");
      loadData();
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <header className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-black shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xs sm:text-sm text-white">AL MOMAN FROZEN FOODS — Admin</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Verifying Admin Access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!admin || admin.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        <header className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-black shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand-logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xs sm:text-sm text-white">AL MOMAN FROZEN FOODS — Admin</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-950/60 border border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Admin Portal Restricted</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              This portal is restricted to store management. Sign in with store owner credentials to access this area.
            </p>
            <div className="space-y-3">
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950 transition"
              >
                <ShieldCheck className="w-4 h-4" /> Go to Admin Login
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Back to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat =
      categoryFilter === "All" ||
      p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.urduName && p.urduName.includes(productSearch)) ||
      (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Dedicated Admin Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0 bg-black shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-black text-xs sm:text-sm tracking-wide text-white block">
              AL MOMAN FROZEN FOODS
            </span>
            <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
              Store Owner &amp; Admin Panel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
          <button
            onClick={() => logoutAdmin()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-800/80 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Toast message popup */}
      {toast && (
        <div className="fixed top-24 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-950/95 text-emerald-300 border-emerald-600"
                : "bg-rose-950/95 text-rose-300 border-rose-600"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Store Owner & Admin Panel
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Authenticated Owner: <strong className="text-emerald-400">{admin?.name || "Moman Salman (Owner)"}</strong> ({admin?.email || "momansalman@almomanfoods.com"})
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => logoutAdmin()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-900/60 shadow-sm transition"
              title="Sign Out Admin"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Storefront
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {/* Total Menu Items */}
          <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Live Menu
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Products
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? "..." : products.length} Items
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Available in frozen store
            </p>
          </div>

          {/* Total Members */}
          <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Members
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Registered Accounts
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? "..." : totalMembers}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Signed-up customer accounts
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Orders
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Orders Placed
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {loading ? "..." : totalOrders}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Delivery & pickup requests
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-zinc-900/90 p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Sales
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              Rs. {loading ? "..." : totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Verified order volume
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 border-b border-zinc-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === "products"
                ? "bg-emerald-600 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Menu Items & Pricing ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === "members"
                ? "bg-emerald-600 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Registered Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === "orders"
                ? "bg-emerald-600 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Customer Orders ({recentOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("excel")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === "excel"
                ? "bg-emerald-600 text-zinc-950 shadow-md font-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Sheets (D: Drive)
          </button>
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === "products" && (
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            {/* Top Toolbar */}
            <div className="p-5 border-b border-zinc-800 bg-black/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-white text-base">Menu & Price Management</h3>
                <p className="text-xs text-zinc-400">
                  Add new items, modify product prices, or delete items from the menu.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search item..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Manage Categories Button */}
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition shadow-sm"
                  title="Add or delete food categories"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Categories ({categories.length})</span>
                </button>

                {/* Add Product Button */}
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950 transition"
                >
                  <Plus className="w-4 h-4" /> Add New Item
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <UtensilsCrossed className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No products found</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Click &quot;+ Add New Item&quot; above to add your first product to the menu.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black/70 text-zinc-400 uppercase font-black tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Item Photo</th>
                      <th className="px-5 py-3.5">Item Name</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Price (PKR)</th>
                      <th className="px-5 py-3.5">Pack Size</th>
                      <th className="px-5 py-3.5">Stock Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredProducts.map((p) => {
                      const isInStock = p.inStock ?? true;
                      return (
                        <tr key={p._id || p.id || p.name} className="hover:bg-zinc-800/40 transition">
                          {/* Image */}
                          <td className="px-5 py-3.5">
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.image || "/products/chicken-samosa.jpg"}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop&q=60";
                                }}
                              />
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            {((p.availableHeights && p.availableHeights.length > 0) || (p.availableWidths && p.availableWidths.length > 0)) ? (
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                                {p.availableHeights && p.availableHeights.length > 0 && (
                                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                    H: {p.availableHeights.join(", ")}
                                  </span>
                                )}
                                {p.availableWidths && p.availableWidths.length > 0 && (
                                  <span className="bg-teal-950/80 text-teal-400 border border-teal-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                    W: {p.availableWidths.join(", ")}
                                  </span>
                                )}
                              </div>
                            ) : p.availableSizes && p.availableSizes.length > 0 ? (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase">Sizes:</span>
                                {p.availableSizes.map((sz) => (
                                  <span
                                    key={sz}
                                    className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-bold"
                                  >
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </td>

                          {/* Category */}
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-emerald-400 border border-zinc-700">
                              {p.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-3.5">
                            <div className="font-black text-white text-sm flex items-center gap-1.5">
                              Rs. {p.price.toLocaleString()}
                              <button
                                onClick={() => openEditModal(p)}
                                className="text-zinc-500 hover:text-emerald-400 transition"
                                title="Edit Price"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Pack Size */}
                          <td className="px-5 py-3.5 text-zinc-400">{p.packSize}</td>

                          {/* Stock Status Toggle */}
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleStock(p)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black border transition flex items-center gap-1.5 ${
                                isInStock
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900"
                                  : "bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900"
                              }`}
                              title="Click to toggle stock"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isInStock ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                              />
                              {isInStock ? "In Stock" : "Out of Stock"}
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-emerald-600 hover:text-zinc-950 text-zinc-300 transition"
                                title="Edit item price or details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete / Cut Button */}
                              <button
                                onClick={() => openDeleteModal(p)}
                                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-600 hover:text-white text-zinc-400 hover:text-white transition"
                                title="Delete item from menu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTERED MEMBERS */}
        {activeTab === "members" && (
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-zinc-800 bg-black/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-white text-base">Registered Members Database</h3>
                <p className="text-xs text-zinc-400">Total registered user accounts in database &amp; Excel sheets</p>
              </div>
              <a
                href="/api/admin/excel/download?type=customers"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 font-bold rounded-xl text-xs transition w-fit"
                title="Download Customers as Excel"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Customers (.xlsx)
              </a>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-500">Loading database...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-16 text-center">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No registered members yet</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  When new customers register an account, their details will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black/70 text-zinc-400 uppercase font-black tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3.5">Customer Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Phone Number</th>
                      <th className="px-6 py-3.5">Delivery Address</th>
                      <th className="px-6 py-3.5">Joined Date</th>
                      <th className="px-6 py-3.5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-800/40 transition">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-black text-xs">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          {m.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            {m.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-zinc-200">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            {m.phone || "Not specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{m.address || "Not specified"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {new Date(m.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              m.role === "admin"
                                ? "bg-amber-950/80 text-amber-300 border-amber-800"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700"
                            }`}
                          >
                            {m.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            {/* Header with Actions & Sync */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 bg-black/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">Customer Orders Management</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                    Live Portal Sync
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Change order status here to immediately update customer live tracking and sync to Excel.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition border border-zinc-700 cursor-pointer"
                  title="Reload orders from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={openCreateSlipModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-950 cursor-pointer"
                  title="Generate Official Order Slip & Payment Bill"
                >
                  <Receipt className="w-4 h-4" />
                  + Order Slip / Bill
                </button>
                <a
                  href="/api/admin/excel/download?type=orders"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 font-bold rounded-xl text-xs transition w-fit"
                  title="Download Orders as Excel"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Export (.xlsx)
                </a>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer, phone, or order ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto text-xs">
                {[
                  { key: "all", label: "All Orders", count: recentOrders.length },
                  {
                    key: "pending",
                    label: "Pending",
                    count: recentOrders.filter((o) => (o.status || "").toLowerCase().includes("pend")).length,
                  },
                  {
                    key: "confirmed",
                    label: "Confirmed",
                    count: recentOrders.filter((o) => (o.status || "").toLowerCase().includes("confirm")).length,
                  },
                  {
                    key: "preparing",
                    label: "Preparing",
                    count: recentOrders.filter((o) => (o.status || "").toLowerCase().includes("prepar")).length,
                  },
                  {
                    key: "ready",
                    label: "Ready",
                    count: recentOrders.filter(
                      (o) => (o.status || "").toLowerCase().includes("ready") || (o.status || "").toLowerCase().includes("out")
                    ).length,
                  },
                  {
                    key: "delivered",
                    label: "Delivered",
                    count: recentOrders.filter((o) => (o.status || "").toLowerCase().includes("deliver")).length,
                  },
                  {
                    key: "cancelled",
                    label: "Cancelled",
                    count: recentOrders.filter((o) => (o.status || "").toLowerCase().includes("cancel")).length,
                  },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOrderStatusFilter(f.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-[11px] ${
                      orderStatusFilter === f.key
                        ? "bg-emerald-600 text-zinc-950 font-black shadow"
                        : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        orderStatusFilter === f.key ? "bg-zinc-950 text-emerald-400" : "bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-zinc-500">Loading orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-16 text-center">
                <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No orders placed yet</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  When customers place orders from the cart, their order details will appear here. Or use the &quot;+ Order Slip / Bill&quot; button above to create one now.
                </p>
                <button
                  type="button"
                  onClick={openCreateSlipModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs transition"
                >
                  <Receipt className="w-4 h-4" /> Create First Order Slip
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black/70 text-zinc-400 uppercase font-black tracking-wider text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Order ID</th>
                      <th className="px-5 py-3.5">Customer &amp; Phone</th>
                      <th className="px-5 py-3.5">Fulfillment</th>
                      <th className="px-5 py-3.5">Amount (PKR)</th>
                      <th className="px-5 py-3.5">Status &amp; Live Controls</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {recentOrders
                      .filter((o) => {
                        const q = orderSearch.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          o.id.toLowerCase().includes(q) ||
                          o.customer.toLowerCase().includes(q) ||
                          (o.phone && o.phone.includes(q)) ||
                          (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q));

                        const matchesStatus =
                          orderStatusFilter === "all" ||
                          (o.status || "pending").toLowerCase().includes(orderStatusFilter.toLowerCase());

                        return matchesSearch && matchesStatus;
                      })
                      .map((o) => {
                        const badgeCfg = getStatusBadgeConfig(o.status);
                        const isUpdating = updatingOrderId === o.id;

                        return (
                          <tr key={o.id} className="hover:bg-zinc-800/40 transition">
                            {/* Order ID */}
                            <td className="px-5 py-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                              #{o.id.slice(-6)}
                            </td>

                            {/* Customer & Phone */}
                            <td className="px-5 py-4">
                              <div className="font-bold text-white">{o.customer}</div>
                              <div className="font-mono text-[10px] text-zinc-500">{o.email}</div>
                              {o.phone && o.phone !== "N/A" && (
                                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{o.phone}</div>
                              )}
                              {o.shippingAddress && (
                                <div className="text-[10px] text-zinc-400 max-w-[180px] truncate mt-0.5" title={o.shippingAddress}>
                                  📍 {o.shippingAddress}
                                </div>
                              )}
                            </td>

                            {/* Fulfillment */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  o.fulfillmentType === "Self-Pickup"
                                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                                    : "bg-blue-950/80 text-blue-300 border-blue-800"
                                }`}
                              >
                                {o.fulfillmentType || "Home Delivery"}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-4 font-black text-white whitespace-nowrap">
                              Rs. {o.amount.toLocaleString()}
                            </td>

                            {/* Status & Live Controls */}
                            <td className="px-5 py-4">
                              <div className="space-y-1.5 min-w-[200px]">
                                {/* Select Dropdown with Live indicator */}
                                <div className="relative">
                                  <select
                                    value={(o.status || "pending").toLowerCase()}
                                    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                    disabled={isUpdating}
                                    className={`w-full text-xs font-bold px-3 py-1.5 rounded-xl border appearance-none cursor-pointer pr-7 transition shadow-sm ${badgeCfg.selectClass} focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50`}
                                  >
                                    <option value="pending" className="bg-zinc-900 text-amber-300">
                                      ⏳ Pending Confirmation
                                    </option>
                                    <option value="confirmed" className="bg-zinc-900 text-emerald-300">
                                      ✅ Confirmed (Kitchen Accepted)
                                    </option>
                                    <option value="preparing" className="bg-zinc-900 text-blue-300">
                                      👨‍🍳 Preparing (Blast Freezing)
                                    </option>
                                    <option value="ready" className="bg-zinc-900 text-purple-300">
                                      📦 Ready (Delivery Le Jain)
                                    </option>
                                    <option value="delivered" className="bg-zinc-900 text-emerald-300">
                                      🚀 Delivered (Completed)
                                    </option>
                                    <option value="cancelled" className="bg-zinc-900 text-rose-300">
                                      ❌ Cancelled
                                    </option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                                    {isUpdating ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                    ) : (
                                      <span className="text-[9px]">▼</span>
                                    )}
                                  </div>
                                </div>

                                {/* 1-Click Status Quick Advance Button */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {(o.status || "pending").toLowerCase().includes("pend") && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, "confirmed")}
                                      disabled={isUpdating}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-[10px] transition shadow cursor-pointer disabled:opacity-50"
                                      title="Accept and approve this order"
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> Confirm Order
                                    </button>
                                  )}
                                  {(o.status || "").toLowerCase().includes("confirm") && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, "preparing")}
                                      disabled={isUpdating}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition shadow cursor-pointer disabled:opacity-50"
                                      title="Send to kitchen blast freezer"
                                    >
                                      <ChefHat className="w-3 h-3" /> Start Kitchen Prep
                                    </button>
                                  )}
                                  {(o.status || "").toLowerCase().includes("prepar") && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, "ready")}
                                      disabled={isUpdating}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition shadow cursor-pointer disabled:opacity-50"
                                      title="Mark order ready for pickup or dispatch"
                                    >
                                      <Truck className="w-3 h-3" /> Mark Ready (Aap Le Jain)
                                    </button>
                                  )}
                                  {(o.status || "").toLowerCase().includes("ready") && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, "delivered")}
                                      disabled={isUpdating}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[10px] transition shadow cursor-pointer disabled:opacity-50"
                                      title="Complete order delivery"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" /> Mark Delivered
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                              {new Date(o.date).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openOrderSlipModal(o)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 font-bold transition text-[11px] cursor-pointer"
                                  title="View &amp; Print Official Order Bill / Slip"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-amber-400" /> Bill Slip
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const clean = (o.phone || "").replace(/\D/g, "");
                                    const targetWa = clean.startsWith("0") ? "92" + clean.slice(1) : clean || "923371691006";
                                    const text = getWhatsAppMessageForOrder(o);
                                    window.open(`https://wa.me/${targetWa}?text=${encodeURIComponent(text)}`, "_blank");
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-600 border border-emerald-700/80 text-emerald-400 hover:text-zinc-950 font-bold transition text-[11px] cursor-pointer"
                                  title="Auto WhatsApp Status Update to Customer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                </button>
                                <a
                                  href={`/order-tracking/${o.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-cyan-300 hover:text-cyan-200 font-bold transition text-[11px]"
                                  title="Open Live Customer Tracking Portal in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Live View
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXCEL SHEETS ON D: DRIVE */}
        {activeTab === "excel" && (
          <div className="space-y-6">
            {/* Main Drive Info Card */}
            <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      Automated Excel Database
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                        Live Auto-Save
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Every customer signup and order is automatically saved in real time to Microsoft Excel spreadsheets (.xlsx) on your D: drive.
                    </p>
                  </div>
                </div>

                <button
                  onClick={triggerExcelSync}
                  disabled={syncingExcel}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs shadow-xl shadow-emerald-950 transition disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingExcel ? "animate-spin" : ""}`} />
                  {syncingExcel ? "Saving to D: Drive..." : "Re-Sync / Save Now to D: Drive"}
                </button>
              </div>

              {excelStats && (
                <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Excel files synchronized: <strong>{excelStats.customerCount} customers</strong> and <strong>{excelStats.orderCount} orders</strong> saved to <strong>{excelStats.primaryFolder}</strong>.
                  </span>
                </div>
              )}

              {/* Folder Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-black/60 rounded-2xl border border-emerald-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <HardDrive className="w-4 h-4" /> Primary Storage Location (D: Drive Root)
                  </div>
                  <p className="font-mono text-xs text-white bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 break-all select-all">
                    D:\Al Moman Customer Data
                  </p>
                  <p className="text-[11px] text-zinc-400 pt-1">
                    👉 Open &quot;This PC&quot; on your computer and navigate to <strong>D: Drive</strong> to view this folder.
                  </p>
                </div>

                <div className="p-4 bg-black/60 rounded-2xl border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <FolderCheck className="w-4 h-4 text-emerald-400" /> Secondary Mirror Backup (Project Folder)
                  </div>
                  <p className="font-mono text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 break-all select-all">
                    D:\Al Moman Frozen Foods\Customer_Data
                  </p>
                  <p className="text-[11px] text-zinc-400 pt-1">
                    Automatic duplicate mirror backup saved inside the project directory.
                  </p>
                </div>
              </div>

              {/* Excel Sheets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Sheet 1: Customers */}
                <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Al_Moman_Customers.xlsx</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Complete roster of registered customers with names, emails, phone numbers, addresses, account roles, and total orders.
                    </p>
                  </div>
                  <a
                    href="/api/admin/excel/download?type=customers"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold rounded-xl text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Customers.xlsx
                  </a>
                </div>

                {/* Sheet 2: Orders */}
                <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-3">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Al_Moman_Orders.xlsx</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      Order IDs, timestamps, customer details, custom Patti sizes, item breakdown, total amounts, COD status, and Google Maps links.
                    </p>
                  </div>
                  <a
                    href="/api/admin/excel/download?type=orders"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold rounded-xl text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Orders.xlsx
                  </a>
                </div>

                {/* Sheet 3: Master Workbook */}
                <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-600/40 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Al_Moman_Master_Database.xlsx</h4>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      Both worksheets (&quot;All Customers&quot; + &quot;All Orders&quot;) combined into a single multi-tab master Excel workbook.
                    </p>
                  </div>
                  <a
                    href="/api/admin/excel/download?type=master"
                    className="mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-950"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Master Workbook
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: ADD NEW PRODUCT                                      */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">Add New Frozen Product</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Product Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crispy Cheese Samosa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-zinc-300">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                    >
                      + Manage
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 750"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Multiple Pack Sizes & Weights Manager (e.g. 250 gram, 500 gram, 1 kg) */}
              <div className="p-4 bg-zinc-950/90 border border-amber-500/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <label className="block font-black text-amber-400 text-xs flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-400" />
                      Pack Sizes &amp; Weights (250 gram, 500 gram, 1 kg, etc.)
                    </label>
                    <p className="text-[10px] text-zinc-400">
                      Add one or multiple pack sizes so customers can choose on the menu.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-black font-mono">
                      {formData.availablePackSizes?.length || (formData.packSize ? 1 : 0)} Sizes
                    </span>
                    {(formData.availablePackSizes?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllPackSizes}
                        className="text-[10px] text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition font-bold"
                        title="Delete all pack sizes"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Pack Sizes Chips */}
                <div>
                  <span className="text-[10px] text-zinc-300 font-bold block mb-1.5">
                    Active Pack Sizes (Selectable by Customer):
                  </span>
                  {formData.availablePackSizes && formData.availablePackSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.availablePackSizes.map((pSize) => (
                        <span
                          key={pSize}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 text-amber-300 border border-amber-500/80 rounded-xl font-mono text-xs font-black shadow-sm group hover:border-rose-500 transition"
                        >
                          <span>{pSize}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePackSize(pSize)}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950 p-1 rounded transition"
                            title={`Delete pack size ${pSize}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-zinc-400">Default Pack Size:</span>
                      <span className="font-bold text-amber-400 font-mono bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                        {formData.packSize || "12 Pieces / Pack"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input: Add Custom Pack Size */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 250 gram, 500 gram, or 1 kg"
                    value={packSizeInput}
                    onChange={(e) => setPackSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPackSize();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPackSize()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Size
                  </button>
                </div>

                {/* Quick 1-Click Presets */}
                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">
                    Quick 1-Click Pack Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "250 gram",
                      "500 gram",
                      "1 kg",
                      "12 Pieces (Dozen)",
                      "6 Pieces (Half Dozen)",
                      "24 Pieces (2 Dozen)",
                      "Standard Box",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPackSize(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-950 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-700 font-mono font-bold transition cursor-pointer"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patti Dimensions Management (Width × Height Pair Builder in Inches) */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div>
                    <label className="block font-black text-emerald-400 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Patti Dimensions in Inches (Samosa &amp; Roll Patti Sizing)
                    </label>
                    <p className="text-[10px] text-zinc-400">
                      Enter Width &amp; Height in inches (e.g. 2.5 Width × 7 Height will show as 2.5&quot; × 7&quot; to customers)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-black font-mono">
                      {formData.availableSizes?.length || 0} Sizes Added
                    </span>
                    {(formData.availableSizes?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllDimensions}
                        className="text-[10px] text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition font-bold"
                        title="Delete all dimensions"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Customer Sizes */}
                <div>
                  <span className="text-[10px] text-zinc-300 font-bold block mb-1.5">
                    Active Customer Sizes (Displayed on Storefront):
                  </span>
                  {formData.availableSizes && formData.availableSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.availableSizes.map((sz) => (
                        <span
                          key={sz}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 text-emerald-400 border border-emerald-500/80 rounded-xl font-mono text-xs font-black shadow-sm group hover:border-rose-500 transition"
                        >
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDimensionSize(sz)}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950 p-1 rounded transition"
                            title={`Delete dimension ${sz}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic py-1">
                      No dimension sizes added yet. Use the inputs below or click quick presets.
                    </p>
                  )}
                </div>

                {/* Inputs: Width & Height */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Width (Chorai in inches)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 2.5 or 3"
                          value={pattiWidthInput}
                          onChange={(e) => setPattiWidthInput(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-2 text-zinc-500 text-xs">inch</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Height (Lambai in inches)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 7 or 8"
                          value={pattiHeightInput}
                          onChange={(e) => setPattiHeightInput(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-2 text-zinc-500 text-xs">inch</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Dimension Pair Button */}
                  <button
                    type="button"
                    onClick={() => handleAddDimensionSize()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Dimension Size:{" "}
                    <span className="font-mono underline">
                      {pattiWidthInput.trim() ? `${pattiWidthInput.trim()}"` : '2.5"'} × {pattiHeightInput.trim() ? `${pattiHeightInput.trim()}"` : '7"'}
                    </span>
                  </button>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t border-zinc-900">
                    <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">
                      Quick Presets (1-Click Add):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '2.5" × 7"',
                        '3" × 8"',
                        '2.5" × 7.5"',
                        '3" × 7"',
                        '7" × 7"',
                        '7.5" × 7.5"',
                        '8" × 8"',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddDimensionSize(preset)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-700 font-mono font-bold transition"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Photo Path or Image URL</label>
                <input
                  type="text"
                  placeholder="/products/chicken-samosa.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                />
                {/* Image presets helper */}
                <div className="mt-2">
                  <span className="text-[10px] text-zinc-400">Select from Preset Photos:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        type="button"
                        key={img.path}
                        onClick={() => setFormData({ ...formData, image: img.path })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          formData.image === img.path
                            ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                        }`}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of product, ingredients, preparation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="inStockCheck" className="font-bold text-white cursor-pointer">
                  In Stock (Available for immediate customer ordering)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-950 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {formLoading ? "Adding..." : "Add Product to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT PRODUCT / CHANGE PRICE                          */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Edit Product & Pricing</h3>
                  <p className="text-[11px] text-zinc-400">{formData.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4 text-xs">
              {/* Highlighted Price Input */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl">
                <label className="block font-black text-emerald-400 text-xs mb-1">
                  💰 Item Price (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-emerald-400 font-bold">Rs.</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 850"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-12 pr-3.5 py-2 bg-zinc-950 border border-emerald-600 rounded-xl text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Updating price here instantly reflects on the storefront for all customers.
                </p>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Product Name (English)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-zinc-300">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                  >
                    + Manage
                  </button>
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiple Pack Sizes & Weights Manager (e.g. 250 gram, 500 gram, 1 kg) */}
              <div className="p-4 bg-zinc-950/90 border border-amber-500/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <label className="block font-black text-amber-400 text-xs flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-400" />
                      Pack Sizes &amp; Weights (250 gram, 500 gram, 1 kg, etc.)
                    </label>
                    <p className="text-[10px] text-zinc-400">
                      Add one or multiple pack sizes so customers can choose on the menu.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-black font-mono">
                      {formData.availablePackSizes?.length || (formData.packSize ? 1 : 0)} Sizes
                    </span>
                    {(formData.availablePackSizes?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllPackSizes}
                        className="text-[10px] text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition font-bold"
                        title="Delete all pack sizes"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Pack Sizes Chips */}
                <div>
                  <span className="text-[10px] text-zinc-300 font-bold block mb-1.5">
                    Active Pack Sizes (Selectable by Customer):
                  </span>
                  {formData.availablePackSizes && formData.availablePackSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.availablePackSizes.map((pSize) => (
                        <span
                          key={pSize}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 text-amber-300 border border-amber-500/80 rounded-xl font-mono text-xs font-black shadow-sm group hover:border-rose-500 transition"
                        >
                          <span>{pSize}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePackSize(pSize)}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950 p-1 rounded transition"
                            title={`Delete pack size ${pSize}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-zinc-400">Default Pack Size:</span>
                      <span className="font-bold text-amber-400 font-mono bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                        {formData.packSize || "12 Pieces / Pack"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input: Add Custom Pack Size */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 250 gram, 500 gram, or 1 kg"
                    value={packSizeInput}
                    onChange={(e) => setPackSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPackSize();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPackSize()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Size
                  </button>
                </div>

                {/* Quick 1-Click Presets */}
                <div className="pt-2 border-t border-zinc-900">
                  <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">
                    Quick 1-Click Pack Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "250 gram",
                      "500 gram",
                      "1 kg",
                      "12 Pieces (Dozen)",
                      "6 Pieces (Half Dozen)",
                      "24 Pieces (2 Dozen)",
                      "Standard Box",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddPackSize(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-950 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-700 font-mono font-bold transition cursor-pointer"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patti Dimensions Management (Width × Height Pair Builder in Inches) */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
                  <div>
                    <label className="block font-black text-emerald-400 text-xs flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Patti Dimensions in Inches (Samosa &amp; Roll Patti Sizing)
                    </label>
                    <p className="text-[10px] text-zinc-400">
                      Enter Width &amp; Height in inches (e.g. 2.5 Width × 7 Height will show as 2.5&quot; × 7&quot; to customers)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-black font-mono">
                      {formData.availableSizes?.length || 0} Sizes Added
                    </span>
                    {(formData.availableSizes?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllDimensions}
                        className="text-[10px] text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2 py-0.5 rounded flex items-center gap-1 transition font-bold"
                        title="Delete all dimensions"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Customer Sizes */}
                <div>
                  <span className="text-[10px] text-zinc-300 font-bold block mb-1.5">
                    Active Customer Sizes (Displayed on Storefront):
                  </span>
                  {formData.availableSizes && formData.availableSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.availableSizes.map((sz) => (
                        <span
                          key={sz}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 text-emerald-400 border border-emerald-500/80 rounded-xl font-mono text-xs font-black shadow-sm group hover:border-rose-500 transition"
                        >
                          <span>{sz}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDimensionSize(sz)}
                            className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950 p-1 rounded transition"
                            title={`Delete dimension ${sz}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic py-1">
                      No dimension sizes added yet. Use the inputs below or click quick presets.
                    </p>
                  )}
                </div>

                {/* Inputs: Width & Height */}
                <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Width (Chorai in inches)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 2.5 or 3"
                          value={pattiWidthInput}
                          onChange={(e) => setPattiWidthInput(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-2 text-zinc-500 text-xs">inch</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Height (Lambai in inches)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 7 or 8"
                          value={pattiHeightInput}
                          onChange={(e) => setPattiHeightInput(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-2 text-zinc-500 text-xs">inch</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Dimension Pair Button */}
                  <button
                    type="button"
                    onClick={() => handleAddDimensionSize()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Dimension Size:{" "}
                    <span className="font-mono underline">
                      {pattiWidthInput.trim() ? `${pattiWidthInput.trim()}"` : '2.5"'} × {pattiHeightInput.trim() ? `${pattiHeightInput.trim()}"` : '7"'}
                    </span>
                  </button>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t border-zinc-900">
                    <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">
                      Quick Presets (1-Click Add):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '2.5" × 7"',
                        '3" × 8"',
                        '2.5" × 7.5"',
                        '3" × 7"',
                        '7" × 7"',
                        '7.5" × 7.5"',
                        '8" × 8"',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddDimensionSize(preset)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-700 font-mono font-bold transition"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Photo Path or Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {/* Presets */}
                <div className="mt-2">
                  <span className="text-[10px] text-zinc-400">Available Photos:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        type="button"
                        key={img.path}
                        onClick={() => setFormData({ ...formData, image: img.path })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          formData.image === img.path
                            ? "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                        }`}
                      >
                        {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockEditCheck"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="inStockEditCheck" className="font-bold text-white cursor-pointer">
                  In Stock (Available for ordering)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-950 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: DELETE / CUT PRODUCT CONFIRMATION                   */}
      {/* ============================================================ */}
      {isDeleteModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-950/80 border border-rose-500/50 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">Remove Product from Menu?</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">&quot;{selectedProduct.name}&quot;</strong> from the store menu?
            </p>

            <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 mb-6 flex items-center justify-between">
              <span>Price: <strong className="text-white">Rs. {selectedProduct.price}</strong></span>
              <span>Category: <strong className="text-emerald-400">{selectedProduct.category}</strong></span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={handleDeleteProduct}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-950 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {formLoading ? "Deleting..." : "Yes, Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: MANAGE CATEGORIES (ADD / DELETE)                   */}
      {/* ============================================================ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Manage Food Categories</h3>
                  <p className="text-xs text-zinc-400">
                    Add new categories or remove existing ones from the menu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory();
              }}
              className="mb-5 space-y-2.5"
            >
              <label className="block text-xs font-bold text-zinc-300">
                Add New Category
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Sauces & Chutneys, Seafood, Desserts..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={categoryLoading || !newCategoryName.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-zinc-500 font-medium">Quick suggestions:</span>
                {[
                  "Sauces & Dips",
                  "Frozen Vegetables",
                  "Bakery & Sweets",
                  "Seafood",
                  "Ramadan Specials",
                ]
                  .filter((s) => !categories.some((c) => c.toLowerCase() === s.toLowerCase()))
                  .slice(0, 3)
                  .map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddCategory(sug)}
                      disabled={categoryLoading}
                      className="px-2 py-0.5 bg-zinc-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-zinc-400 border border-zinc-700/60 rounded-md text-[10px] font-semibold transition"
                    >
                      + {sug}
                    </button>
                  ))}
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2 px-1">
              <span>Active Categories ({categories.length})</span>
              <span>Items Linked</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64 scrollbar-thin">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No categories created yet.
                </div>
              ) : (
                categories.map((cat) => {
                  const linkedCount = products.filter(
                    (p) => p.category.toLowerCase() === cat.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {cat}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400">
                          {linkedCount} {linkedCount === 1 ? "item" : "items"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={categoryLoading}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                          title={`Delete "${cat}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">
                Changes apply instantly across storefront catalog & forms.
              </span>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: ORDER SLIP & PAYMENT BILL GENERATOR                 */}
      {/* ============================================================ */}
      <OrderSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => {
          setIsSlipModalOpen(false);
          setSelectedSlipOrder(null);
        }}
        initialOrder={selectedSlipOrder}
        productCatalog={products.map((p) => ({
          id: (p._id || p.id || "") as string,
          name: p.name,
          price: p.price,
          packSize: p.packSize,
          availableSizes: p.availableSizes,
          availableHeights: p.availableHeights,
          availableWidths: p.availableWidths,
        }))}
        onOrderSaved={() => {
          loadData();
          showToast("Order slip & payment bill saved successfully!");
        }}
      />
    </div>
  );
}
