import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Release from "../models/Release";
import DownloadLog from "../models/DownloadLog";
import { ensureUploadDir } from "../utils/storage";
import { sha256Of } from "../utils/checksum";
import { parseApk } from "../utils/apkmeta";
import { uploadLimiter, publicLimiter } from "../middlewares/rateLimit";
import { config } from "../config";

const router = Router();

const uploadDir = ensureUploadDir();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const time = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${time}__${safe}`);
  },
});

function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".apk" && ext !== ".aab")
    return cb(new Error("Only .apk or .aab allowed"));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileBytes },
});

// 업로드(공개)
router.post(
  "/upload",
  uploadLimiter,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (config.requireUploadKey) {
        const key = req.header("x-upload-key") || req.query.key;
        if (key !== config.uploadKey)
          throw Object.assign(new Error("Invalid upload key"), { status: 401 });
      }

      if (!req.file) throw Object.assign(new Error("No file"), { status: 400 });
      const filePath = req.file.path;

      // APK 메타 추출 (.aab는 별도 처리 필요)
      let appId = "unknown",
        versionName = "0.0.0",
        versionCode = 0,
        appName = "unknown";
      if (path.extname(req.file.originalname).toLowerCase() === ".apk") {
        try {
          ({ appId, versionName, versionCode, appName } = await parseApk(
            filePath
          ));
        } catch {}
      }

      const artifactType = path
        .extname(req.file.originalname)
        .toLowerCase()
        .replace(".", "");
      const sha256 = sha256Of(filePath);

      const rel = await Release.create({
        appId,
        appName,
        versionName,
        versionCode,
        artifactType,
        fileName: path.basename(filePath),
        fileSize: req.file.size,
        sha256,
        releaseNotes: String(req.body.releaseNotes || ""),
        uploadedByIp: req.ip,
      });

      res.json({
        message: "Uploaded",
        release: rel,
        downloadUrl: `/files/${rel.fileName}`,
      });
    } catch (e) {
      next(e);
    }
  }
);

// 목록/검색
router.get("/", publicLimiter, async (req, res, next) => {
  try {
    const { q, appId, page = "1", size = "20" } = req.query as any;
    const p = Math.max(parseInt(page), 1) - 1;
    const s = Math.min(Math.max(parseInt(size), 1), 100);
    const cond: any = {};
    if (appId) cond.appId = appId;
    if (q)
      cond.$or = [
        { appName: { $regex: q, $options: "i" } },
        { appId: { $regex: q, $options: "i" } },
        { versionName: { $regex: q, $options: "i" } },
      ];
    const [items, total] = await Promise.all([
      Release.find(cond)
        .sort({ createdAt: -1 })
        .skip(p * s)
        .limit(s)
        .lean(),
      Release.countDocuments(cond),
    ]);
    res.json({ items, total, page: p + 1, size: s });
  } catch (e) {
    next(e);
  }
});

// 상세
router.get("/:id", publicLimiter, async (req, res, next) => {
  try {
    const item = await Release.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// 다운로드(로그 기록 + 정적 파일 제공 URL 반환)
router.get("/:id/download", publicLimiter, async (req, res, next) => {
  try {
    const item = await Release.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    item.downloads += 1;
    await item.save();
    await DownloadLog.create({
      releaseId: item._id,
      ip: req.ip,
      ua: req.headers["user-agent"],
    });

    return res.json({ url: `/files/${item.fileName}` });
  } catch (e) {
    next(e);
  }
});

// 삭제(공개 환경에서는 비권장 — 필요 시 업로드 키 요구)
router.delete("/:id", uploadLimiter, async (req, res, next) => {
  try {
    if (config.requireUploadKey) {
      const key = req.header("x-upload-key") || req.query.key;
      if (key !== config.uploadKey)
        throw Object.assign(new Error("Invalid upload key"), { status: 401 });
    }
    const item = await Release.findByIdAndDelete(req.params.id);
    if (item) {
      const p = path.resolve(uploadDir, item.fileName);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    res.json({ message: "Deleted" });
  } catch (e) {
    next(e);
  }
});

export default router;
