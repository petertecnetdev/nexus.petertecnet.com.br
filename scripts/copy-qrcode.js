const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../node_modules/qrcodejs/qrcode.min.js");
const destination = path.resolve(__dirname, "../public/qrcode.min.js");

if (!fs.existsSync(source)) {
  throw new Error(`QR runtime não encontrado em ${source}`);
}

fs.copyFileSync(source, destination);
console.log("Nexus QR runtime prepared at public/qrcode.min.js");
