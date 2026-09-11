import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import './birthday-hologram/About-Game.css'
import './birthday-hologram/i18n'
import './birthday-hologram/about-copy'
import
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)