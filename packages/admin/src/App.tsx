import './admin.css';
import { CognitoAuth } from './CognitoAuth';
import { MockAuth } from './MockAuth';

// Use real Cognito auth when configured (production build); otherwise the in-memory mock (local dev
// and tests). The deploy build injects VITE_COGNITO_AUTHORITY / VITE_COGNITO_CLIENT_ID / VITE_API_BASE_URL.
const useCognito = Boolean(
  import.meta.env.VITE_COGNITO_AUTHORITY &&
  import.meta.env.VITE_COGNITO_CLIENT_ID &&
  import.meta.env.VITE_API_BASE_URL,
);

export function App() {
  return useCognito ? <CognitoAuth /> : <MockAuth />;
}
