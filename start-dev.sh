#!/bin/bash

echo "🚀 앱 배포 센터 개발 환경 시작"

# MongoDB 실행 확인
if ! docker ps | grep -q mongo; then
    echo "📦 MongoDB 컨테이너 시작..."
    docker run -d --name mongo -p 27017:27017 mongo:7
    sleep 5
else
    echo "✅ MongoDB 이미 실행 중"
fi

# 백엔드 서버 시작
echo "🔧 백엔드 서버 시작..."
cd server
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

# 환경변수 파일 생성 (없는 경우)
if [ ! -f ".env" ]; then
    echo "📝 .env 파일 생성..."
    cat > .env << EOF
PORT=8080
MONGO_URI=mongodb://localhost:27017/appdist
UPLOAD_DIR=uploads
MAX_FILE_MB=200
REQUIRE_UPLOAD_KEY=false
UPLOAD_KEY=CHANGEME
CORS_ORIGIN=*
EOF
fi

# 백그라운드에서 서버 실행
echo "🚀 백엔드 서버 시작 (포트 8080)..."
npm run dev &
SERVER_PID=$!

# 프론트엔드 시작
echo "🌐 프론트엔드 시작..."
cd ../web
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

echo "🚀 프론트엔드 시작 (포트 5173)..."
npm run dev &
WEB_PID=$!

echo ""
echo "🎉 개발 환경이 시작되었습니다!"
echo "📱 백엔드: http://localhost:8080"
echo "🌐 프론트엔드: http://localhost:5173"
echo "🗄️  MongoDB: mongodb://localhost:27017"
echo ""
echo "중지하려면: pkill -f 'npm run dev'"

# 프로세스 종료 처리
trap "echo '🛑 개발 환경 중지...'; kill $SERVER_PID $WEB_PID 2>/dev/null; exit" INT

# 프로세스 모니터링
wait 