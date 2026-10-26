const fs = require('fs');
const http = require('http');

async function testCreateOrderSlip() {
  const cookie = fs.readFileSync("d:\\admin_cookie.txt", "utf-8").split(";")[0];

  const payload = JSON.stringify({
    orderId: "INV-982104",
    customerName: "Haji Abdul Rehman",
    phone: "0300-7412345",
    email: "abdulrehman@gmail.com",
    shippingAddress: "Street 4, Sector B, Model Town, Gujranwala",
    fulfillmentType: "Home Delivery",
    customerLocationLink: "https://maps.google.com/?q=32.1872,74.1945",
    items: [
      {
        name: "Chicken Samosa",
        quantity: 2,
        price: 750,
        packSize: "12 Pieces / Pack",
        selectedSize: "Regular",
      },
      {
        name: "Beef Chapli Kebab",
        quantity: 1,
        price: 950,
        packSize: "6 Pieces / Pack",
      },
      {
        name: "Crispy Spring Rolls",
        quantity: 1,
        price: 650,
        packSize: "12 Pieces / Pack",
      },
      {
        name: "Chicken Patties",
        quantity: 1,
        price: 850,
        packSize: "6 Pieces / Pack",
        selectedSize: "3x3 Inches",
      },
    ],
    deliveryFee: 150,
    totalAmount: 4100,
    paymentMethod: "Cash on Delivery (COD)",
    notes: "Special family gathering order. Please deliver fresh blast-frozen packs.",
  });

  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/admin/orders/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Cookie": cookie,
      },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("Create Order Slip Status:", res.statusCode);
        console.log("Response Body:", data);
      });
    }
  );

  req.write(payload);
  req.end();
}

testCreateOrderSlip();
