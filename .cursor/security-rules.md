# 보안 및 운영 룰 (Security & Operations Rules)

## 🔒 보안 가이드라인

### 파일 업로드 보안

- **파일 타입 검증**: .apk, .aab 확장자만 허용
- **파일 크기 제한**: 최대 200MB (환경변수로 설정 가능)
- **MIME 타입 검증**: Content-Type 헤더 확인
- **파일명 보안**: 타임스탬프 + 원본명으로 저장하여 경로 추측 방지

### API 보안

- **입력 검증**: 모든 사용자 입력에 대한 검증 및 sanitization
- **SQL 인젝션 방지**: Mongoose ORM 사용으로 자동 방지
- **XSS 방지**: 출력 데이터 이스케이프 처리
- **CSRF 방지**: 적절한 CORS 설정

### 인증 및 권한

- **업로드 키**: 환경변수로 관리되는 선택적 인증
- **레이트 리미팅**: API 요청 제한으로 DDoS 방지
- **IP 기반 제한**: 필요시 특정 IP 대역 제한

## 🚨 보안 위험 요소

### 높은 위험도

- **악성 파일 업로드**: APK/AAB 파일에 악성 코드 포함 가능성
- **무제한 업로드**: 인증 없이 누구나 업로드 가능
- **파일 실행**: 업로드된 파일이 서버에서 실행될 위험

### 중간 위험도

- **정보 노출**: 에러 메시지에 민감한 정보 포함
- **무차별 대입**: 업로드 키 추측 공격
- **리소스 고갈**: 대용량 파일 업로드로 디스크 공간 고갈

### 낮은 위험도

- **로깅 정보**: 접근 로그에 개인정보 포함
- **디렉토리 리스팅**: 업로드 폴더 구조 노출

## 🛡️ 보안 대책

### 파일 업로드 보안 강화

```typescript
// ✅ 권장: 다층 보안 검증
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // 1. 확장자 검증
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".apk", ".aab"].includes(ext)) {
    return cb(new Error("Invalid file type"), false);
  }

  // 2. MIME 타입 검증
  const allowedMimes = [
    "application/vnd.android.package-archive",
    "application/octet-stream",
  ];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error("Invalid MIME type"), false);
  }

  // 3. 파일명 보안
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (safeName !== file.originalname) {
    return cb(new Error("Invalid filename"), false);
  }

  cb(null, true);
};

// 4. 파일 크기 제한
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // 업로드 디렉토리를 웹 루트와 분리
      cb(null, path.resolve(process.cwd(), "uploads"));
    },
    filename: (req, file, cb) => {
      // 타임스탬프 + 해시 + 원본명으로 저장
      const timestamp = Date.now();
      const hash = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, `${timestamp}_${hash}${ext}`);
    },
  }),
  fileFilter,
  limits: {
    fileSize: config.maxFileBytes,
    files: 1,
    fieldSize: 1024 * 1024, // 1MB (릴리즈 노트 제한)
  },
});
```

### API 보안 강화

```typescript
// ✅ 권장: 보안 미들웨어 체인
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

// 1. 기본 보안 헤더
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// 2. CORS 설정
app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(","),
    credentials: false,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "x-upload-key", "x-requested-with"],
    exposedHeaders: ["x-total-count", "x-page-count"],
  })
);

// 3. 레이트 리미팅
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 10, // 최대 10회
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 최대 50회
  message: "Too many uploads, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. 특정 엔드포인트에 적용
app.use("/api/releases/upload", uploadLimiter);
app.use("/api/releases", strictLimiter);
```

### 환경별 보안 설정

```typescript
// ✅ 권장: 환경별 보안 레벨
export const securityConfig = {
  development: {
    helmet: false, // 개발 시 일부 헤더 비활성화
    cors: { origin: "*" },
    rateLimit: { max: 1000 },
  },
  production: {
    helmet: {
      contentSecurityPolicy: true,
      hsts: true,
      noSniff: true,
      xssFilter: true,
    },
    cors: { origin: ["https://yourdomain.com"] },
    rateLimit: { max: 100 },
  },
};

// 환경에 따른 보안 설정 적용
const env = process.env.NODE_ENV || "development";
const currentSecurity = securityConfig[env as keyof typeof securityConfig];

if (currentSecurity.helmet) {
  app.use(helmet(currentSecurity.helmet));
}
```

