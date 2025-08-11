import fs from "fs";
import path from "path";
import { config } from "../config";

export function ensureUploadDir() {
  const p = path.resolve(config.uploadDir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}
