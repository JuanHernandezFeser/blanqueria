import { useState } from 'react';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import type { BankConfig } from '@/stores/bankConfigStore';
import { toast } from 'sonner';
import PrimaryButton from '@/components/shared/PrimaryButton';

const AdminPayment = () => {
  const bankConfig = useBankConfigStore((s) => s.config);
  const updateConfig = useBankConfigStore((s) => s.updateConfig);
  const [bankForm, setBankForm] = useState<BankConfig>(bankConfig);

  return (
    <div className="max-w-md space-y-6">
      <h2 className="font-display text-2xl text-foreground">Medios de pago</h2>
      <div className="space-y-4">
        <h3 className="font-body text-sm font-medium text-foreground">Transferencia bancaria</h3>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Banco</label>
          <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">CBU</label>
          <input value={bankForm.cbu} onChange={(e) => setBankForm({ ...bankForm, cbu: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Alias</label>
          <input value={bankForm.alias} onChange={(e) => setBankForm({ ...bankForm, alias: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Titular de la cuenta</label>
          <input value={bankForm.accountHolder} onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })} className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>
        <PrimaryButton onClick={async () => { try { await updateConfig(bankForm); toast.success('Datos bancarios actualizados'); } catch { toast.error('Error al guardar'); } }}>
          Guardar
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AdminPayment;