## 📊 모니터링 및 로깅

### 보안 이벤트 로깅

```typescript
// ✅ 권장: 구조화된 보안 로깅
import winston from "winston";

const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "security.log",
      level: "warn",
    }),
    new winston.transports.File({
      filename: "security-error.log",
      level: "error",
    }),
  ],
});

// 보안 이벤트 로깅 함수
export const logSecurityEvent = (event: string, details: any) => {
  securityLogger.warn("Security Event", {
    event,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
    details,
  });
};

// 사용 예시
app.use("/api/releases/upload", (req, res, next) => {
  // 업로드 시도 로깅
  logSecurityEvent("upload_attempt", {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    contentType: req.headers["content-type"],
  });
  next();
});
```

### 성능 모니터링

```typescript
// ✅ 권장: 응답 시간 및 리소스 사용량 모니터링
app.use((req, res, next) => {
  const start = Date.now();
  const startMemory = process.memoryUsage();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const endMemory = process.memoryUsage();

    // 성능 메트릭 로깅
    logger.info("Request Performance", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      memoryDelta: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      },
    });

    // 느린 요청 경고
    if (duration > 5000) {
      // 5초 이상
      logger.warn("Slow Request Detected", {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
      });
    }
  });

  next();
});
```

## 🚨 보안 사고 대응

### 업로드 키 노출 시

```typescript
// ✅ 권장: 업로드 키 순환 및 무효화
export const rotateUploadKey = () => {
  const newKey = crypto.randomBytes(32).toString("hex");

  // 환경변수 업데이트 (프로세스 재시작 필요)
  process.env.UPLOAD_KEY = newKey;

  // 로그에 기록
  securityLogger.warn("Upload key rotated", {
    timestamp: new Date().toISOString(),
    action: "key_rotation",
  });

  return newKey;
};

// 업로드 키 무효화
export const invalidateUploadKey = () => {
  process.env.UPLOAD_KEY = "";
  securityLogger.warn("Upload key invalidated", {
    timestamp: new Date().toISOString(),
    action: "key_invalidation",
  });
};
```

### 악성 파일 탐지 시

```typescript
// ✅ 권장: 악성 파일 자동 차단
export const handleMaliciousFile = async (filePath: string, reason: string) => {
  try {
    // 1. 파일 삭제
    await fs.promises.unlink(filePath);

    // 2. 보안 로그 기록
    securityLogger.error("Malicious file detected and removed", {
      filePath,
      reason,
      timestamp: new Date().toISOString(),
      action: "file_removal",
    });

    // 3. 관리자 알림 (필요시)
    await sendSecurityAlert({
      type: "malicious_file",
      filePath,
      reason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    securityLogger.error("Failed to handle malicious file", {
      filePath,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
```

## 🔧 운영 환경 설정

### 프로덕션 보안 체크리스트

- [ ] HTTPS 강제 적용
- [ ] 보안 헤더 설정 (Helmet)
- [ ] CORS 정책 제한
- [ ] 레이트 리미팅 활성화
- [ ] 파일 업로드 제한
- [ ] 에러 메시지 일반화
- [ ] 로그 레벨 조정
- [ ] 환경변수 보안
- [ ] 정기 보안 업데이트
- [ ] 백업 및 복구 계획

### 환경변수 보안

```bash
# ✅ 권장: .env.production 예시
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb://username:password@host:port/database
UPLOAD_DIR=/secure/uploads
MAX_FILE_MB=100
REQUIRE_UPLOAD_KEY=true
UPLOAD_KEY=your-super-secure-upload-key-here
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
SECURITY_HEADERS=true
RATE_LIMIT_STRICT=true
```

---

**적용 범위**: 보안 및 운영 관련 코드  
**업데이트**: 2024년  
**버전**: 1.0.0
