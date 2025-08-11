# 백엔드 개발 룰 (Backend Development Rules)

## 🎯 백엔드 아키텍처

### Express.js 구조

- **미들웨어 순서**: helmet → cors → morgan → express.json → 라우터 → 에러 핸들러
- **라우터 분리**: 기능별로 별도 라우터 파일 생성
- **에러 처리**: 통합된 에러 핸들러로 일관된 응답 형식

### MongoDB + Mongoose

- **스키마 정의**: 명확한 타입과 검증 규칙 설정
- **인덱싱**: 자주 조회되는 필드에 인덱스 추가
- **관계 설정**: ref를 사용한 문서 간 관계 정의

## 📝 코딩 패턴

### 비동기 처리

```typescript
// ✅ 권장: async/await + try-catch
async function handleRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await someAsyncOperation();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ❌ 비권장: Promise 체이닝
function handleRequest(req: Request, res: Response, next: NextFunction) {
  someAsyncOperation()
    .then((result) => res.json(result))
    .catch((error) => next(error));
}
```

### 에러 처리

```typescript
// ✅ 권장: 구체적인 에러 메시지
if (!user) {
  throw Object.assign(new Error("User not found"), { status: 404 });
}

// ❌ 비권장: 일반적인 에러 메시지
if (!user) {
  throw new Error("Something went wrong");
}
```

### 입력 검증

```typescript
// ✅ 권장: 명시적 타입 검증
function validateUpload(file: Express.Multer.File) {
  if (!file) throw new Error("No file uploaded");
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large");

  const ext = path.extname(file.originalname).toLowerCase();
  if (![".apk", ".aab"].includes(ext)) {
    throw new Error("Invalid file type");
  }
}
```

## 🔒 보안 패턴

### 파일 업로드 보안

```typescript
// ✅ 권장: 파일 필터링
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['.apk', '.aab'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// ✅ 권장: 파일 크기 제한
const upload = multer({
  storage: multer.diskStorage({...}),
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 1
  }
});
```

### API 보안

```typescript
// ✅ 권장: 레이트 리미팅
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 최대 50회
  message: "Too many uploads, please try again later",
});

// ✅ 권장: CORS 설정
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: false,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "x-upload-key"],
  })
);
```

## 🗄️ 데이터베이스 패턴

### Mongoose 스키마

```typescript
// ✅ 권장: 명확한 타입과 검증
const ReleaseSchema = new Schema({
  appId: {
    type: String,
    required: true,
    index: true,
    trim: true,
    minlength: 3,
  },
  versionName: {
    type: String,
    required: true,
    match: /^\d+\.\d+\.\d+$/, // semantic versioning
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// ✅ 권장: 가상 필드
ReleaseSchema.virtual("formattedSize").get(function () {
  return (this.fileSize / 1024 / 1024).toFixed(2) + " MB";
});
```

### 쿼리 최적화

```typescript
// ✅ 권장: 필요한 필드만 선택
const releases = await Release.find({ appId })
  .select("appName versionName fileSize createdAt")
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();

// ✅ 권장: 집계 쿼리
const stats = await Release.aggregate([
  {
    $group: {
      _id: null,
      totalReleases: { $sum: 1 },
      totalDownloads: { $sum: "$downloads" },
    },
  },
]);
```

## 🧪 테스트 패턴

### 단위 테스트

```typescript
// ✅ 권장: 함수별 독립적 테스트
describe("parseApk", () => {
  it("should extract metadata from valid APK", async () => {
    const result = await parseApk("test.apk");
    expect(result.appId).toBeDefined();
    expect(result.versionName).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should return default values for invalid APK", async () => {
    const result = await parseApk("invalid.apk");
    expect(result.appId).toBe("unknown");
    expect(result.versionName).toBe("0.0.0");
  });
});
```

### 통합 테스트

```typescript
// ✅ 권장: API 엔드포인트 테스트
describe("POST /api/releases/upload", () => {
  it("should upload valid APK file", async () => {
    const response = await request(app)
      .post("/api/releases/upload")
      .attach("file", "test.apk")
      .field("releaseNotes", "Test release");

    expect(response.status).toBe(200);
    expect(response.body.release).toBeDefined();
  });
});
```

## 📊 로깅 및 모니터링

### 로깅 패턴

```typescript
// ✅ 권장: 구조화된 로깅
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// 사용 예시
logger.info("File uploaded", {
  fileName: file.originalname,
  fileSize: file.size,
  ip: req.ip,
  userAgent: req.headers["user-agent"],
});
```

### 성능 모니터링

```typescript
// ✅ 권장: 응답 시간 측정
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("Request completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});
```

## 🔧 환경 설정

### 환경변수 관리

```typescript
// ✅ 권장: 타입 안전한 설정
export const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/appdist",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileBytes: Number(process.env.MAX_FILE_MB || 200) * 1024 * 1024,
  requireUploadKey: process.env.REQUIRE_UPLOAD_KEY === "true",
  uploadKey: process.env.UPLOAD_KEY || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  nodeEnv: process.env.NODE_ENV || "development",
};

// ✅ 권장: 환경별 설정
if (config.nodeEnv === "production") {
  // 프로덕션 전용 설정
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
        },
      },
    })
  );
}
```

---

**적용 범위**: 백엔드 서버 코드  
**업데이트**: 2024년  
**버전**: 1.0.0
