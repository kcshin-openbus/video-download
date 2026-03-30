import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export async function uploadVideo(file, language = 'auto', onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post(`/upload?language=${language}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
  return res.data;
}

export async function uploadUrl(url, language = 'auto') {
  const res = await api.post('/upload-url', { url, language });
  return res.data;
}

export async function getTaskStatus(taskId) {
  const res = await api.get(`/status/${taskId}`);
  return res.data;
}

export async function downloadSubtitle(taskId, format = 'srt', lang) {
  const params = new URLSearchParams({ format });
  if (lang) params.append('lang', lang);
  const res = await api.get(`/subtitle/${taskId}?${params.toString()}`, {
    responseType: 'blob',
  });
  return res.data;
}

export async function getSubtitleText(taskId, format = 'srt') {
  const res = await api.get(`/subtitle/${taskId}?format=${format}`);
  return res.data;
}

export async function getSegments(taskId) {
  const res = await api.get(`/segments/${taskId}`);
  return res.data;
}

export async function translateSegments(taskId, targetLang) {
  const res = await api.post(`/translate/${taskId}`, { target_lang: targetLang });
  return res.data;
}

export async function getSettings() {
  const res = await api.get('/settings');
  return res.data;
}

export async function setProxy(proxyUrl) {
  const res = await api.put('/settings/proxy', { proxy_url: proxyUrl });
  return res.data;
}
