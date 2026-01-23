import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { AnalysisProvider } from './context/AnalysisContext'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnalysisProvider>
          <App />
        </AnalysisProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
