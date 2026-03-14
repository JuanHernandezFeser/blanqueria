import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success('¡Bienvenido!');
      navigate('/');
    } else {
      toast.error('Credenciales inválidas');
    }
  };

  return (
    <div className="container max-w-md py-16 md:py-24">
      <h1 className="font-display text-4xl text-foreground mb-2">Ingresar</h1>
      <p className="font-body text-sm text-muted-foreground mb-8">Accedé a tu cuenta para gestionar tus pedidos.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <button type="submit" className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          Ingresar
        </button>
      </form>
      <p className="mt-6 text-center font-body text-sm text-muted-foreground">
        ¿No tenés cuenta? <Link to="/registro" className="text-foreground underline">Crear cuenta</Link>
      </p>
      <div className="mt-8 p-4 rounded-lg bg-secondary/50">
        <p className="font-body text-xs text-muted-foreground">
          <strong>Demo:</strong> user@tienda.com / user123 · admin@tienda.com / admin123
        </p>
      </div>
    </div>
  );
};

export default Login;
