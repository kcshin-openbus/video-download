import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#1e1b4b',
            color: '#e0e7ff',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#818cf8', secondary: '#e0e7ff' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#e0e7ff' },
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
