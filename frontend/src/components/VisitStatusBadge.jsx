import { CheckCircle, Clock, XCircle } from "lucide-react";

// Status değerleri: pending, visited, not_visited
export default function VisitStatusBadge({ status, completed, visitSkipReason }) {
  // Geriye uyumluluk: status yoksa eski alanlardan hesapla
  let displayStatus = status;
  if (!displayStatus) {
    if (completed) {
      displayStatus = "visited";
    } else if (visitSkipReason) {
      displayStatus = "not_visited";
    } else {
      displayStatus = "pending";
    }
  }

  if (displayStatus === "visited") {
    return (
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700"
        data-testid="status-visited"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Ziyaret Edildi</span>
      </div>
    );
  }

  if (displayStatus === "not_visited") {
    return (
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700"
        data-testid="status-not-visited"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Ziyaret Edilmedi</span>
      </div>
    );
  }

  // pending
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
