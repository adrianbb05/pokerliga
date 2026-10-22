import { useEffect, useState } from 'react';
import { checkSession, login, logout } from '../services/auth';
import { clearLocalCache, isLocalMode } from '../services/api';

function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isLocalMode()) clearLocalCache();
    checkSession()
      .then((session) => { if (mounted) setAuthenticated(session.authenticated); })
      .catch((err) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setChecking(false); });
    const lock = () => {
      clearLocalCache();
      setAuthenticated(false);
      setError('La sesión ha caducado. Introduce la contraseña de nuevo.');
    };
    window.addEventListener('pokerliga:unauthorized', lock);
    return () => {
      mounted = false;
      window.removeEventListener('pokerliga:unauthorized', lock);
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await login(password);
      setPassword('');
      setAuthenticated(session.authenticated);
    } catch (err) {
      setPassword('');
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError('');
    try {
      await logout();
      clearLocalCache();
      setAuthenticated(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <div className="app-shell"><div className="status-panel load-state">Comprobando acceso…</div></div>;

  if (authenticated) {
    return (
      <>
        {!isLocalMode() && (
          <div className="session-bar">
            {error && <span role="alert">{error}</span>}
            <button type="button" className="tab-button" disabled={busy} onClick={handleLogout}>Cerrar sesión</button>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <main className="app-shell auth-shell">
      <section className="panel auth-panel">
        <p className="eyebrow">Liga de Amigos</p>
        <h1>PokerLiga</h1>
        <p>Introduce la contraseña para acceder a la liga.</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="app-password">Contraseña</label>
            <input id="app-password" type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </div>
          {error && <div className="status-panel error-banner" role="alert">{error}</div>}
          <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </section>
    </main>
  );
}

export default AuthGate;
