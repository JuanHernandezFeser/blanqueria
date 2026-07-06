import { statusColor } from '@/lib/helpers';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium ${statusColor(status)}`}>
    {status}
  </span>
);

export default StatusBadge;
