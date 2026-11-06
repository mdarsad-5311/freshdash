import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Router mode selection:
// 'hash' is ideal for static hosting on PythonAnywhere (/dashboard/) without requiring server rewrite rules
// 'browser' can be enabled when deploying to platforms with SPA rewrite configuration (e.g. Vercel, Netlify)
const routerMode = import.meta.env.VITE_ROUTER_MODE || 'hash';
const basename = import.meta.env.BASE_URL || '/';

const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (routerMode === 'browser') {
    return <BrowserRouter basename={basename}>{children}</BrowserRouter>;
  }
  return <HashRouter>{children}</HashRouter>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>
);
