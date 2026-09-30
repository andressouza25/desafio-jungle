import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppProviders } from './app/AppProviders';
import './styles.css';
import { startMockApi } from './mocks/browser';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Application root element not found.');
}

await startMockApi();

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
