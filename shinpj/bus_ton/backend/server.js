import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './src/app.js';
import { runSeed } from './seeds/seed.js';

const PORT = process.env.PORT || 3001;

// Seed database if empty
runSeed();

app.listen(PORT, () => {
  console.log(`[Server] MP3 배달 서비스 백엔드가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
