import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Map Firebase error codes to friendly messages
  function getFriendlyError(code) {
    const map = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(getFriendlyError(err.code));
    }
    setLoading(false);
  }

  function toggleMode() {
    setIsSignUp((prev) => !prev);
    setError('');
    setConfirmPassword('');
  }

  // ── Inline styles (self-contained, zero CSS file changes) ──
  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#121212',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    // Ambient glow orbs
    orbOne: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
      top: '-200px',
      left: '-150px',
      filter: 'blur(80px)',
      pointerEvents: 'none',
    },
    orbTwo: {
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
      bottom: '-180px',
      right: '-120px',
      filter: 'blur(80px)',
      pointerEvents: 'none',
    },
    card: {
      position: 'relative',
      zIndex: 1,
      width: '100%',
      maxWidth: '420px',
      padding: '2.5rem 2rem',
      margin: '1rem',
      background: 'rgba(28, 28, 28, 0.6)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 80px rgba(16, 185, 129, 0.06)',
      animation: 'loginFadeIn 0.6s ease',
    },
    logoArea: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    logoIcon: {
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: 'rgba(16, 185, 129, 0.08)',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
      boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
    },
    title: {
      fontSize: '1.6rem',
      fontWeight: 800,
      color: '#f4f4f5',
      margin: '0 0 0.25rem 0',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '0.85rem',
      color: '#71717a',
      margin: 0,
      fontWeight: 400,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#a1a1aa',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '0.35rem',
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      background: '#1c1c1c',
      border: '1px solid #2a2a2a',
      borderRadius: '10px',
      fontSize: '0.9rem',
      color: '#f4f4f5',
      fontFamily: "'Inter', system-ui, sans-serif",
      outline: 'none',
      transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '0.8rem 1.5rem',
      background: 'linear-gradient(135deg, #10b981, #34d399)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '0.9rem',
      fontWeight: 700,
      fontFamily: "'Inter', system-ui, sans-serif",
      cursor: 'pointer',
      transition: 'transform 0.15s ease, box-shadow 0.25s ease, filter 0.25s ease',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
      letterSpacing: '0.3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '0.5rem',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    error: {
      color: '#ef4444',
      fontSize: '0.82rem',
      textAlign: 'center',
      padding: '0.6rem 0.8rem',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '8px',
      margin: 0,
    },
    toggle: {
      textAlign: 'center',
      marginTop: '1.5rem',
      fontSize: '0.82rem',
      color: '#71717a',
    },
    toggleLink: {
      color: '#10b981',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: '0.82rem',
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      transition: 'color 0.2s ease',
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'loginSpin 0.6s linear infinite',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      margin: '0.5rem 0',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: 'rgba(255,255,255,0.06)',
    },
    dividerText: {
      fontSize: '0.7rem',
      color: '#52525b',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      fontWeight: 500,
    },
  };

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }
        .login-input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15), 0 0 20px rgba(16, 185, 129, 0.08) !important;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(16, 185, 129, 0.4);
          filter: brightness(1.1);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }
        .login-toggle-link:hover {
          color: #34d399 !important;
        }
      `}</style>

      <div style={styles.wrapper}>
        {/* Ambient glow orbs */}
        <div style={styles.orbOne} />
        <div style={styles.orbTwo} />

        {/* Glass card */}
        <div style={styles.card}>
          {/* Logo / Branding */}
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path d="M 22 14 L 14 14 L 14 22" stroke="url(#accentGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                <path d="M 78 14 L 86 14 L 86 22" stroke="url(#accentGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                <path d="M 22 86 L 14 86 L 14 78" stroke="url(#accentGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                <path d="M 78 86 L 86 86 L 86 78" stroke="url(#accentGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
                <circle cx="50" cy="50" r="38" stroke="url(#accentGrad)" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="4 8"/>
                <circle cx="50" cy="50" r="33" stroke="url(#accentGrad)" strokeWidth="2" fill="none" />
                <polygon points="50,28 68,35 50,42 32,35" fill="url(#accentGrad)" />
                <path d="M 68 35 L 72 41 L 72 47" stroke="url(#accentGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="72" cy="49" r="1.5" fill="url(#accentGrad)" />
                <path d="M 50 45 C 45 42, 38 42, 34 44 L 34 56 C 38 54, 45 54, 50 57 C 55 54, 62 54, 66 56 L 66 44 C 62 42, 55 42, 50 45 Z" fill="url(#glowGrad)" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 39 49 C 42 48, 45 48, 47 49" stroke="url(#accentGrad)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
                <path d="M 61 49 C 58 48, 55 48, 53 49" stroke="url(#accentGrad)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
              </svg>
            </div>
            <h1 style={styles.title}>Lecture Lens</h1>
            <p style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          <form style={styles.form} onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label style={styles.label}>Email</label>
              <input
                className="login-input"
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={styles.label}>Password</label>
              <input
                className="login-input"
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </div>

            {/* Confirm Password (sign-up only) */}
            {isSignUp && (
              <div>
                <label style={styles.label}>Confirm Password</label>
                <input
                  className="login-input"
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Error message */}
            {error && <p style={styles.error}>{error}</p>}

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>
                {isSignUp ? 'Join Lecture Lens' : 'Continue'}
              </span>
              <div style={styles.dividerLine} />
            </div>

            {/* Submit */}
            <button
              className="login-btn"
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinner} />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle between Sign In / Create Account */}
          <div style={styles.toggle}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              className="login-toggle-link"
              style={styles.toggleLink}
              onClick={toggleMode}
              type="button"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
