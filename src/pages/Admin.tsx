import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminAmbientes from './admin/AdminAmbientes';
import AdminOrders from './admin/AdminOrders';
import AdminHero from './admin/AdminHero';
import AdminPayment from './admin/AdminPayment';
import AdminSpecials from './admin/AdminSpecials';

type Tab = 'products' | 'orders' | 'categories' | 'ambientes' | 'payment' | 'hero' | 'specials';

const tabs: { key: Tab; label: string }[] = [
  { key: 'products', label: 'Productos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'ambientes', label: 'Ambientes' },
  { key: 'hero', label: 'Hero' },
  { key: 'specials', label: 'Especiales' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'payment', label: 'Medios de pago' },
];

const Admin = () => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('products');

  if (!user?.isAdmin) return <Navigate to="/login" />;

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-6">Panel de Administración</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar -mx-6 md:mx-0 px-6 md:px-0">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-body text-sm whitespace-nowrap shrink-0 px-4 py-2 rounded-md transition-colors ${tab === t.key ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'products' && <AdminProducts />}
      {tab === 'categories' && <AdminCategories />}
      {tab === 'ambientes' && <AdminAmbientes />}
      {tab === 'hero' && <AdminHero />}
      {tab === 'specials' && <AdminSpecials />}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'payment' && <AdminPayment />}
    </div>
  );
};

export default Admin;
