import rateLimit from "express-rate-limit";

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 최대 50회 요청
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 200, // 최대 200회 요청
  standardHeaders: true,
  legacyHeaders: false,
});
