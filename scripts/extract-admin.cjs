const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const dir = __dirname;
const p1 = fs.readFileSync(path.join(dir, "admin-page.b64.p1"), "utf8").trim();
const p2 = fs.readFileSync(path.join(dir, "admin-page.b64.p2"), "utf8").trim();
const b64 = p1 + p2;
const outPath = path.join(dir, "..", "app", "admin", "page.tsx");

const gz = Buffer.from(b64, "base64");
const content = zlib.gunzipSync(gz).toString("utf8");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content);
console.log("[extract-admin] wrote", outPath, "(" + content.length + " chars)");
