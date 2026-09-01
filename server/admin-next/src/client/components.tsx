import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, SearchIcon } from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ROUTES, type RouteId } from './core';
import { Icon, type IconName } from './icons';
import { useI18n } from './i18n';
import { Alert, AlertDescription } from './components/ui/alert';
import { Button as ShadcnButton } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import { Input } from './components/ui/input';

type AppButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'type'
> & {
  children?: React.ReactNode;
  className?: string;
  icon?: IconName;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export const Button = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  function Button(
    {
      children,
      icon,
      variant = 'secondary',
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) {
    return (
      <ShadcnButton
        ref={ref}
        className={`button button-${variant} ${className}`}
        type={type}
        variant={
          variant === 'primary'
            ? 'default'
            : variant === 'danger'
            ? 'destructive'
            : variant === 'ghost'
            ? 'ghost'
            : 'outline'
        }
        {...props}
      >
        {icon ? <Icon name={icon} /> : undefined}
        {children}
      </ShadcnButton>
    );
  }
);

export function Card({
  className = '',
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function LoadingState() {
  const { t } = useI18n();
  return (
    <div className="state" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{t('common.loading')}</span>
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div className="state state-empty">
      <span className="empty-mark" aria-hidden="true" />
      <p>{message || t('common.empty')}</p>
    </div>
  );
}

export function ErrorState({
  retry,
  message,
}: {
  retry?: () => void;
  message?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="state">
      <Alert className="state-error" variant="destructive">
        <AlertCircle />
        <AlertDescription>
          {message || t('common.loadError')}
        </AlertDescription>
        {retry && <Button onClick={retry}>{t('common.retry')}</Button>}
      </Alert>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  wide = false,
}: React.PropsWithChildren<{
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  wide?: boolean;
}>) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`modal ${wide ? 'modal-wide' : ''}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="modal-content">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

type ToastType = 'success' | 'error';
const ToastContext = createContext<(message: string, type?: ToastType) => void>(
  () => undefined
);

export function ToastProvider({ children }: React.PropsWithChildren) {
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: ToastType }[]
  >([]);
  const notify = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      3500
    );
  };
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div
            className={`toast toast-${toast.type}`}
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <AlertCircle aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const sections: { label: string; routes: { id: RouteId; icon: IconName }[] }[] =
  [
    {
      label: 'nav.overview',
      routes: [
        { id: 'dashboard', icon: 'dashboard' },
        { id: 'analytics', icon: 'chart' },
      ],
    },
    {
      label: 'nav.content',
      routes: [
        { id: 'users', icon: 'users' },
        { id: 'login-logs', icon: 'login' },
        { id: 'messages', icon: 'message' },
        { id: 'groups', icon: 'group' },
        { id: 'files', icon: 'file' },
        { id: 'mail', icon: 'mail' },
      ],
    },
    { label: 'nav.plugins', routes: [{ id: 'discover', icon: 'discover' }] },
    {
      label: 'nav.infrastructure',
      routes: [
        { id: 'network', icon: 'network' },
        { id: 'socketio', icon: 'socket' },
        { id: 'cache', icon: 'database' },
      ],
    },
    {
      label: 'nav.system',
      routes: [
        { id: 'system-notify', icon: 'notify' },
        { id: 'system', icon: 'settings' },
      ],
    },
  ];

export function AppShell({
  route,
  username,
  navigate,
  logout,
  children,
}: React.PropsWithChildren<{
  route: RouteId;
  username: string;
  navigate: (route: RouteId) => void;
  logout: () => void;
}>) {
  const { t, language, setLanguage } = useI18n();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!palette) setQuery('');
  }, [palette]);
  const results = useMemo(
    () =>
      ROUTES.filter((id) => {
        const haystack = `${t(`route.${id}`)} ${id}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      }),
    [query, t]
  );
  const go = (next: RouteId) => {
    navigate(next);
    setDrawer(false);
    setPalette(false);
  };
  return (
    <div className="app-shell">
      {drawer && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label={t('common.close')}
          onClick={() => setDrawer(false)}
        />
      )}
      <aside className={`sidebar ${drawer ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <img src="/admin/tailchat-logo.svg" alt="Tailchat" />
          <div>
            <strong>{t('app.name')}</strong>
            <span>{t('app.edition')}</span>
          </div>
          <button
            type="button"
            className="icon-button drawer-close"
            onClick={() => setDrawer(false)}
            aria-label={t('common.close')}
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="nav" aria-label={t('app.console')}>
          {sections.map((section) => (
            <div className="nav-section" key={section.label}>
              <span className="nav-label">{t(section.label)}</span>
              {section.routes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={route === item.id ? 'active' : ''}
                  onClick={() => go(item.id)}
                >
                  <Icon name={item.icon} />
                  <span>{t(`route.${item.id}`)}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">{t('app.footer')}</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-only"
            onClick={() => setDrawer(true)}
            aria-label={t('shell.menu')}
          >
            <Icon name="menu" />
          </button>
          <button
            type="button"
            className="command-trigger"
            onClick={() => setPalette(true)}
          >
            <Icon name="search" />
            <span>{t('shell.command')}</span>
            <kbd>⌘K</kbd>
          </button>
          <div className="topbar-spacer" />
          <button
            type="button"
            className="topbar-control"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            aria-label={t('shell.language')}
          >
            <Icon name="language" />
            {language === 'zh' ? 'EN' : '中文'}
          </button>
          <span className="user-chip">
            {username.slice(0, 1).toUpperCase()}
          </span>
          <span className="username">{username}</span>
          <button
            type="button"
            className="icon-button"
            onClick={logout}
            aria-label={t('auth.logout')}
            title={t('auth.logout')}
          >
            <Icon name="logout" />
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
      {palette && (
        <Modal title={t('shell.command')} onClose={() => setPalette(false)}>
          <div className="input-with-icon command-search">
            <SearchIcon aria-hidden="true" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('shell.commandPlaceholder')}
            />
          </div>
          <div className="command-results">
            {results.map((id) => (
              <button type="button" key={id} onClick={() => go(id)}>
                <span>{t(`route.${id}`)}</span>
                <Icon name="chevron" />
              </button>
            ))}
            {!results.length && (
              <EmptyState message={t('common.noSearchResults')} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function LineChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (!data.length)
    return (
      <div className="line-chart chart-empty">
        <EmptyState />
      </div>
    );
  return (
    <div
      className="line-chart"
      role="img"
      aria-label={data.map((item) => `${item.label}: ${item.value}`).join(', ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#28303c"
            strokeDasharray="4 5"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tick={{ fill: '#687487', fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: '#687487', fontSize: 10 }}
          />
          <Tooltip
            cursor={{ stroke: '#41506a' }}
            contentStyle={{
              background: '#171b24',
              border: '1px solid #30394a',
              borderRadius: 8,
            }}
            labelStyle={{ color: '#e8edf5' }}
            itemStyle={{ color: '#73baff' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            isAnimationActive={false}
            stroke="#1890ff"
            strokeWidth={3}
            dot={{ r: 3, fill: '#12151d', stroke: '#73baff', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({
  data,
  format = String,
}: {
  data: { label: string; value: number }[];
  format?: (value: number) => string;
}) {
  if (!data.length)
    return (
      <div className="bar-chart chart-empty">
        <EmptyState />
      </div>
    );
  return (
    <div
      className="bar-chart"
      style={{ height: Math.max(190, data.length * 46) }}
      role="img"
      aria-label={data
        .map((item) => `${item.label}: ${format(item.value)}`)
        .join(', ')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 58, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#bcc5d3', fontSize: 11 }}
            tickFormatter={(label) => label || '—'}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,.025)' }}
            contentStyle={{
              background: '#171b24',
              border: '1px solid #30394a',
              borderRadius: 8,
            }}
            labelStyle={{ color: '#e8edf5' }}
            itemStyle={{ color: '#73baff' }}
            formatter={(value: number) => format(Number(value))}
          />
          <Bar
            dataKey="value"
            fill="#1890ff"
            radius={[0, 5, 5, 0]}
            barSize={8}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="value"
              position="right"
              fill="#c7cfdb"
              fontSize={11}
              formatter={(value: number) => format(Number(value))}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
