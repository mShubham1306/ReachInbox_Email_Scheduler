import { clsx } from 'clsx';
import type { EmailStatus } from '../types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | EmailStatus;

const variantStyles: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  // Email statuses
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SENT: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  RATE_LIMITED: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Queued',
  PROCESSING: 'Sending now',
  SENT: 'Delivered',
  FAILED: 'Failed to send',
  RATE_LIMITED: 'Paused (limit reached)',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const style = variantStyles[variant] || variantStyles.default;
  const label = children ?? statusLabels[variant as string] ?? variant;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: EmailStatus }) {
  return <Badge variant={status} />;
}

