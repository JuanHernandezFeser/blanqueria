import { Wallet, Landmark, Banknote } from 'lucide-react';

const payments = [
  { icon: Wallet, label: 'Mercado Pago' },
  { icon: Landmark, label: 'Transferencia bancaria' },
  { icon: Banknote, label: 'Efectivo' },
];

const PaymentMethodsBar = () => (
  <section className="bg-secondary py-3">
    <div className="container">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {payments.map((p) => (
          <div key={p.label} className="flex items-center gap-2 text-muted-foreground">
            <p.icon className="h-4 w-4" />
            <span className="font-body text-sm">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PaymentMethodsBar;
