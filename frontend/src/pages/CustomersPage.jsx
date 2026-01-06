import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Users, MapPin, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Müşteriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by region
  const groupedCustomers = filteredCustomers.reduce((acc, customer) => {
    if (!acc[customer.region]) {
      acc[customer.region] = [];
    }
    acc[customer.region].push(customer);
    return acc;
  }, {});

  const regions = Object.keys(groupedCustomers).sort();

  return (
    <div className="p-4 pt-6" data-testid="customers-page">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Müşteriler
        </h1>
        <p className="text-slate-500 mt-1">
          Toplam {customers.length} müşteri
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Müşteri veya bölge ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
          data-testid="search-input"
        />
      </div>

      {/* Customer List by Region */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div
          className="bg-white rounded-xl p-8 border border-slate-100 text-center"
          data-testid="empty-state"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">
            {searchQuery ? "Sonuç bulunamadı" : "Henüz müşteri yok"}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {searchQuery
              ? "Farklı bir arama terimi deneyin"
              : "Yeni müşteri ekleyerek başlayın"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/customer/new")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              data-testid="add-first-customer"
            >
              <Plus className="w-4 h-4" />
              Müşteri Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6" data-testid="customer-list">
          {regions.map((region) => (
            <div key={region}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  {region}
                </h2>
                <span className="text-xs text-slate-400">
                  ({groupedCustomers[region].length})
                </span>
              </div>
              <div className="space-y-2">
                {groupedCustomers[region].map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => navigate(`/customer/${customer.id}/edit`)}
                    className="customer-card bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer"
                    data-testid={`customer-item-${customer.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {customer.visit_days?.join(", ") || "Gün belirlenmemiş"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
