import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/appdist",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileBytes: Number(process.env.MAX_FILE_MB || 200) * 1024 * 1024,
  requireUploadKey:
    String(process.env.REQUIRE_UPLOAD_KEY || "false") === "true",
  uploadKey: process.env.UPLOAD_KEY || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
