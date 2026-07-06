import { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, className = '', id, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
      <input
        id={id}
        ref={ref}
        className={`w-full rounded-md border border-accent bg-background px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground ${className}`}
        {...props}
      />
    </div>
  )
);

export default FormInput;
