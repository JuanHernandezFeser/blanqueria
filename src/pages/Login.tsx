import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/shared/AuthForm';
import { toast } from 'sonner';

const Login = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate('/');
    } catch {
      toast.error('Credenciales inválidas');
    }
  };

  return <AuthForm mode="login" onSubmit={handleSubmit} />;
};

export default Login;
