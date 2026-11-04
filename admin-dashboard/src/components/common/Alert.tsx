import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'error',
  title,
  message,
  className = '',
  onClose,
}) => {
  const styles = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
    },
  };

  const { bg, icon } = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${bg} text-sm ${className}`}
      role="alert"
    >
      {icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <p className="mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs font-semibold underline opacity-75 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

