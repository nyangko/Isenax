import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'react-quill-new/dist/quill.snow.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorBoundary';
import {I18nextProvider} from 'react-i18next';
import i18n from './i18n';

// One-time migrations across brand renames: FossFLOW -> Flowvia -> Isenax.
// Existing users have their saved diagrams and settings under an old-prefixed
// key — copy them forward so nothing appears to have vanished. Old keys are
// left in place (harmless) in case this ever needs to be re-run or inspected.
function migrateStorageKeys(oldPrefix: string, newPrefix: string) {
  try {
    const oldKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(oldPrefix)) oldKeys.push(key);
    }
    oldKeys.forEach((oldKey) => {
      const newKey = `${newPrefix}${oldKey.slice(oldPrefix.length)}`;
      if (localStorage.getItem(newKey) !== null) return;
      const value = localStorage.getItem(oldKey);
      if (value !== null) localStorage.setItem(newKey, value);
    });
  } catch {
    // localStorage can throw in restricted contexts (private browsing, etc.) —
    // skip migration rather than block app startup.
  }
}
migrateStorageKeys('fossflow', 'flowvia');
migrateStorageKeys('flowvia', 'isenax');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <App />
        </ErrorBoundary>
    </I18nextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// React 19's dev build calls performance.measure() on every component
// mount/render (logComponentRender) to power Chrome DevTools' Performance
// panel React tracks -- the browser never evicts these entries on its own,
// so a long dev session accumulates hundreds of thousands of them. Doesn't
// exist in production builds (this instrumentation is stripped), so only
// clear in dev.
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => performance.clearMeasures(), 30000);
}

// Service worker registration - only in production for PWA functionality
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('Service worker registered successfully'),
    onUpdate: () => console.log('Service worker update available')
  });
} else {
  // Disable service worker in development to avoid cache issues
  serviceWorkerRegistration.unregister();
}
