const fs = require('fs');
const http = require('http');

async function main() {
  // Sign in as Moman Salman
  const loginPayload = JSON.stringify({ name: "Moman Salman", phone: "03371691006" });
  
  const req = http.request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(loginPayload),
      },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log("Login response status:", res.statusCode);
        const setCookie = res.headers["set-cookie"];
        console.log("Set-Cookie header received:", Boolean(setCookie));
        if (setCookie) {
          fs.writeFileSync("d:\\admin_cookie.txt", setCookie[0], "utf-8");
        }
      });
    }
  );

  req.write(loginPayload);
  req.end();
}

main();
