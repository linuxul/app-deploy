# 앱 배포 센터 (App Distribution Center)

Firebase App Distribution과 유사한 간단한 안드로이드 앱 배포 사이트입니다.

## 🚀 주요 기능

- **APK/AAB 업로드**: 누구나 인증 없이 업로드 가능
- **메타데이터 자동 추출**: APK에서 앱 정보 자동 파싱
- **릴리즈 관리**: 버전별 릴리즈 정보 저장 및 관리
- **다운로드 제공**: 직접 다운로드 링크 제공
- **검색 및 필터링**: 앱명, AppId, 버전으로 검색
- **통계**: 다운로드 카운트 및 로그 기록

## 🏗️ 아키텍처

```
[브라우저(Vue+Bootstrap)] ⇄ [Express 서버] ⇄ [MongoDB]
                                    │
                             [파일 스토리지(로컬)]
```

## 🛠️ 기술 스택

### 백엔드

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **TypeScript**
- **Multer** (파일 업로드)
- **Helmet** (보안)

### 프론트엔드

- **Vue 3** + **Composition API**
- **Vite** (빌드 도구)
- **Bootstrap 5** (UI 프레임워크)
- **Vue Router** (라우팅)
- **Axios** (HTTP 클라이언트)

## 📁 프로젝트 구조

```
.
├── server/                 # 백엔드 서버
│   ├── src/
│   │   ├── models/        # MongoDB 모델
│   │   ├── routes/        # API 라우터
│   │   ├── middlewares/   # 미들웨어
│   │   ├── utils/         # 유틸리티 함수
│   │   ├── config.ts      # 환경 설정
│   │   └── index.ts       # 서버 진입점
│   ├── uploads/           # 업로드된 파일 저장소
│   ├── package.json
│   └── Dockerfile
├── web/                    # 프론트엔드
│   ├── src/
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── components/    # 공통 컴포넌트
│   │   ├── App.vue        # 메인 앱
│   │   ├── main.ts        # 진입점
│   │   ├── router.ts      # 라우터
│   │   └── api.ts         # API 클라이언트
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # 전체 시스템 실행
└── README.md
```

## 🚀 빠른 시작

### 1. 환경 요구사항

- Node.js 18+
- Docker & Docker Compose
- MongoDB (Docker로 자동 실행)

### 2. 개발 모드 실행

```bash
# 1. MongoDB 실행
docker run -d --name mongo -p 27017:27017 mongo:7

# 2. 백엔드 서버 실행
cd server
npm install
npm run dev

# 3. 프론트엔드 실행
cd ../web
npm install
npm run dev
```

### 3. Docker Compose로 전체 실행

```bash
# 전체 시스템 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

## 🔧 환경 설정

### 서버 환경변수 (.env)

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/appdist
UPLOAD_DIR=uploads
MAX_FILE_MB=200
REQUIRE_UPLOAD_KEY=false
UPLOAD_KEY=CHANGEME
CORS_ORIGIN=*
```

### 주요 설정 설명

- `MAX_FILE_MB`: 최대 업로드 파일 크기 (MB)
- `REQUIRE_UPLOAD_KEY`: 업로드 키 인증 활성화 여부
- `UPLOAD_KEY`: 업로드 시 필요한 키 (REQUIRE_UPLOAD_KEY=true일 때)

## 📱 API 엔드포인트

### 릴리즈 관리

- `POST /api/releases/upload` - APK/AAB 업로드
- `GET /api/releases` - 릴리즈 목록/검색
- `GET /api/releases/:id` - 릴리즈 상세 정보
- `GET /api/releases/:id/download` - 다운로드 URL 반환
- `DELETE /api/releases/:id` - 릴리즈 삭제

### 파일 다운로드

- `GET /files/:filename` - 직접 파일 다운로드

## 🔒 보안 고려사항

⚠️ **주의**: 인증을 완전히 제거하면 악성 APK 업로드/유포 위험이 존재합니다.

### 권장 보안 조치

1. **용량 제한**: 파일 크기 제한 (기본 200MB)
2. **파일 타입 검증**: .apk/.aab만 허용
3. **레이트 리밋**: 업로드/API 요청 제한
4. **업로드 키**: 선택적 인증 (환경변수로 설정)
5. **바이러스 스캔**: ClamAV 등과 연동 권장

## 📊 사용 예시

### cURL로 업로드

```bash
curl -F file=@app-release.apk \
     -F releaseNotes="버그 수정 및 성능 개선" \
     http://localhost:8080/api/releases/upload
```

### 릴리즈 목록 조회

```bash
curl "http://localhost:8080/api/releases?q=com.example&page=1&size=10"
```

### 다운로드

```bash
# 다운로드 URL 획득
DOWNLOAD_URL=$(curl -s "http://localhost:8080/api/releases/RELEASE_ID/download" | jq -r .url)

# 파일 다운로드
curl -L "http://localhost:8080$DOWNLOAD_URL" -o app.apk
```

## 🚀 배포

### Docker Compose 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.yml up -d --build

# 환경별 설정
docker-compose -f docker-compose.prod.yml up -d
```

### 수동 배포

```bash
# 백엔드
cd server
npm run build
npm start

# 프론트엔드
cd web
npm run build
# nginx로 정적 파일 서빙
```

## 🔧 확장 가능성

- **인증 시스템**: GitHub OAuth, JWT 등
- **앱 채널**: stable/beta/dev 분기
- **QR 코드**: 모바일 다운로드용
- **Webhook**: Slack/Discord 알림
- **CLI 도구**: CI/CD 자동화
- **iOS 지원**: .ipa/.plist 호스팅

## 📝 라이선스

MIT License

## ⚠️ 면책 조항

업로드된 APK의 저작권/상표권은 업로더에게 귀속됩니다.
불법 배포를 방지하기 위한 관리자 정책을 준비하세요.

---

**개발자**: 앱 배포 센터 팀  
**버전**: 1.0.0  
**최종 업데이트**: 2024년
