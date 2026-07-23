import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthForm from '@/components/shared/AuthForm';
import { toast } from 'sonner';

const CompleteProfile = () => {
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const navigate = useNavigate();

  const handleSubmit = async ({ name, phone, address, locality, province, postalCode }: { name: string; phone?: string; address?: string; locality?: string; province?: string; postalCode?: string }) => {
    try {
      await updateProfile({ name, phone, address, locality, province, postalCode });
      toast.success('Perfil completado');
      navigate('/');
    } catch {
      toast.error('Error al guardar los datos');
    }
  };

  return <AuthForm mode="complete-profile" onSubmit={handleSubmit} />;
};

export default CompleteProfile;
