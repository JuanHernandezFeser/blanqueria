interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => (
  <div className="py-20 text-center">
    <p className="font-body text-muted-foreground mb-4">{message}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="rounded-md bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-wider text-background font-body hover:opacity-90 transition-opacity">
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
