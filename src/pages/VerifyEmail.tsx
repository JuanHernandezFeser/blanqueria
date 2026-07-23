import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token no proporcionado');
      return;
    }
    api.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Token inválido o expirado');
      });
  }, [token]);

  return (
    <div className="container max-w-md py-16 md:py-24 text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-3">Verificando...</h1>
          <p className="font-body text-sm text-muted-foreground">Estamos verificando tu email.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-3">Email verificado</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">{message}</p>
          <Link
            to="/login"
            className="block w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity text-center"
          >
            Iniciar sesión
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-3">Error</h1>
          <p className="font-body text-sm text-muted-foreground mb-8">{message}</p>
          <Link
            to="/"
            className="block w-full rounded-md bg-foreground py-3.5 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity text-center"
          >
            Volver al inicio
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
