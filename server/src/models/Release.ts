import mongoose, { Schema } from "mongoose";

const ReleaseSchema = new Schema({
  appId: { type: String, required: true, index: true }, // com.example.app
  appName: { type: String, required: true },
  versionName: { type: String, required: true }, // e.g., 1.2.3
  versionCode: { type: Number, required: true }, // e.g., 45
  artifactType: { type: String, enum: ["apk", "aab"], required: true },
  fileName: { type: String, required: true }, // 저장된 파일명
  fileSize: { type: Number, required: true },
  sha256: { type: String, required: true },
  releaseNotes: { type: String, default: "" },
  uploadedByIp: { type: String },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Release", ReleaseSchema);
