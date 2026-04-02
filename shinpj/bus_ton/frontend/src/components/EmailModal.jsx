import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { sendEmail } from '../api'

export default function EmailModal({ isOpen, onClose, textbook }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  if (!textbook) return null

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSend = async () => {
    if (!isValidEmail) {
      toast.error('올바른 이메일 주소를 입력해주세요.')
      return
    }

    setSending(true)
    const toastId = toast.loading('MP3 파일을 전송 중입니다...')

    try {
      await sendEmail(textbook.id, email)
      toast.success('전송 완료! 이메일을 확인해주세요.', { id: toastId })
      setEmail('')
      onClose()
    } catch (err) {
      const msg = err.response?.data?.error || '전송에 실패했습니다. 다시 시도해주세요.'
      toast.error(msg, { id: toastId })
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isValidEmail && !sending) {
      handleSend()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MP3 이메일 전송">
      <div className="space-y-5">
        {/* Textbook info */}
        <div className="flex items-start gap-4 p-4 bg-primary-50/50 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-slate-800">{textbook.title}</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              {textbook.language === 'japanese' ? '일본어' : textbook.language === 'chinese' ? '중국어' : textbook.language} · {textbook.publisher} · MP3 {textbook.mp3_count ?? 0}개
            </p>
          </div>
        </div>

        {/* Email input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            이메일 주소
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="example@email.com"
            disabled={sending}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:opacity-50 transition-all"
          />
          {email && !isValidEmail && (
            <p className="mt-1.5 text-xs text-red-500">올바른 이메일 형식을 입력해주세요.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={!isValidEmail || sending}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                전송 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                전송하기
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
