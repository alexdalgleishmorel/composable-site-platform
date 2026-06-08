import './admin.css';
import { CognitoAuth } from './CognitoAuth';
import { ConfirmProvider } from './confirm';
import { MockAuth } from './MockAuth';
import { ThemeProvider } from './theme';
import { ToastProvider } from './toasts';

// Use real Cognito auth when configured (production build); otherwise the in-memory mock (local dev
// and tests). The deploy build injects VITE_COGNITO_AUTHORITY / VITE_COGNITO_CLIENT_ID / VITE_API_BASE_URL.
const useCognito = Boolean(
  import.meta.env.VITE_COGNITO_AUTHORITY &&
  import.meta.env.VITE_COGNITO_CLIENT_ID &&
  import.meta.env.VITE_API_BASE_URL,
);

/**
 * The editor is a platform-level tool with its own identity (Knit). Theme/density, toasts, and the
 * confirm modal wrap both the sign-in screen and the signed-in editor, so they're available before
 * and after auth (e.g. "Welcome back" / "Signed out" toasts, theme on the sign-in card).
 */
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>{useCognito ? <CognitoAuth /> : <MockAuth />}</ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
