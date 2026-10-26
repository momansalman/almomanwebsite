const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

function sync() {
  const customers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "Customer_Data", "customers_database.json"), "utf8")
  );
  const orders = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "Customer_Data", "orders_database.json"), "utf8")
  );

  const PRIMARY_DIR = "D:\\Al Moman Customer Data";
  const MIRROR_DIR = path.join(process.cwd(), "Customer_Data");

  function writeExcel(filename, wb) {
    for (const dir of [PRIMARY_DIR, MIRROR_DIR]) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        XLSX.writeFile(wb, path.join(dir, filename));
        console.log(`Saved ${filename} to ${dir}`);
      } catch (e) {
        console.warn(`Could not save to ${dir}:`, e.message);
      }
    }
  }

  // 1. Customers
  const custRows = customers.map((c, i) => ({
    "Sr #": i + 1,
    "Customer ID": c.id,
    "Full Name": c.name,
    "Email Address": c.email || "N/A",
    "Phone / WhatsApp": c.phone,
    "Default Address": c.address || "N/A",
    "Account Role": (c.role || "customer").toUpperCase(),
    "Registration Date & Time": c.createdAt,
  }));
  const custWs = XLSX.utils.json_to_sheet(custRows);
  const custWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(custWb, custWs, "Customers");
  writeExcel("Al_Moman_Customers.xlsx", custWb);

  // 2. Orders
  const orderRows = orders.map((o, i) => ({
    "Sr #": i + 1,
    "Order ID": o.id,
    "Date & Time (PKT)": o.createdAt,
    "Customer Name": o.customerName,
    "Phone / WhatsApp": o.phone,
    "Fulfillment Type": o.fulfillmentType,
    "Delivery / Pickup Address": o.shippingAddress,
    "Items & Patti Sizes": o.itemsSummary,
    "Total Bill (Rs)": o.totalAmount,
    "Payment Mode": o.paymentMethod || "Cash on Delivery (COD)",
    "Order Status": o.status || "Pending",
    "Special Notes": o.notes || "",
    "Google Maps Live Link": o.mapsLink || "",
  }));
  const orderWs = XLSX.utils.json_to_sheet(orderRows);
  const orderWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(orderWb, orderWs, "Orders");
  writeExcel("Al_Moman_Orders.xlsx", orderWb);

  // 3. Master
  const masterWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(masterWb, custWs, "All Customers");
  XLSX.utils.book_append_sheet(masterWb, orderWs, "All Orders");
  writeExcel("Al_Moman_Master_Database.xlsx", masterWb);

  console.log("Excel Sync Finished Successfully!");
}

sync();
