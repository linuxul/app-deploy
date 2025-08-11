import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { config } from "./config";
import releaseRouter from "./routes/releases";
import { errorHandler } from "./middlewares/error";

const app = express();

// Trust proxy for rate limiting behind nginx
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: false }));

// 파일 업로드를 위한 body parser 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(morgan("dev"));

// 정적 파일 제공(다운로드 링크 직접 제공용)
app.use(
  "/files",
  express.static(path.resolve(config.uploadDir), {
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.use("/api/releases", releaseRouter);
app.use(errorHandler);

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(config.port, () =>
      console.log(`Server listening on ${config.port}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
