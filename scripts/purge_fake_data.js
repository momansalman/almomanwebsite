const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/almoman";
  console.log("Connecting to database...");

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let mongoUri = uri;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
      if (match) {
        mongoUri = match[1];
      }
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log("Connected to MongoDB!");

    // Purge test orders
    const OrderCollection = mongoose.connection.collection("orders");
    const orderDeleteResult = await OrderCollection.deleteMany({});
    console.log("Purged orders from MongoDB:", orderDeleteResult.deletedCount);

    // Purge non-admin test users
    const UserCollection = mongoose.connection.collection("users");
    const userDeleteResult = await UserCollection.deleteMany({
      role: { $ne: "admin" },
      phone: { $not: /3371691006/ }
    });
    console.log("Purged dummy users from MongoDB:", userDeleteResult.deletedCount);
  } catch (err) {
    console.warn("MongoDB note:", err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  // Clean local files
  const ordersPath = path.join(process.cwd(), "Customer_Data", "orders_database.json");
  fs.writeFileSync(ordersPath, JSON.stringify([], null, 2), "utf8");
  console.log("Reset Customer_Data/orders_database.json to []");

  const customersPath = path.join(process.cwd(), "Customer_Data", "customers_database.json");
  const cleanCustomers = [
    {
      id: "admin_moman",
      name: "Moman Salman",
      email: "momansalman@almomanfoods.com",
      phone: "03371691006",
      address: "556/A Model Town, Gujranwala",
      role: "admin",
      createdAt: "07/10/2026, 12:00 PM"
    }
  ];
  fs.writeFileSync(customersPath, JSON.stringify(cleanCustomers, null, 2), "utf8");
  console.log("Reset Customer_Data/customers_database.json to real admin only");

  // Regenerate Excel Files directly
  const PRIMARY_DIR = "D:\\Al Moman Customer Data";
  const MIRROR_DIR = path.join(process.cwd(), "Customer_Data");

  function writeExcel(filename, wb) {
    try {
      if (fs.existsSync(PRIMARY_DIR)) {
        XLSX.writeFile(wb, path.join(PRIMARY_DIR, filename));
        console.log("Wrote primary Excel:", filename);
      }
    } catch (e) {
      console.warn("Could not write to D: drive (file may be open in Excel):", e.message);
    }

    try {
      if (fs.existsSync(MIRROR_DIR)) {
        XLSX.writeFile(wb, path.join(MIRROR_DIR, filename));
        console.log("Wrote mirror Excel:", filename);
      }
    } catch (e) {
      console.warn("Could not write to mirror:", e.message);
    }
  }

  // 1. Customers workbook
  const custRows = [
    {
      "Sr #": 1,
      "Customer ID": "admin_moman",
      "Full Name": "Moman Salman",
      "Email Address": "momansalman@almomanfoods.com",
      "Phone / WhatsApp": "03371691006",
      "Default Address": "556/A Model Town, Gujranwala",
      "Account Role": "ADMIN",
      "Total Orders Placed": 0,
      "Registration Date & Time": "07/10/2026, 12:00 PM"
    }
  ];
  const custWs = XLSX.utils.json_to_sheet(custRows);
  const custWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(custWb, custWs, "Customers");
  writeExcel("Al_Moman_Customers.xlsx", custWb);

  // 2. Orders workbook (Empty fresh sheet)
  const orderWs = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(orderWs, [[
    "Sr #",
    "Order ID",
    "Date & Time (PKT)",
    "Customer Name",
    "Phone / WhatsApp",
    "Fulfillment Type",
    "Delivery / Pickup Address",
    "Items & Patti Sizes",
    "Total Bill (Rs)",
    "Payment Mode",
    "Order Status",
    "Special Notes",
    "Google Maps Live Link"
  ]], { origin: "A1" });
  const orderWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(orderWb, orderWs, "Orders");
  writeExcel("Al_Moman_Orders.xlsx", orderWb);

  // 3. Master Database (both sheets)
  const masterWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(masterWb, custWs, "All Customers");
  XLSX.utils.book_append_sheet(masterWb, orderWs, "All Orders");
  writeExcel("Al_Moman_Master_Database.xlsx", masterWb);

  console.log("ALL FAKE DATA PURGE COMPLETE!");
}

main().catch(console.error);
