import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, Fuel, Calendar, Car, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function FuelRecordsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleFilter = searchParams.get("vehicle");

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    date: new Date().toISOString().split("T")[0],
    current_km: "",
    liters: "",
    amount: "",
    note: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [vehicleFilter]);

  const fetchData = async () => {
    try {
      const [recordsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/fuel-records${vehicleFilter ? `?vehicle_id=${vehicleFilter}` : ""}`),
        axios.get(`${API}/vehicles`)
      ]);
      setRecords(recordsRes.data);
      setVehicles(vehiclesRes.data);
      
      // Varsayılan araç seç
      if (vehiclesRes.data.length > 0 && !formData.vehicle_id) {
        const activeVehicle = vehiclesRes.data.find(v => v.is_active) || vehiclesRes.data[0];
        setFormData(prev => ({ ...prev, vehicle_id: activeVehicle.id }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.vehicle_id || !formData.current_km || !formData.liters || !formData.amount) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/fuel-records`, {
        vehicle_id: formData.vehicle_id,
        date: formData.date,
        current_km: parseFloat(formData.current_km),
        liters: parseFloat(formData.liters),
        amount: parseFloat(formData.amount),
        note: formData.note || null
      });

      toast.success("Yakıt kaydı eklendi");
      setDialogOpen(false);
      setFormData(prev => ({
        ...prev,
        current_km: "",
        liters: "",
        amount: "",
        note: ""
      }));
      fetchData();
    } catch (error) {
      console.error("Error saving fuel record:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Bu yakıt kaydını silmek istediğinize emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/fuel-records/${recordId}`);
      toast.success("Yakıt kaydı silindi");
      fetchData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Silme sırasında hata oluştu");
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : "-";
  };

  // İstatistikler
  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalLiters = records.reduce((sum, r) => sum + (r.liters || 0), 0);

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Yakıt Kayıtları</h1>
            <p className="text-sm text-slate-500">{records.length} kayıt</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Yakıt Ekle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Toplam Harcama</div>
          <div className="text-lg font-bold text-slate-900">{totalAmount.toLocaleString()} ₺</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Toplam Yakıt</div>
          <div className="text-lg font-bold text-slate-900">{totalLiters.toLocaleString()} L</div>
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Henüz yakıt kaydı yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white p-4 rounded-xl border border-slate-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{record.amount.toLocaleString()} ₺</span>
                    <span className="text-sm text-slate-500">({record.liters} L)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {record.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      {getVehicleName(record.vehicle_id)}
                    </span>
                    <span>{record.current_km?.toLocaleString()} km</span>
                  </div>
                  {/* Hesaplanan değerler */}
                  {record.cost_per_km && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        {record.cost_per_km.toFixed(2)} ₺/km
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                        {record.consumption_per_100km?.toFixed(1)} L/100km
                      </span>
                      {record.distance_since_last && (
                        <span className="text-slate-400">
                          {record.distance_since_last.toLocaleString()} km gitti
                        </span>
                      )}
                    </div>
                  )}
                  {record.note && (
                    <p className="text-xs text-slate-500 mt-1">{record.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yakıt Kaydı Ekle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Araç */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Araç *
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
                      {vehicle.name} {vehicle.plate && `(${vehicle.plate})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarih */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tarih *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* Kilometre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mevcut Kilometre *
              </label>
              <Input
                type="number"
                placeholder="Örn: 46000"
                value={formData.current_km}
                onChange={(e) => setFormData({ ...formData, current_km: e.target.value })}
              />
            </div>

            {/* Litre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alınan Yakıt (Litre) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Örn: 45.5"
                value={formData.liters}
                onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
              />
            </div>

            {/* Tutar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Toplam Tutar (₺) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Örn: 2250"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Not (Opsiyonel)
              </label>
              <Input
                placeholder="Örn: Tam depo"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
