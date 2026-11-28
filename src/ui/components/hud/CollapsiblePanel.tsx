import { useState, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border-2 border-navy-900 bg-white p-3 text-navy-900 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{title}</h2>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border-2 border-navy-900 bg-sun-400 px-3 py-1 text-sm font-bold hover:bg-sun-500"
        >
          {open ? 'Lipat' : 'Buka'}
        </button>
      </div>
      {open && <div className="pt-2">{children}</div>}
    </section>
  );
}
