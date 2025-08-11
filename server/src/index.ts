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

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json());
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
