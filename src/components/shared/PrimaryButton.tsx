import { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

const PrimaryButton = ({ children, loading, loadingText, className = '', disabled, ...props }: PrimaryButtonProps) => (
  <button
    disabled={disabled || loading}
    className={`w-full rounded-md bg-foreground py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 disabled:opacity-50 transition-opacity ${className}`}
    {...props}
  >
    {loading ? loadingText || 'Procesando...' : children}
  </button>
);

export default PrimaryButton;
