'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: '#fee2e2',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Erro crítico
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              O sistema encontrou um erro inesperado. Por favor, recarregue a página.
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
                ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
