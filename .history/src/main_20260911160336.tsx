import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './birthday-hologram/Landing-Finish.css
import './birthday-hologram/i18n'
import './birthday-hologram/about-copy'


'
import './birthday-hologram/About-Game.css'

import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing <div id="root"></div> in index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)