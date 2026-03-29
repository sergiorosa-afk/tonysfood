'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function TonysBrandIcon() {
  return (
    <svg
      viewBox="0 0 120 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-24 flex-shrink-0"
      style={{ height: 72 }}
      aria-hidden="true"
    >
      <path
        d="M38 72V55.5C30.8 55.5 25 49.7 25 42.5C25 34.72 31.03 28.36 38.67 27.84C41.92 19.38 50.13 13.38 59.75 13.38C69.86 13.38 78.41 20 81.27 29.12C89.66 29.54 96.33 36.47 96.33 44.97C96.33 53.73 89.23 60.83 80.47 60.83H78.5V72"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M55.8 39.5L54.6 59.2" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M61.6 39.5V59.2" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M67.4 39.5L68.6 59.2" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M52.9 71.6H70.3" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('E-mail ou senha inválidos. Por favor, tente novamente.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden"
      style={{ background: '#10162f' }}
    >
      {/* Atmospheric background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 6% 22%, rgba(255, 209, 148, 0.72), transparent 10%),
            radial-gradient(circle at 92% 18%, rgba(255, 215, 145, 0.78), transparent 10%),
            radial-gradient(circle at 15% 76%, rgba(255, 186, 117, 0.35), transparent 12%),
            linear-gradient(180deg, rgba(14, 20, 45, 0.20) 0%, rgba(14, 20, 45, 0.08) 22%, rgba(14, 20, 45, 0.38) 100%),
            linear-gradient(90deg, rgba(44, 23, 18, 0.42) 0%, rgba(62, 32, 24, 0.32) 30%, rgba(64, 33, 27, 0.24) 70%, rgba(38, 22, 19, 0.44) 100%),
            linear-gradient(180deg, #3c2b30 0%, #48363c 38%, #2b2432 100%)
          `,
          filter: 'saturate(1.05)',
        }}
        aria-hidden="true"
      />

      {/* Restaurant silhouette decoration */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.42 }}
        aria-hidden="true"
      >
        <span
          className="absolute block rounded-xl"
          style={{ left: '5%', bottom: '18%', width: 160, height: 90, background: 'rgba(39, 25, 23, 0.55)', filter: 'blur(1px)', boxShadow: '0 10px 30px rgba(0,0,0,.10)' }}
        />
        <span
          className="absolute block rounded-xl"
          style={{ right: '6%', bottom: '12%', width: 150, height: 120, background: 'rgba(39, 25, 23, 0.55)', filter: 'blur(1px)', boxShadow: '0 10px 30px rgba(0,0,0,.10)' }}
        />
        <span
          className="absolute block rounded-xl"
          style={{ right: '2%', bottom: '33%', width: 120, height: 72, background: 'rgba(39, 25, 23, 0.55)', filter: 'blur(1px)', boxShadow: '0 10px 30px rgba(0,0,0,.10)' }}
        />
        <span
          className="absolute block rounded-xl"
          style={{ left: '10%', bottom: '52%', width: 94, height: 58, background: 'rgba(39, 25, 23, 0.55)', filter: 'blur(1px)', boxShadow: '0 10px 30px rgba(0,0,0,.10)' }}
        />
      </div>

      {/* Login Card */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 786,
          background: 'rgba(244, 246, 251, 0.96)',
          border: '1px solid rgba(255,255,255,0.38)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.26)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand Header */}
        <div
          className="flex items-center justify-center px-7"
          style={{
            background: 'linear-gradient(180deg, #1f2b63 0%, #1d285f 100%)',
            minHeight: 155,
            padding: '32px 28px',
          }}
        >
          <div className="flex items-center gap-5 text-white">
            <TonysBrandIcon />
            <span
              className="font-extrabold"
              style={{ fontSize: 'clamp(2rem, 3vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
            >
              Tony&apos;s Food
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: '48px 54px 56px' }}>
          {/* Hero text */}
          <div className="text-center" style={{ marginBottom: 34 }}>
            <h1
              className="font-extrabold"
              style={{
                margin: 0,
                fontSize: 'clamp(2rem, 3vw, 3.6rem)',
                lineHeight: 1.15,
                letterSpacing: '-0.04em',
                color: '#243160',
              }}
            >
              Bem-vindo ao Tony&apos;s Food
            </h1>
            <p
              className="font-medium"
              style={{ margin: '16px 0 0', fontSize: 'clamp(1.15rem, 1.6vw, 1.55rem)', color: '#7e89a8' }}
            >
              Faça login para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            {/* E-mail field card */}
            <div
              className="overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.94)',
                border: '1px solid #d7deea',
                borderRadius: 10,
                boxShadow: '0 6px 18px rgba(33, 45, 94, 0.06)',
              }}
            >
              <div
                className="flex items-center gap-4"
                style={{ minHeight: 76, padding: '0 22px', borderBottom: '1px solid #d9dfeb' }}
              >
                <svg
                  className="flex-shrink-0"
                  style={{ width: 34, height: 34, color: '#7f8baa' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 6.5C4 5.67 4.67 5 5.5 5H18.5C19.33 5 20 5.67 20 6.5V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V6.5Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 7L11 12C11.59 12.49 12.41 12.49 13 12L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <label
                  htmlFor="email"
                  className="font-semibold"
                  style={{ fontSize: '1rem', color: '#26335f' }}
                >
                  E-mail ou Usuário
                </label>
              </div>
              <div className="flex items-center" style={{ minHeight: 76, padding: '0 22px' }}>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  disabled={loading}
                  className="w-full border-0 bg-transparent outline-none disabled:opacity-50"
                  style={{ font: 'inherit', fontSize: '1rem', color: '#7b86a3' }}
                />
              </div>
            </div>

            {/* Senha field card */}
            <div
              className="overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.94)',
                border: '1px solid #d7deea',
                borderRadius: 10,
                boxShadow: '0 6px 18px rgba(33, 45, 94, 0.06)',
              }}
            >
              <div
                className="flex items-center gap-4"
                style={{ minHeight: 76, padding: '0 22px', borderBottom: '1px solid #d9dfeb' }}
              >
                <svg
                  className="flex-shrink-0"
                  style={{ width: 34, height: 34, color: '#7f8baa' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M8 10V7.5C8 5.01 10.01 3 12.5 3C14.99 3 17 5.01 17 7.5V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M6 10H19C19.55 10 20 10.45 20 11V19C20 19.55 19.55 20 19 20H6C5.45 20 5 19.55 5 19V11C5 10.45 5.45 10 6 10Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12.5 13.5V16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <label
                  htmlFor="password"
                  className="font-semibold"
                  style={{ fontSize: '1rem', color: '#26335f' }}
                >
                  Senha
                </label>
              </div>
              <div className="flex items-center gap-3" style={{ minHeight: 76, padding: '0 22px' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="flex-1 border-0 bg-transparent outline-none disabled:opacity-50"
                  style={{ font: 'inherit', fontSize: '1rem', color: '#7b86a3' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-semibold transition-colors"
                  style={{ fontSize: '0.95rem', color: '#2d73ea', whiteSpace: 'nowrap' }}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(207, 87, 87, 0.10)', border: '1px solid rgba(207, 87, 87, 0.20)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: '#cf5757' }}
                />
                <p className="text-sm" style={{ color: '#cf5757' }}>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-extrabold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                marginTop: 8,
                minHeight: 76,
                border: 0,
                borderRadius: 8,
                background: loading ? '#2c71e5' : 'linear-gradient(180deg, #2f76ea 0%, #2c71e5 100%)',
                color: 'white',
                fontSize: 'clamp(1.55rem, 2vw, 2.15rem)',
                letterSpacing: '-0.03em',
                boxShadow: '0 16px 24px rgba(45, 115, 234, 0.20)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Dev hint */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #d8deea' }}>
            <p className="text-center font-mono" style={{ fontSize: '0.82rem', color: '#a0abcc' }}>
              admin@tonysfood.local &nbsp;·&nbsp; Senha: 123456
            </p>
          </div>
        </div>
      </div>

      <p
        className="relative mt-6 text-center text-xs"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        &copy; {new Date().getFullYear()} Tony&apos;s Food. Todos os direitos reservados.
      </p>
    </div>
  )
}
