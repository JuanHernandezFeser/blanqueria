import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/shared/AuthForm';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    try {
      await useAuthStore.getState().register(email, password);
      toast.success('¡Cuenta creada!');
      const user = useAuthStore.getState().user;
      if (user && !user.address) {
        navigate('/completar-perfil');
      } else {
        navigate('/');
      }
    } catch {
      toast.error('Error al crear la cuenta. El email podría ya estar registrado.');
    }
  };

  return <AuthForm mode="register" onSubmit={handleSubmit} />;
};

export default Register;
