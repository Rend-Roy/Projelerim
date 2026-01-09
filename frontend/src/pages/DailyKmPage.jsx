import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Car, Calendar, TrendingUp, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DailyKmPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [todayRecord, setTodayRecord] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    date: today,
    start_km: "",
    end_km: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/daily-km?limit=30`),
        axios.get(`${API}/vehicles`)
      ]);
      
      setRecords(recordsRes.data);
      setVehicles(vehiclesRes.data);
      
      // Aktif aracı bul
      const active = vehiclesRes.data.find(v => v.is_active);
      setActiveVehicle(active);
      
      if (active) {
        setFormData(prev => ({ ...prev, vehicle_id: active.id }));
        
        // Bugünkü kaydı bul
        const todayRec = recordsRes.data.find(r => r.date === today && r.vehicle_id === active.id);
        if (todayRec) {
          setTodayRecord(todayRec);
          setFormData({
            vehicle_id: active.id,
            date: today,
            start_km: String(todayRec.start_km || ""),
            end_km: String(todayRec.end_km || "")
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.vehicle_id || !formData.start_km) {
      toast.error("Araç ve başlangıç km zorunlu");
      return;
    }

    setSaving(true);
    try {
      const data = {
        vehicle_id: formData.vehicle_id,
        date: formData.date,
        start_km: parseFloat(formData.start_km),
        end_km: formData.end_km ? parseFloat(formData.end_km) : null
      };

      if (todayRecord) {
        await axios.put(`${API}/daily-km/${todayRecord.id}`, {
          start_km: data.start_km,
          end_km: data.end_km
        });
      } else {
        await axios.post(`${API}/daily-km`, data);
      }

      toast.success("KM kaydı güncellendi");
      fetchData();
    } catch (error) {
      console.error("Error saving daily km:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Günlük KM Takibi</h1>
          <p className="text-sm text-slate-500">Günlük kilometre ve maliyet</p>
        </div>
      </div>

      {/* Today's Entry Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Bugünkü Kayıt
        </h2>

        {vehicles.length === 0 ? (
          <div className="text-center py-6">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 mb-3">Önce araç eklemeniz gerekiyor</p>
            <Button onClick={() => navigate("/vehicles")} variant="outline" size="sm">
              Araç Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Araç Seçimi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Araç
              </label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Araç seçin" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} {vehicle.is_active && "(Aktif)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KM Girişleri */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gün Başlangıç KM
                </label>
                <Input
                  type="number"
                  placeholder="Örn: 46000"
                  value={formData.start_km}
                  onChange={(e) => setFormData({ ...formData, start_km: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gün Bitiş KM
                </label>
                <Input
                  type="number"
                  placeholder="Örn: 46150"
                  value={formData.end_km}
                  onChange={(e) => setFormData({ ...formData, end_km: e.target.value })}
                />
              </div>
            </div>

            {/* Hesaplanan Değerler */}
            {formData.start_km && formData.end_km && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-green-600 mb-1">Günlük KM</div>
                    <div className="text-xl font-bold text-green-700">
                      {(parseFloat(formData.end_km) - parseFloat(formData.start_km)).toLocaleString()} km
                    </div>
                  </div>
                  {todayRecord?.daily_cost && (
                    <div>
                      <div className="text-xs text-green-600 mb-1">Günlük Maliyet</div>
                      <div className="text-xl font-bold text-green-700">
                        {todayRecord.daily_cost.toLocaleString()} ₺
                      </div>
                    </div>
                  )}
                </div>
                {todayRecord?.avg_cost_per_km && (
                  <div className="text-xs text-green-600 mt-2">
                    Ort. km maliyeti: {todayRecord.avg_cost_per_km.toFixed(2)} ₺/km
                  </div>
                )}
              </div>
            )}

            {/* Kaydet */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            Son Kayıtlar
          </h2>
        </div>

        {records.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            Henüz kayıt yok
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.slice(0, 10).map((record) => (
              <div key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-900">{record.date}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{getVehicleName(record.vehicle_id)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>Başlangıç: {record.start_km?.toLocaleString()} km</span>
                      <span>Bitiş: {record.end_km?.toLocaleString() || "-"} km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {record.daily_km && (
                      <div className="font-semibold text-slate-900">{record.daily_km.toLocaleString()} km</div>
                    )}
                    {record.daily_cost && (
                      <div className="text-sm text-green-600">{record.daily_cost.toLocaleString()} ₺</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
