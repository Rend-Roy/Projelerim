import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RegionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regionRes, customersRes] = await Promise.all([
        axios.get(`${API}/regions/${id}`),
        axios.get(`${API}/regions/${id}/customers`),
      ]);
      setRegion(regionRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
      navigate("/regions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 pt-6" data-testid="loading-state">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="p-4 pt-6 text-center">
        <p className="text-slate-500">Bölge bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6" data-testid="region-detail-page">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => navigate("/regions")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-3"
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Bölgeler</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {region.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">{customers.length} müşteri</span>
            </div>
          </div>
        </div>

        {region.description && (
          <p className="text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg">
            {region.description}
          </p>
        )}
      </div>

      {/* Customer List */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Bölgedeki Müşteriler
        </h2>

        {customers.length === 0 ? (
          <div
            className="bg-white rounded-xl p-8 border border-slate-100 text-center"
            data-testid="empty-state"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              Bu bölgede müşteri yok
            </h3>
            <p className="text-sm text-slate-500">
              Müşteri eklerken bu bölgeyi seçebilirsiniz
            </p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="customer-list">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => navigate(`/customer/${customer.id}/edit`)}
                className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center gap-3"
                data-testid={`customer-${customer.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  customer.price_status === "İskontolu" ? "bg-amber-100" : "bg-blue-100"
                }`}>
                  <span className={`font-semibold text-sm ${
                    customer.price_status === "İskontolu" ? "text-amber-600" : "text-blue-600"
                  }`}>
                    {customer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900 truncate">
                      {customer.name}
                    </h3>
                    {customer.price_status === "İskontolu" && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                        İSK
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {customer.visit_days?.join(", ") || "Gün belirlenmemiş"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
