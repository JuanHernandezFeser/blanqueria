import { useState } from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';
import { provinces } from '@/lib/helpers';

interface AuthFormProps {
  mode: 'login' | 'register' | 'complete-profile';
  onSubmit: (data: any) => Promise<void>;
  initial?: { name?: string; email?: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string };
}

const AuthForm = ({ mode, onSubmit, initial }: AuthFormProps) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [locality, setLocality] = useState(initial?.locality || '');
  const [province, setProvince] = useState(initial?.province || '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await onSubmit({ email, password });
      } else if (mode === 'register') {
        await onSubmit({ email, password });
      } else {
        await onSubmit({ name, phone, address, locality, province, postalCode });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === 'login';
  const isCompleteProfile = mode === 'complete-profile';

  return (
    <div className="container max-w-md py-16 md:py-24">
      <h1 className="font-display text-4xl text-foreground mb-2">
        {isLogin ? 'Ingresar' : isCompleteProfile ? 'Completá tu perfil' : 'Crear cuenta'}
      </h1>
      <p className="font-body text-sm text-muted-foreground mb-8">
        {isLogin ? 'Accedé a tu cuenta para gestionar tus pedidos.' : isCompleteProfile ? 'Completá tus datos para poder realizar compras.' : 'Registrate para realizar compras y seguir tus pedidos.'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isCompleteProfile && (
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
          </div>
        )}
        {!isCompleteProfile && (
          <>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
          </>
        )}
        {isCompleteProfile && (
          <>
            <div>
              <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Dirección</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Localidad</label>
                <input type="text" value={locality} onChange={(e) => setLocality(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Provincia</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground">
                  <option value="">Seleccionar</option>
                  {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Código postal</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
            </div>
          </>
        )}
        <PrimaryButton type="submit" loading={submitting} loadingText={isLogin ? 'Ingresando...' : isCompleteProfile ? 'Guardando...' : 'Creando cuenta...'}>
          {isLogin ? 'Ingresar' : isCompleteProfile ? 'Guardar datos' : 'Crear cuenta'}
        </PrimaryButton>
      </form>
      {!isCompleteProfile && (
        <p className="mt-6 text-center font-body text-sm text-muted-foreground">
          {isLogin ? (
            <>¿No tenés cuenta? <Link to="/registro" className="text-foreground underline">Crear cuenta</Link></>
          ) : (
            <>¿Ya tenés cuenta? <Link to="/login" className="text-foreground underline">Ingresar</Link></>
          )}
        </p>
      )}

    </div>
  );
};

export default AuthForm;
