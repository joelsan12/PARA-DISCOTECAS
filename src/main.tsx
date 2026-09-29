import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const manifestLink = document.createElement('link')
manifestLink.rel = 'manifest'
manifestLink.href = '/manifest.webmanifest'
document.head.appendChild(manifestLink)

const themeMeta = document.createElement('meta')
themeMeta.name = 'theme-color'
themeMeta.content = '#05070c'
document.head.appendChild(themeMeta)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
