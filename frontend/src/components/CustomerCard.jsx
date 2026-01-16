import { ChevronRight, MapPin, AlertTriangle } from "lucide-react";
import VisitStatusBadge from "./VisitStatusBadge";

export default function CustomerCard({ customer, visit, onClick }) {
  const alerts = customer.alerts || [];
  const hasAlerts = alerts.length > 0;
  
  // Status hesapla
  const status = visit?.status || (visit?.completed ? "visited" : (visit?.visit_skip_reason ? "not_visited" : "pending"));
  
  // Status'a göre sol kenar rengi
  const borderColorClass = status === "visited" 
    ? "border-l-green-500" 
    : status === "not_visited" 
      ? "border-l-red-500" 
      : "border-l-slate-300";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 border-l-4 ${borderColorClass} shadow-sm active:bg-slate-50 cursor-pointer transition-colors`}
      data-testid={`customer-card-${customer.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 truncate">{customer.name}</h3>
            {hasAlerts && (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{customer.region}</span>
            {customer.price_status === "İskontolu" && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                İskontolu
              </span>
            )}
          </div>
          {/* Ziyaret edilmediyse sebep göster */}
          {status === "not_visited" && visit?.visit_skip_reason && (
            <p className="text-xs text-red-600 mt-1 truncate">
              Sebep: {visit.visit_skip_reason}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VisitStatusBadge 
            status={status}
            completed={visit?.completed} 
            visitSkipReason={visit?.visit_skip_reason}
          />
          <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
