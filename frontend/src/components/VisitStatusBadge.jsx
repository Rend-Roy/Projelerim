import { CheckCircle, Clock } from "lucide-react";

export default function VisitStatusBadge({ completed }) {
  if (completed) {
    return (
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700"
        data-testid="status-completed"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Ziyaret Edildi</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600"
      data-testid="status-pending"
    >
      <Clock className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Bekliyor</span>
    </div>
  );
}
