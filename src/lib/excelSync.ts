import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

// Primary storage on D: drive root folder
const PRIMARY_DIR = "D:\\Al Moman Customer Data";
// Secondary mirror inside project
const MIRROR_DIR = path.join(process.cwd(), "Customer_Data");

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
}

export interface OrderItemRecord {
  name: string;
  quantity: number;
  price: number;
  packSize: string;
  selectedSize?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  fulfillmentType: string;
  shippingAddress: string;
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  mapsLink: string;
}

function ensureDirectoriesExist() {
  try {
    if (!fs.existsSync(PRIMARY_DIR)) {
      fs.mkdirSync(PRIMARY_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create primary D: folder, continuing:", err);
  }

  try {
    if (!fs.existsSync(MIRROR_DIR)) {
      fs.mkdirSync(MIRROR_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create mirror folder:", err);
  }
}

function getJsonBackupPath(fileName: string, isPrimary = true): string {
  const dir = isPrimary ? PRIMARY_DIR : MIRROR_DIR;
  return path.join(dir, fileName);
}

// Read JSON records
export function readRecords<T>(fileName: string): T[] {
  ensureDirectoriesExist();
  const primaryPath = getJsonBackupPath(fileName, true);
  const mirrorPath = getJsonBackupPath(fileName, false);

  if (fs.existsSync(primaryPath)) {
    try {
      const data = fs.readFileSync(primaryPath, "utf-8");
      return JSON.parse(data);
    } catch {
      // Fall through to mirror
    }
  }

  if (fs.existsSync(mirrorPath)) {
    try {
      const data = fs.readFileSync(mirrorPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  return [];
}

// Save JSON backup in both folders
function saveRecords<T>(fileName: string, records: T[]) {
  ensureDirectoriesExist();
  const jsonStr = JSON.stringify(records, null, 2);

  try {
    fs.writeFileSync(getJsonBackupPath(fileName, true), jsonStr, "utf-8");
  } catch (e) {
    console.warn("Failed writing primary json backup:", e);
  }

  try {
    fs.writeFileSync(getJsonBackupPath(fileName, false), jsonStr, "utf-8");
  } catch (e) {
    console.warn("Failed writing mirror json backup:", e);
  }
}

// Write workbook to both target folders
function writeWorkbookSafely(workbook: XLSX.WorkBook, fileName: string) {
  ensureDirectoriesExist();

  const primaryFile = path.join(PRIMARY_DIR, fileName);
  const mirrorFile = path.join(MIRROR_DIR, fileName);

  try {
    XLSX.writeFile(workbook, primaryFile);
  } catch (err) {
    console.warn(`Could not write Excel file to ${primaryFile}:`, err);
  }

  try {
    XLSX.writeFile(workbook, mirrorFile);
  } catch (err) {
    console.warn(`Could not write Excel file to ${mirrorFile}:`, err);
  }
}

/**
 * Sync / Append Customer to Excel Sheet
 */
export function syncCustomerToExcel(customer: Partial<CustomerRecord>) {
  ensureDirectoriesExist();
  const existing = readRecords<CustomerRecord>("customers_database.json");

  const normalizedEmail = (customer.email || "").toLowerCase().trim();
  const recordIndex = existing.findIndex(
    (c) =>
      (normalizedEmail && c.email.toLowerCase() === normalizedEmail) ||
      (customer.phone && c.phone === customer.phone)
  );

  const newRecord: CustomerRecord = {
    id: customer.id || `CUST-${Date.now()}`,
    name: customer.name || "Customer",
    email: normalizedEmail || "N/A",
    phone: customer.phone || "N/A",
    address: customer.address || "N/A",
    role: customer.role || "customer",
    createdAt: customer.createdAt || new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
  };

  if (recordIndex >= 0) {
    existing[recordIndex] = {
      ...existing[recordIndex],
      ...newRecord,
      // Keep original created date if available
      createdAt: existing[recordIndex].createdAt || newRecord.createdAt,
    };
  } else {
    existing.push(newRecord);
  }

  saveRecords("customers_database.json", existing);
  regenerateExcelFiles();
}

/**
 * Sync / Append Order to Excel Sheet
 */
export function syncOrderToExcel(order: {
  id: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  fulfillmentType: string;
  shippingAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    packSize: string;
    selectedSize?: string;
  }>;
  totalAmount: number;
  paymentMethod?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}) {
  ensureDirectoriesExist();
  const existingOrders = readRecords<OrderRecord>("orders_database.json");

  const itemsSummary = order.items
    .map(
      (i) =>
        `${i.quantity}x ${i.name}${i.selectedSize ? ` [Size: ${i.selectedSize}]` : ""} (${i.packSize})`
    )
    .join(" | ");

  const mapsLink =
    order.fulfillmentType === "Self-Pickup"
      ? "https://maps.google.com/?q=556/A+Model+Town+Gujranwala"
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress)}`;

  const orderRecord: OrderRecord = {
    id: order.id,
    createdAt: order.createdAt || new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail || "N/A",
    phone: order.phone || "N/A",
    fulfillmentType: order.fulfillmentType || "Home Delivery",
    shippingAddress: order.shippingAddress || "556/A Model Town, Gujranwala",
    itemsSummary,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod || "Cash on Delivery (COD)",
    status: order.status || "Pending",
    notes: order.notes || "",
    mapsLink,
  };

  const existingIndex = existingOrders.findIndex((o) => o.id === order.id);
  if (existingIndex >= 0) {
    existingOrders[existingIndex] = orderRecord;
  } else {
    existingOrders.unshift(orderRecord);
  }

  saveRecords("orders_database.json", existingOrders);

  // Also make sure customer is in customers sheet
  syncCustomerToExcel({
    name: order.customerName,
    email: order.customerEmail,
    phone: order.phone,
    address: order.shippingAddress,
    role: "customer",
  });

  regenerateExcelFiles();
}

/**
 * Regenerates all Excel workbooks from the database/json backups
 */
export function regenerateExcelFiles() {
  ensureDirectoriesExist();
  const customers = readRecords<CustomerRecord>("customers_database.json");
  const orders = readRecords<OrderRecord>("orders_database.json");

  // 1. Customers Excel Format
  const customerRows = customers.map((c, idx) => ({
    "Sr #": idx + 1,
    "Customer ID": c.id,
    "Customer Name": c.name,
    "Email Address": c.email,
    "Phone / WhatsApp": c.phone,
    "Default Address": c.address,
    "Account Role": c.role.toUpperCase(),
    "Total Orders Placed": orders.filter((o) => o.phone === c.phone || (c.email !== "N/A" && o.customerEmail === c.email)).length,
    "Registration Date & Time": c.createdAt,
  }));

  const customerWorksheet = XLSX.utils.json_to_sheet(customerRows);
  customerWorksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 22 },
    { wch: 26 },
    { wch: 18 },
    { wch: 35 },
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
  ];

  const customerWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(customerWorkbook, customerWorksheet, "Customers");
  writeWorkbookSafely(customerWorkbook, "Al_Moman_Customers.xlsx");

  // 2. Orders Excel Format
  const orderRows = orders.map((o, idx) => ({
    "Sr #": idx + 1,
    "Order ID": o.id,
    "Date & Time (PKT)": o.createdAt,
    "Customer Name": o.customerName,
    "Phone / WhatsApp": o.phone,
    "Fulfillment Type": o.fulfillmentType,
    "Delivery / Pickup Address": o.shippingAddress,
    "Items & Patti Sizes": o.itemsSummary,
    "Total Bill (Rs)": o.totalAmount,
    "Payment Mode": o.paymentMethod,
    "Order Status": o.status,
    "Special Notes": o.notes || "None",
    "Google Maps Live Link": o.mapsLink,
  }));

  const orderWorksheet = XLSX.utils.json_to_sheet(orderRows);
  orderWorksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 38 },
    { wch: 45 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 25 },
    { wch: 45 },
  ];

  const orderWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(orderWorkbook, orderWorksheet, "Orders");
  writeWorkbookSafely(orderWorkbook, "Al_Moman_Orders.xlsx");

  // 3. Combined Master Workbook
  const masterWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(masterWorkbook, customerWorksheet, "All Customers");
  XLSX.utils.book_append_sheet(masterWorkbook, orderWorksheet, "All Orders");
  writeWorkbookSafely(masterWorkbook, "Al_Moman_Master_Database.xlsx");

  return {
    customerCount: customers.length,
    orderCount: orders.length,
    primaryFolder: PRIMARY_DIR,
    mirrorFolder: MIRROR_DIR,
  };
}

/**
 * Get current sync statistics
 */
export function getExcelSyncStatus() {
  ensureDirectoriesExist();
  const customers = readRecords<CustomerRecord>("customers_database.json");
  const orders = readRecords<OrderRecord>("orders_database.json");

  return {
    customerCount: customers.length,
    orderCount: orders.length,
    primaryFolder: PRIMARY_DIR,
    mirrorFolder: MIRROR_DIR,
    files: [
      "Al_Moman_Customers.xlsx",
      "Al_Moman_Orders.xlsx",
      "Al_Moman_Master_Database.xlsx",
    ],
  };
}

/**
 * Update Order Status in Excel Records
 */
export function updateOrderStatusInExcel(orderId: string, newStatus: string): boolean {
  try {
    ensureDirectoriesExist();
    const orders = readRecords<OrderRecord>("orders_database.json");
    const cleanId = orderId.replace(/^#/, "").trim();
    const idx = orders.findIndex(
      (o) =>
        o.id === cleanId ||
        (o.id && cleanId && o.id.slice(-6).toLowerCase() === cleanId.slice(-6).toLowerCase())
    );

    if (idx !== -1) {
      orders[idx].status = newStatus;
      saveRecords("orders_database.json", orders);
      // Auto re-generate the Excel sheets with the updated status
      try {
        regenerateExcelFiles();
      } catch {}
      return true;
    }
  } catch (err) {
    console.warn("Failed to update order status in Excel:", err);
  }
  return false;
}

