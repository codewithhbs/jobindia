import React from 'react';
import { Loader2, Inbox, X } from 'lucide-react';

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="animate-spin text-primary" size={28} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-light">
        <Inbox className="text-primary" size={28} />
      </div>
      <p className="font-bold text-ink">{title}</p>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

const BADGE_COLORS = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-rose-100 text-rose-600',
  warning: 'bg-amber-100 text-amber-700',
  gray: 'bg-gray-100 text-gray-600',
};
export function Badge({ children, color = 'primary' }) {
  return <span className={`badge ${BADGE_COLORS[color] || BADGE_COLORS.primary}`}>{children}</span>;
}

export function StatCard({ icon: Icon, label, value, color = '#4F6EF7' }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ backgroundColor: `${color}1A` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Table({ columns, rows, renderRow, empty }) {
  if (!rows?.length) return <EmptyState title={empty || 'No records'} />;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg">
            <tr>{columns.map((c) => <th key={c} className="th">{c}</th>)}</tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
