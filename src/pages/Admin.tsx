import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminOrders from './admin/AdminOrders';
import AdminHero from './admin/AdminHero';
import AdminPayment from './admin/AdminPayment';

type Tab = 'products' | 'orders' | 'categories' | 'payment' | 'hero';

const tabs: { key: Tab; label: string }[] = [
  { key: 'products', label: 'Productos' },
  { key: 'categories', label: 'Categorías' },
  { key: 'hero', label: 'Hero' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'payment', label: 'Medios de pago' },
];

const Admin = () => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('products');

  if (!user?.isAdmin) return <Navigate to="/login" />;

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-4xl text-foreground mb-6">Panel de Administración</h1>
      <div className="flex gap-4 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-body text-sm px-4 py-2 rounded-md transition-colors ${tab === t.key ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'products' && <AdminProducts />}
      {tab === 'categories' && <AdminCategories />}
      {tab === 'hero' && <AdminHero />}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'payment' && <AdminPayment />}
    </div>
  );
};

export default Admin;
