const { GoogleGenerativeAI } = require('@google/generative-ai');

const LANG_NAMES = {
  'en': 'English', 'en-GB': 'English (British)', 'ja': 'Japanese',
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

async function translateContent(title, description, targetLangs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 설정되지 않았습니다.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = {};

  for (const lang of targetLangs) {
    const langName = LANG_NAMES[lang] || lang;
    const prompt = `Translate the following YouTube video title and description from Korean to ${langName}.

Rules:
- Keep URLs, hashtags (#), emojis, and brand names exactly as-is
- Use natural, native expressions
- Return ONLY a JSON object with "title" and "description" keys, no explanation

Korean title: ${title || ''}
Korean description: ${description}

Return format: {"title": "...", "description": "..."}`;

    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch[0]);
      result[lang] = { title: parsed.title || '', description: parsed.description || '' };
      console.log(`✅ [${lang}] 번역 완료`);
    } catch (err) {
      console.error(`❌ [${lang}] 번역 실패:`, err.message);
      result[lang] = { title: title || '', description };
    }
    await new Promise(r => setTimeout(r, 200));
  }

  return result;
}

module.exports = { translateContent };
