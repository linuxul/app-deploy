import mongoose, { Schema } from "mongoose";

const DownloadLogSchema = new Schema({
  releaseId: { type: Schema.Types.ObjectId, ref: "Release", required: true },
  ip: { type: String },
  ua: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DownloadLog", DownloadLogSchema);
