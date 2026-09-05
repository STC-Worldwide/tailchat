import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from './auth';
import { AppShell, Button } from './components';
import { normalizeRoute, type RouteId } from './core';
import { Icon } from './icons';
import { useI18n } from './i18n';
import { DashboardPage, specialPages } from './pages';
import { ResourcePage } from './resources';
import { Alert, AlertDescription } from './components/ui/alert';
import { Input } from './components/ui/input';

const resourceRoutes = new Set<RouteId>([
  'users',
  'login-logs',
  'messages',
  'groups',
  'files',
  'mail',
  'discover',
]);

export default function App() {
  const { session, logout } = useAuth();
  const [route, setRoute] = useState<RouteId>(() =>
    normalizeRoute(window.location.pathname)
  );
  useEffect(() => {
    const sync = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    document.title = `Anchor Chat Admin · ${route}`;
  }, [route]);
  if (!session) return <LoginPage />;
  const navigate = (next: RouteId) => {
    window.history.pushState({}, '', `/admin/${next}`);
    setRoute(next);
  };
  let page: React.ReactNode;
  if (route === 'dashboard')
    page = <DashboardPage username={session.username} />;
  else if (resourceRoutes.has(route))
    page = <ResourcePage route={route as 'users'} />;
  else {
    const Page = specialPages[route];
    page = Page ? <Page /> : null;
  }
  return (
    <AppShell
      route={route}
      username={session.username}
      navigate={navigate}
      logout={logout}
    >
      {page}
    </AppShell>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch {
      setError(t('auth.failed'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <Button
        className="language-switch"
        variant="ghost"
        onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
        icon="language"
      >
        {language === 'zh' ? 'English' : '中文'}
      </Button>
      <main className="login-panel">
        <div className="login-brand">
          <img src="/admin/tailchat-logo.svg" alt="Anchor Chat" />
          <div>
            <strong>{t('app.name')}</strong>
            <span>{t('app.edition')}</span>
          </div>
        </div>
        <div className="login-heading">
          <h1>{t('auth.signIn')}</h1>
          <p>{t('auth.subtitle')}</p>
        </div>
        <form onSubmit={submit}>
          <label>
            <span>{t('auth.username')}</span>
            <Input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            <span>{t('auth.password')}</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
            <Icon name="chevron" />
          </Button>
        </form>
        <footer>{t('app.footer')}</footer>
      </main>
    </div>
  );
}
