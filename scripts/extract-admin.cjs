const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const b64Path = path.join(__dirname, "admin-page.b64.gz");
const outPath = path.join(__dirname, "..", "app", "admin", "page.tsx");

const b64 = fs.readFileSync(b64Path, "utf8").trim();
const gz = Buffer.from(b64, "base64");
const content = zlib.gunzipSync(gz).toString("utf8");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content);
console.log("[extract-admin] wrote", outPath, "(" + content.length + " chars)");
