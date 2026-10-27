import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/styles/lightIntelligence.css'
import '@/components/os/experience.css'
import '@/styles/brandUnification.css'
// Last word on legacy surfaces — must load after every other stylesheet.
import '@/styles/lightSite.css'
// Live Intelligence — the platform identity, applied after every migration layer.
import '@/styles/liveSystem.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)