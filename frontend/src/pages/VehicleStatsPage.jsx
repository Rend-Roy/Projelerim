import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Car, Fuel, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VehicleStatsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [id]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/vehicle-stats/${id}`);
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("İstatistikler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">İstatistikler bulunamadı</p>
      </div>
    );
  }

  const { vehicle } = stats;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{vehicle.name}</h1>
          <p className="text-sm text-slate-500">{vehicle.plate || "Plaka yok"} • {vehicle.fuel_type}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Toplam Yakıt Gideri */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.total_fuel_cost?.toLocaleString()} ₺
          </div>
          <div className="text-xs text-slate-500">Toplam Yakıt Gideri</div>
        </div>

        {/* Bu Ay */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.monthly_fuel_cost?.toLocaleString()} ₺
          </div>
          <div className="text-xs text-slate-500">Bu Ay Gideri</div>
        </div>

        {/* Toplam Yakıt */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Fuel className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.total_liters?.toLocaleString()} L
          </div>
          <div className="text-xs text-slate-500">Toplam Yakıt</div>
        </div>

        {/* Kayıt Sayısı */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.fuel_record_count}
          </div>
          <div className="text-xs text-slate-500">Yakıt Kaydı</div>
        </div>
      </div>

      {/* Ortalamalar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <h2 className="font-semibold text-slate-900 mb-4">Son 30 Gün Ortalamaları</h2>
        
        <div className="space-y-4">
          {/* KM Başı Maliyet */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">KM Başı Maliyet</span>
            <span className="font-bold text-slate-900">
              {stats.avg_cost_per_km ? `${stats.avg_cost_per_km.toFixed(2)} ₺/km` : "-"}
            </span>
          </div>

          {/* 100 km Tüketim */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">100 km Tüketim</span>
            <span className="font-bold text-slate-900">
              {stats.avg_consumption_per_100km ? `${stats.avg_consumption_per_100km.toFixed(1)} L` : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-slate-400 text-center mt-4">
        Ortalamalar son 30 günlük yakıt kayıtlarından hesaplanmaktadır.
      </p>
    </div>
  );
}
