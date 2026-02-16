// Custom 404 page that doesn't use React hooks
// This avoids the useContext issue with React version mismatch in monorepos

export default function Custom404() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0
        }}>
          404
        </h1>
        <p style={{
          marginTop: '1rem',
          fontSize: '1.25rem',
          color: '#6b7280'
        }}>
          Page not found
        </p>
        <p style={{
          marginTop: '0.5rem',
          fontSize: '1rem',
          color: '#9ca3af'
        }}>
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: '500',
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
