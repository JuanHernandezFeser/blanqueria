import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/shared/AuthForm';
import { toast } from 'sonner';

const Register = () => {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const location = useLocation();
  const initial = location.state as { name?: string; email?: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string } | undefined;

  const handleSubmit = async ({ name, email, password, phone, address, locality, province, postalCode }: { name?: string; email: string; password: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string }) => {
    try {
      await register(name!, email, password, { phone, address, locality, province, postalCode });
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch {
      toast.error('Error al crear la cuenta. El email podría ya estar registrado.');
    }
  };

  return <AuthForm mode="register" onSubmit={handleSubmit} initial={initial} />;
};

export default Register;
