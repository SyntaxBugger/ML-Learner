// StrictMode helps React identify common development-time problems.
import { StrictMode } from 'react'
// createRoot connects React to the <div id="root"> in index.html.
import { createRoot } from 'react-dom/client'
// Global CSS is loaded once at the application entry point.
import './index.css'
// App is the top-level component containing the whole page.
import App from './App.jsx'

// React starts rendering App inside the root element in the HTML document.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
