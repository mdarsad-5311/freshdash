import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantClasses: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
    },
    danger: {
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200',
      text: 'text-sky-700',
      dot: 'bg-sky-500',
    },
    neutral: {
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
    },
    brand: {
      bg: 'bg-brand-50 border-brand-200',
      text: 'text-brand-800',
      dot: 'bg-brand-600',
    },
    purple: {
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      dot: 'bg-purple-500',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const { bg, text, dot: dotBg } = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${bg} ${text} ${sizeClasses[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />}
      {children}
    </span>
  );
};

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'delivered':
      return <Badge variant="success" dot>Delivered</Badge>;
    case 'out_for_delivery':
      return <Badge variant="brand" dot>Out for Delivery</Badge>;
    case 'shipped':
      return <Badge variant="info" dot>Shipped</Badge>;
    case 'processing':
    case 'confirmed':
      return <Badge variant="purple" dot>{status.toUpperCase()}</Badge>;
    case 'placed':
    case 'pending':
      return <Badge variant="warning" dot>Placed</Badge>;
    case 'cancelled':
      return <Badge variant="danger" dot>Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Paid</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'refunded':
      return <Badge variant="purple">Refunded</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function getStockBadge(isAvailable: boolean, stock: number) {
  if (stock === 0 || !isAvailable) {
    return <Badge variant="danger" dot>Out of Stock (0)</Badge>;
  }
  if (stock <= 10) {
    return <Badge variant="warning" dot>Low Stock ({stock})</Badge>;
  }
  return <Badge variant="success" dot>In Stock ({stock})</Badge>;
}

