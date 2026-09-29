import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main>
      <h1>Pirate Battle</h1>
      <p>Project bootstrap is ready.</p>
    </main>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Application root element not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
