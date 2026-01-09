import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, Car, Fuel, Settings, Check, X, Pencil, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    plate: "",
    fuel_type: "Benzin",
    starting_km: "",
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, fuelTypesRes] = await Promise.all([
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/fuel-types`)
      ]);
      setVehicles(vehiclesRes.data);
      setFuelTypes(fuelTypesRes.data.fuel_types);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name,
        plate: vehicle.plate || "",
        fuel_type: vehicle.fuel_type,
        starting_km: String(vehicle.starting_km),
        is_active: vehicle.is_active
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        name: "",
        plate: "",
        fuel_type: "Benzin",
        starting_km: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Araç adı zorunlu");
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        starting_km: formData.starting_km ? parseFloat(formData.starting_km) : 0
      };

      if (editingVehicle) {
        await axios.put(`${API}/vehicles/${editingVehicle.id}`, data);
        toast.success("Araç güncellendi");
      } else {
        await axios.post(`${API}/vehicles`, data);
        toast.success("Araç eklendi");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      await axios.delete(`${API}/vehicles/${vehicleId}`);
      toast.success("Araç silindi");
      fetchData();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Silme sırasında hata oluştu");
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Araç Yönetimi</h1>
            <p className="text-sm text-slate-500">{vehicles.length} araç kayıtlı</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Araç Ekle
        </Button>
      </div>

      {/* Vehicle List */}
      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Henüz araç eklenmemiş</p>
          <Button
            onClick={() => handleOpenDialog()}
            variant="outline"
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            İlk Aracı Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`bg-white p-4 rounded-xl border shadow-sm ${
                vehicle.is_active ? "border-green-200" : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${vehicle.is_active ? "bg-green-100" : "bg-slate-100"}`}>
                    <Car className={`w-6 h-6 ${vehicle.is_active ? "text-green-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{vehicle.name}</h3>
                      {vehicle.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                    {vehicle.plate && (
                      <p className="text-sm text-slate-500">{vehicle.plate}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5" />
                        {vehicle.fuel_type}
                      </span>
                      <span>{vehicle.starting_km?.toLocaleString()} km başlangıç</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenDialog(vehicle)}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Aracı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{vehicle.name}" aracını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(vehicle.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/fuel-records?vehicle=${vehicle.id}`)}
                  className="flex-1 text-xs"
                >
                  <Fuel className="w-3.5 h-3.5 mr-1" />
                  Yakıt Kayıtları
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/vehicle-stats/${vehicle.id}`)}
                  className="flex-1 text-xs"
                >
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  İstatistikler
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Araç Düzenle" : "Yeni Araç Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Araç Adı */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Araç Adı *
              </label>
              <Input
                placeholder="Örn: Fiat Doblo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Plaka */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plaka (Opsiyonel)
              </label>
              <Input
                placeholder="Örn: 34 ABC 123"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              />
            </div>

            {/* Yakıt Türü */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Yakıt Türü
              </label>
              <Select
                value={formData.fuel_type}
                onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Başlangıç KM */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Başlangıç Kilometresi
              </label>
              <Input
                type="number"
                placeholder="Örn: 45000"
                value={formData.starting_km}
                onChange={(e) => setFormData({ ...formData, starting_km: e.target.value })}
              />
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  formData.is_active ? "bg-green-500" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-slate-600">
                {formData.is_active ? "Aktif Araç" : "Pasif Araç"}
              </span>
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
                {saving ? "Kaydediliyor..." : editingVehicle ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
