import { useState } from 'react';
import { useBankConfigStore } from '@/stores/bankConfigStore';
import type { BankConfig } from '@/stores/bankConfigStore';
import { useSiteSettingsStore } from '@/stores/siteSettingsStore';
import { toast } from 'sonner';
import PrimaryButton from '@/components/shared/PrimaryButton';

const AdminPayment = () => {
  const bankConfig = useBankConfigStore((s) => s.config);
  const updateConfig = useBankConfigStore((s) => s.updateConfig);
  const [bankForm, setBankForm] = useState<BankConfig>(bankConfig);

  const maxPriceFilter = useSiteSettingsStore((s) => s.getMaxPriceFilter());
  const updateSetting = useSiteSettingsStore((s) => s.updateSetting);
  const [maxPriceValue, setMaxPriceValue] = useState<string>(String(maxPriceFilter));
  const [savingPrice, setSavingPrice] = useState(false);

  const handleSaveMaxPrice = async () => {
    const num = parseInt(maxPriceValue, 10);
    if (!num || num <= 0) {
      toast.error('Ingresá un valor válido');
      return;
    }
    setSavingPrice(true);
    try {
      await updateSetting('max_price_filter', String(num));
      toast.success('Precio máximo del filtro actualizado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div className="max-w-md space-y-10">
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-foreground">Filtro del catálogo</h2>
        <div>
          <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Precio máximo del filtro (ARS)</label>
          <input
            type="number"
            min={1000}
            step={1000}
            value={maxPriceValue}
            onChange={(e) => setMaxPriceValue(e.target.value)}
            className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <p className="font-body text-xs text-muted-foreground mt-1.5">
            Valor máximo que se muestra en el slider de precios del catálogo. Los productos con precio superior no se verán afectados por el filtro.
          </p>
        </div>
        <PrimaryButton onClick={handleSaveMaxPrice} disabled={savingPrice}>
          {savingPrice ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
      </div>

      <hr className="border-accent" />

      <div className="space-y-6">
        <h2 className="font-display text-2xl text-foreground">Medios de pago</h2>

        <div className="space-y-4">
          <h3 className="font-body text-sm font-medium text-foreground">Descuento por transferencia / efectivo</h3>
          <div>
            <label className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Porcentaje de descuento (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={bankForm.discountPercentage}
              onChange={(e) => setBankForm({ ...bankForm, discountPercentage: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <p className="font-body text-xs text-muted-foreground mt-1.5">
              Este descuento se aplica a todos los productos para pagos con transferencia bancaria o efectivo. Débito y crédito mantienen el precio original.
            </p>
          </div>
        </div>

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
    </div>
  );
};

export default AdminPayment;
