import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import '@/global/common/styles/index.css'
import App from '@/global/common/App'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>
)
