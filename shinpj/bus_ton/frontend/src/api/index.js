import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Textbooks
export const searchTextbooks = (query) =>
  api.get('/textbooks', { params: { q: query } }).then((r) => r.data)

export const getTextbooks = () =>
  api.get('/textbooks').then((r) => r.data)

export const getTextbook = (id) =>
  api.get(`/textbooks/${id}`).then((r) => r.data)

export const createTextbook = (formData) =>
  api.post('/textbooks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)

export const updateTextbook = (id, data) =>
  api.put(`/textbooks/${id}`, data).then((r) => r.data)

export const deleteTextbook = (id) =>
  api.delete(`/textbooks/${id}`).then((r) => r.data)

// Send
export const sendEmail = (textbookId, email) =>
  api.post('/send', { textbook_id: textbookId, email }).then((r) => r.data)

// Send Logs (backend mounts mail routes at /api/send, so logs are at /send/logs)
export const getSendLogs = (filters = {}) =>
  api.get('/send/logs', { params: filters }).then((r) => r.data)

export const getSendStats = () =>
  api.get('/send/logs/stats').then((r) => r.data)

export default api
