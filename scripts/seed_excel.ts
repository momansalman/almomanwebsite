import { syncCustomerToExcel, syncOrderToExcel, regenerateExcelFiles } from "../src/lib/excelSync";

console.log("Seeding customer database...");

syncCustomerToExcel({
  id: "CUST-1001",
  name: "Hamza Khan",
  email: "hamza.k@gmail.com",
  phone: "03001234567",
  address: "Street 4, Model Town, Gujranwala",
  role: "customer",
  createdAt: "07/10/2026, 02:15 PM",
});

syncCustomerToExcel({
  id: "CUST-1002",
  name: "Zainab Ali",
  email: "zainab.a@gmail.com",
  phone: "03217654321",
  address: "Main Boulevard, Satellite Town, Gujranwala",
  role: "customer",
  createdAt: "07/10/2026, 03:40 PM",
});

syncCustomerToExcel({
  id: "CUST-1003",
  name: "Usman Malik",
  email: "usman.m@gmail.com",
  phone: "03339876543",
  address: "Sector B, DC Colony, Gujranwala",
  role: "customer",
  createdAt: "07/10/2026, 04:10 PM",
});

syncCustomerToExcel({
  id: "CUST-1004",
  name: "Moman Salman (Owner)",
  email: "momansalman@almomanfoods.com",
  phone: "0337-1691006",
  address: "556/A Model Town, Gujranwala",
  role: "admin",
  createdAt: "07/10/2026, 12:00 PM",
});

console.log("Seeding orders database...");

syncOrderToExcel({
  id: "ORD-8821",
  customerName: "Hamza Khan",
  customerEmail: "hamza.k@gmail.com",
  phone: "03001234567",
  fulfillmentType: "Self-Pickup",
  shippingAddress: "Self-Pickup (556/A Model Town, Gujranwala)",
  items: [
    { name: "Chicken Samosa", quantity: 2, price: 750, packSize: "Pack of 12", selectedSize: "3.8\"" },
  ],
  totalAmount: 1500,
  paymentMethod: "Cash on Delivery",
  status: "Pending",
  notes: "Customer will pick up at 6 PM",
  createdAt: "07/10/2026, 04:30 PM",
});

syncOrderToExcel({
  id: "ORD-8822",
  customerName: "Zainab Ali",
  customerEmail: "zainab.a@gmail.com",
  phone: "03217654321",
  fulfillmentType: "Home Delivery",
  shippingAddress: "Main Boulevard, Satellite Town, Gujranwala",
  items: [
    { name: "Beef Shami Kebab", quantity: 1, price: 850, packSize: "Pack of 6" },
    { name: "Crispy Spring Rolls", quantity: 1, price: 650, packSize: "Pack of 10", selectedSize: "3.0\"" },
  ],
  totalAmount: 1500,
  paymentMethod: "Cash on Delivery",
  status: "Confirmed",
  notes: "Model Town vicinity delivery",
  createdAt: "07/10/2026, 05:00 PM",
});

const res = regenerateExcelFiles();
console.log("Excel Generation Result:", JSON.stringify(res, null, 2));
