import { ChevronRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VisitStatusBadge from "./VisitStatusBadge";

export default function CustomerCard({ customer, visit, date }) {
  const navigate = useNavigate();

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
          visit?.completed ? "bg-green-500" : "bg-slate-300"
        }`}
      />

      {/* Content */}
      <div className="flex-1 ml-2">
        <h3 className="font-semibold text-slate-900 text-base leading-tight">
          {customer.name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-500">{customer.region}</span>
        </div>
      </div>

      {/* Status Badge */}
      <VisitStatusBadge completed={visit?.completed} />

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </div>
  );
}
