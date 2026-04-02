import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { getTextbooks, createTextbook, updateTextbook, deleteTextbook } from '../api'

const langOptions = [
  { value: 'japanese', label: '일본어' },
  { value: 'chinese', label: '중국어' },
]
const langLabel = (v) => langOptions.find((l) => l.value === v)?.label || v

function TextbookForm({ initial, onSubmit, onCancel, loading }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [language, setLanguage] = useState(initial?.language || 'japanese')
  const [publisher, setPublisher] = useState(initial?.publisher || '')
  const [files, setFiles] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('교재명을 입력해주세요.')
      return
    }

    if (!initial && !files) {
      toast.error('MP3 파일을 선택해주세요.')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('language', language)
    formData.append('publisher', publisher.trim())

    if (files) {
      for (const file of files) {
        formData.append('files', file)
      }
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">교재명 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          placeholder="교재명을 입력하세요"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">언어 *</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
          >
            {langOptions.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">출판사</label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            placeholder="출판사명"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          MP3 파일 {initial ? '(변경 시 선택)' : '*'}
        </label>
        <input
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 cursor-pointer"
        />
        {files && (
          <p className="mt-1 text-xs text-slate-500">{files.length}개 파일 선택됨</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {initial ? '수정하기' : '등록하기'}
        </button>
      </div>
    </form>
  )
}

export default function TextbookTable() {
  const [textbooks, setTextbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await getTextbooks()
      setTextbooks(Array.isArray(data) ? data : data.textbooks || [])
    } catch {
      toast.error('교재 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (formData) => {
    try {
      setFormLoading(true)
      await createTextbook(formData)
      toast.success('교재가 등록되었습니다.')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('등록에 실패했습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (formData) => {
    try {
      setFormLoading(true)
      await updateTextbook(editTarget.id, formData)
      toast.success('교재가 수정되었습니다.')
      setEditTarget(null)
      fetchData()
    } catch {
      toast.error('수정에 실패했습니다.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTextbook(deleteTarget.id)
      toast.success('교재가 삭제되었습니다.')
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">교재 관리</h2>
          <p className="text-sm text-slate-500 mt-1">등록된 교재 {textbooks.length}개</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/25 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          교재 추가
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">교재명</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">언어</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">출판사</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">MP3</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-primary-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    불러오는 중...
                  </td>
                </tr>
              ) : textbooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    등록된 교재가 없습니다.
                  </td>
                </tr>
              ) : (
                textbooks.map((tb) => (
                  <tr key={tb.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{tb.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                        {langLabel(tb.language)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{tb.publisher || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-center">{tb.mp3Count ?? tb.mp3_count ?? 0}개</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(tb)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tb)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="교재 등록" size="lg">
        <TextbookForm onSubmit={handleCreate} onCancel={() => setShowModal(false)} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="교재 수정" size="lg">
        {editTarget && (
          <TextbookForm
            initial={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="교재 삭제" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{deleteTarget?.title}</span>을(를) 삭제하시겠습니까?
            <br />
            <span className="text-red-500">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-md shadow-red-500/25 transition-all"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
