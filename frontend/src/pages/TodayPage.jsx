import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import axios from "axios";
import { CalendarDays, RefreshCw } from "lucide-react";
import CustomerCard from "@/components/CustomerCard";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Turkish day names mapping
const dayNameMap = {
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
  Saturday: "Cumartesi",
  Sunday: "Pazar",
};

export default function TodayPage() {
  const [customers, setCustomers] = useState([]);
  const [visits, setVisits] = useState({});
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const englishDayName = format(today, "EEEE");
  const turkishDayName = dayNameMap[englishDayName];
  const formattedDate = format(today, "dd MMMM yyyy", { locale: tr });
  const todayDateStr = format(today, "yyyy-MM-dd");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Seed data if needed
      await axios.post(`${API}/seed`);

      // Get customers for today
      const customersRes = await axios.get(`${API}/customers/today/${turkishDayName}`);
      setCustomers(customersRes.data);

      // Get visits for today
      const visitsRes = await axios.get(`${API}/visits?date=${todayDateStr}`);
      const visitsMap = {};
      visitsRes.data.forEach((v) => {
        visitsMap[v.customer_id] = v;
      });
      setVisits(visitsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completedCount = Object.values(visits).filter((v) => v.completed).length;
  const totalCount = customers.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-4 pt-6" data-testid="today-page">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {turkishDayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-slate-500">{formattedDate}</span>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Progress Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Günlük İlerleme</span>
          <span className="text-sm font-semibold text-blue-600">
            {completedCount}/{totalCount} Ziyaret
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
      </div>

      {/* Customer List */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Bugünkü Ziyaretler
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div
            className="bg-white rounded-xl p-8 border border-slate-100 text-center"
            data-testid="empty-state"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              Bugün için ziyaret yok
            </h3>
            <p className="text-sm text-slate-500">
              {turkishDayName} günü için planlanmış müşteri bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="customer-list">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                visit={visits[customer.id]}
                date={todayDateStr}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
