import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { App2 } from './App2';
import { App3 } from './App3';
import { Content } from './Content';
// @ts-ignore
import './style.css';

createRoot(document.querySelector('#app')!).render(
  <StrictMode>
    <Content value={{ name: 'jiangwei123' }}>
      <App />
      <App2 />
      <App3 />
    </Content>
  </StrictMode>,
);
