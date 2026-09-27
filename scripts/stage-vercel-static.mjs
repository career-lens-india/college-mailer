import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = path.join(root, "dist", "index.html");
if (!existsSync(index)) {
  console.error("dist/index.html is missing.");
  process.exit(1);
}

cpSync(index, path.join(root, "public", "index.html"));
cpSync(path.join(root, "dist", "assets"), path.join(root, "public", "assets"), { recursive: true });
console.log("Staged the built site into public/.");
