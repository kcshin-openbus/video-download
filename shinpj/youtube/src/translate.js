const { GoogleGenerativeAI } = require('@google/generative-ai');

const LANG_NAMES = {
  'ko': 'Korean', 'en': 'English', 'en-GB': 'English (British)', 'ja': 'Japanese',
  'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese', 'zh-HK': 'Traditional Chinese (Hong Kong)',
  'vi': 'Vietnamese', 'th': 'Thai', 'id': 'Indonesian', 'ms': 'Malay',
  'fil': 'Filipino', 'my': 'Burmese', 'km': 'Khmer', 'lo': 'Lao', 'si': 'Sinhala',
  'hi': 'Hindi', 'bn': 'Bengali', 'ur': 'Urdu', 'ta': 'Tamil', 'te': 'Telugu',
  'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam',
  'pa': 'Punjabi', 'ne': 'Nepali',
  'ar': 'Arabic', 'fa': 'Persian', 'he': 'Hebrew', 'tr': 'Turkish',
  'az': 'Azerbaijani', 'hy': 'Armenian', 'ka': 'Georgian', 'uz': 'Uzbek',
  'kk': 'Kazakh', 'ky': 'Kyrgyz', 'mn': 'Mongolian',
  'es': 'Spanish', 'es-419': 'Latin American Spanish', 'fr': 'French',
  'fr-CA': 'Canadian French', 'de': 'German', 'it': 'Italian',
  'pt': 'Brazilian Portuguese', 'pt-PT': 'European Portuguese',
  'nl': 'Dutch', 'sv': 'Swedish', 'da': 'Danish', 'fi': 'Finnish',
  'no': 'Norwegian', 'is': 'Icelandic', 'eu': 'Basque', 'ca': 'Catalan', 'gl': 'Galician',
  'ru': 'Russian', 'uk': 'Ukrainian', 'pl': 'Polish', 'cs': 'Czech',
  'sk': 'Slovak', 'hu': 'Hungarian', 'ro': 'Romanian', 'bg': 'Bulgarian',
  'sr': 'Serbian', 'hr': 'Croatian', 'sl': 'Slovenian', 'bs': 'Bosnian',
  'mk': 'Macedonian', 'sq': 'Albanian', 'el': 'Greek', 'lt': 'Lithuanian',
  'lv': 'Latvian', 'et': 'Estonian', 'be': 'Belarusian',
  'sw': 'Swahili', 'am': 'Amharic', 'af': 'Afrikaans', 'zu': 'Zulu',
};

// 429 에러에서 재시도 대기 시간(ms) 추출
function parseRetryDelay(err) {
  const match = err.message && err.message.match(/retry in (\d+(\.\d+)?)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 1000;
  return 20000; // 기본 20초
}

// 언어 배열을 BATCH_SIZE 단위로 나눔
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// 여러 언어를 한 번에 번역 (배치 처리)
async function translateBatch(model, title, description, langs) {
  const langList = langs.map(l => `"${l}": ${LANG_NAMES[l] || l}`).join('\n');
  const prompt = `Translate the following YouTube video title and description from Korean into multiple languages.

Rules:
- Keep URLs and brand names exactly as-is
- Text inside square brackets [ ] should be translated but keep the brackets themselves (e.g. [Playlist] → [플레이리스트] in Korean, [再生リスト] in Japanese)
- Keep emojis as-is
- Use natural, native expressions for each language
- For hashtags (#):
  * If the target language is English (en, en-GB): keep original hashtags as-is
  * For all other languages: REPLACE hashtags with translated versions in the target language (do NOT keep the original English hashtags)
  * Remove any duplicate hashtags (same meaning or same word) from the final result
- Return ONLY a valid JSON object, no explanation, no markdown

Korean title: ${title || ''}
Korean description: ${description}

Target languages (code: language name):
${langList}

Return format:
{
  "langCode1": {"title": "...", "description": "..."},
  "langCode2": {"title": "...", "description": "..."}
}`;

  const response = await model.generateContent(prompt);
  const text = response.response.text().trim();
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`JSON not found in response: ${text.substring(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

async function translateContent(title, description, targetLangs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 설정되지 않았습니다.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = {};

  // 한 번에 20개 언어씩 묶어서 요청 (분당 5회 제한 → 4번 요청으로 80개 처리)
  const BATCH_SIZE = 20;
  const batches = chunkArray(targetLangs, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 배치 ${i + 1}/${batches.length}: [${batch.join(', ')}]`);

    let retries = 3;
    while (retries >= 0) {
      try {
        const batchResult = await translateBatch(model, title, description, batch);
        for (const lang of batch) {
          if (batchResult[lang]) {
            result[lang] = {
              title: batchResult[lang].title || '',
              description: batchResult[lang].description || '',
            };
            console.log(`  ✅ [${lang}] 완료`);
          } else {
            console.warn(`  ⚠️ [${lang}] 응답에 없음 — 원문 유지`);
            result[lang] = { title: title || '', description };
          }
        }
        break;
      } catch (err) {
        const is429 = err.message && err.message.includes('429');
        if (is429 && retries > 0) {
          const waitMs = parseRetryDelay(err);
          console.warn(`  ⏳ 429 한도 초과 — ${Math.round(waitMs / 1000)}초 대기 후 재시도...`);
          await new Promise(r => setTimeout(r, waitMs));
          retries--;
        } else {
          retries--;
          if (retries < 0) {
            console.error(`  ❌ 배치 실패: ${err.message}`);
            for (const lang of batch) result[lang] = { title: title || '', description };
          } else {
            console.warn(`  ⚠️ 재시도 중... (${err.message})`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }

    // 배치 간 간격 — 분당 5회 제한, 20초 간격 (3 RPM으로 안전하게)
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 20000));
    }
  }

  return result;
}

module.exports = { translateContent };
