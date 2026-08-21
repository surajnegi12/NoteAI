import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, googleLogin } = useAuth();
  const { theme, mode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
      backgroundImage: theme.bgGradient,
      padding: '32px 20px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background-color 0.2s ease'
    }}>
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <ThemeToggle />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginBottom: 28,
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: mode === 'dark'
              ? '0 0 24px -2px rgba(99, 102, 241, 0.7)'
              : '0 6px 18px rgba(99, 102, 241, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>

          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: theme.textPrimary
          }}>
            Note<span style={{ color: '#6366f1' }}>AI</span> 
          </h1>
        </div>

        <p style={{
          margin: 0,
          fontSize: 13,
          color: theme.textSecondary,
          letterSpacing: '0.01em'
        }}>
          Intelligent Knowledge Base & Workspace powered by Gemini 3.6 Flash
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: 1000,
        backgroundColor: theme.surface,
        borderRadius: 24,
        overflow: 'hidden',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: mode === 'dark' ? '0 30px 70px -10px rgba(0, 0, 0, 0.8)' : '0 10px 40px rgba(15, 23, 42, 0.08)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{
          flex: '1 1 420px',
          background: mode === 'dark'
            ? 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)'
            : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: `1px solid ${theme.cardBorder}`,
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '6px 14px',
              borderRadius: 30,
              fontSize: 12,
              fontWeight: 600,
              color: '#6366f1',
              marginBottom: 28
            }}>
              <Sparkles size={14} />
              <span>NoteAI v2.0 • Pro Release</span>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary, lineHeight: 1.28, margin: '0 0 14px 0', letterSpacing: '-0.03em' }}>
              Transform unstructured notes into actionable intelligence.
            </h2>
            <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Generate structured summaries, categorical tags, and discrete action checklists in milliseconds.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 14,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              border: `1px solid ${theme.cardBorder}`
            }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: 8, borderRadius: 10 }}>
                <Zap size={18} color="#6366f1" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>Instant Summaries</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: theme.textSecondary }}>Cuts through noise with strict response</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 14,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              border: `1px solid ${theme.cardBorder}`
            }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: 8, borderRadius: 10 }}>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>Auto Action Items</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: theme.textSecondary }}>Isolates deliverables and assigns ownership directly</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          flex: '1 1 360px',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: theme.surface,
          boxSizing: 'border-box'
        }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: theme.textPrimary, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {isLogin ? 'Sign in to workspace' : 'Create workspace account'}
            </h3>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>
              {isLogin ? 'Enter your details below to continue' : 'Get started with intelligent note capture today'}
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 18
            }}>
              {error}
            </div>
          )}

          {/* Google Sign In Button Wrapper */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Authentication Failed')}
              theme={mode === 'dark' ? 'filled_black' : 'outline'}
              shape="rectangular"
              size="large"
              width="320"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: theme.cardBorder }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase' }}>Or continue with email</span>
            <div style={{ flex: 1, height: 1, backgroundColor: theme.cardBorder }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={17} color={theme.textSecondary} style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    backgroundColor: theme.inputBg,
                    fontSize: 14,
                    color: theme.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = theme.inputFocusBorder; }}
                  onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.textSecondary, marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={17} color={theme.textSecondary} style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 42px',
                    borderRadius: 12,
                    border: `1px solid ${theme.inputBorder}`,
                    backgroundColor: theme.inputBg,
                    fontSize: 14,
                    color: theme.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = theme.inputFocusBorder; }}
                  onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: '12px 18px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.15s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4338ca'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#4f46e5'; }}
            >
              <span>{loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Free Account')}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: 22, textAlign: 'center', fontSize: 13, color: theme.textSecondary }}>
            {isLogin ? "Don't have an account yet?" : 'Already registered?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                marginLeft: 6
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}