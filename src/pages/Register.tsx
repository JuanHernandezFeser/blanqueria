import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (register(name, email, password)) {
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } else {
      toast.error('Por favor completá todos los campos correctamente');
    }
  };

  return (
    <div className="container max-w-md py-16 md:py-24">
      <h1 className="font-display text-4xl text-foreground mb-2">Crear cuenta</h1>
      <p className="font-body text-sm text-muted-foreground mb-8">Registrate para realizar compras y seguir tus pedidos.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Nombre</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <button type="submit" className="w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
          Crear cuenta
        </button>
      </form>
      <p className="mt-6 text-center font-body text-sm text-muted-foreground">
        ¿Ya tenés cuenta? <Link to="/login" className="text-foreground underline">Ingresar</Link>
      </p>
    </div>
  );
};

export default Register;
