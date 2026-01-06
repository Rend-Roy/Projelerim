import { ChevronRight, MapPin, Tag, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VisitStatusBadge from "./VisitStatusBadge";

export default function CustomerCard({ customer, visit, date }) {
  const navigate = useNavigate();
  const priceStatus = customer.price_status || "Standart";
  const hasAlerts = customer.alerts && customer.alerts.length > 0;

  const handleClick = () => {
    navigate(`/customer/${customer.id}`, { state: { date, visit } });
  };

  return (
    <div
      onClick={handleClick}
      className="customer-card bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer relative overflow-hidden"
      data-testid={`customer-card-${customer.id}`}
    >
      {/* Status Indicator Bar */}
      <div
        className={`status-indicator absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
          visit?.completed ? "bg-green-500" : hasAlerts ? "bg-red-500" : "bg-slate-300"
        }`}
      />

      {/* Content */}
      <div className="flex-1 ml-2 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
            {customer.name}
          </h3>
          {priceStatus === "İskontolu" && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
              İSK
            </span>
          )}
          {/* FAZ 2: Uyarı ikonu */}
          {hasAlerts && (
            <span 
              className="flex-shrink-0 p-1 bg-red-100 text-red-600 rounded-full"
              title={customer.alerts.join(", ")}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-500 truncate">{customer.region}</span>
        </div>
        {/* FAZ 2: Uyarı metni (ilk uyarı) */}
        {hasAlerts && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-red-600 truncate">
              ⚠️ {customer.alerts[0]}{customer.alerts.length > 1 ? ` (+${customer.alerts.length - 1})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <VisitStatusBadge completed={visit?.completed} />

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
    </div>
  );
}
