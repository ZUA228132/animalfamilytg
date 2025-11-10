type Alert = {
  id: string;
  title: string;
  message: string;
};

export function AlertBar({ alerts }: { alerts: Alert[] }) {
  if (!alerts || alerts.length === 0) return null;

  const alert = alerts[0];

  return (
    <div className="bg-[#ffe8d2] px-4 py-2 text-xs text-slate-800">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ff7a59]">
          Важно
        </span>
        <div className="flex flex-col">
          <span className="font-medium">{alert.title}</span>
          <span className="text-[11px] text-slate-700">{alert.message}</span>
        </div>
      </div>
    </div>
  );
}
