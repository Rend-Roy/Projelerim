import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Trash2, MapPin, ChevronDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const PRICE_STATUSES = ["Standart", "İskontolu"];

// FAZ 2: Müşteri Uyarı Seçenekleri
const CUSTOMER_ALERTS = [
  "Geç öder",
  "Fiyat hassas",
  "Belirli saatlerde",
  "Özel anlaşma var",
  "Tahsilat problemi var",
  "Sürekli erteleme yapıyor"
];

export default function CustomerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    phone: "",
    address: "",
    price_status: "Standart",
    visit_days: [],
    alerts: [],  // FAZ 2: Müşteri uyarıları
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRegions = async () => {
    try {
      const res = await axios.get(`${API}/regions`);
      setRegions(res.data);
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  useEffect(() => {
    fetchRegions();
    if (isEditMode) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/customers/${id}`);
      setFormData({
        name: res.data.name || "",
        region: res.data.region || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        price_status: res.data.price_status || "Standart",
        visit_days: res.data.visit_days || [],
        alerts: res.data.alerts || [],  // FAZ 2
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Müşteri bilgileri yüklenemedi");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      visit_days: prev.visit_days.includes(day)
        ? prev.visit_days.filter((d) => d !== day)
        : [...prev.visit_days, day],
    }));
  };

  // FAZ 2: Uyarı toggle fonksiyonu
  const toggleAlert = (alert) => {
    setFormData((prev) => ({
      ...prev,
      alerts: prev.alerts.includes(alert)
        ? prev.alerts.filter((a) => a !== alert)
        : [...prev.alerts, alert],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Müşteri adı zorunludur");
      return;
    }
    if (!formData.region.trim()) {
      toast.error("Bölge zorunludur");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await axios.put(`${API}/customers/${id}`, formData);
        toast.success("Müşteri güncellendi");
      } else {
        await axios.post(`${API}/customers`, formData);
        toast.success("Müşteri eklendi");
      }
      navigate(-1);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/customers/${id}`);
      toast.success("Müşteri silindi");
      navigate("/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Silme sırasında hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 pt-6" data-testid="loading-state">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            <div className="h-12 bg-slate-200 rounded-xl" />
            <div className="h-12 bg-slate-200 rounded-xl" />
            <div className="h-12 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6" data-testid="customer-form-page">
      {/* Header */}
      <header className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          data-testid="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Geri</span>
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? "Müşteri Düzenle" : "Yeni Müşteri"}
          </h1>
          {isEditMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  data-testid="delete-button"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Müşteri ve tüm ziyaret kayıtları kalıcı olarak silinecektir.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                    data-testid="confirm-delete"
                  >
                    {deleting ? "Siliniyor..." : "Sil"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Müşteri Adı *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Örn: Ahmet Market"
            className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            data-testid="name-input"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Bölge *
          </label>
          {regions.length > 0 ? (
            <Select
              value={formData.region}
              onValueChange={(value) => handleChange("region", value)}
            >
              <SelectTrigger 
                className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                data-testid="region-select"
              >
                <SelectValue placeholder="Bölge seçin..." />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.name}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {region.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              value={formData.region}
              onChange={(e) => handleChange("region", e.target.value)}
              placeholder="Önce bölge ekleyin veya manuel girin"
              className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
              data-testid="region-input"
            />
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Telefon
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Örn: 0532 111 2233"
            className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            data-testid="phone-input"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Adres
          </label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Örn: Moda Cad. No:15"
            className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            data-testid="address-input"
          />
        </div>

        {/* Price Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Fiyat Statüsü
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRICE_STATUSES.map((status) => {
              const isSelected = formData.price_status === status;
              return (
                <div
                  key={status}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleChange("price_status", status);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                    isSelected
                      ? status === "İskontolu" 
                        ? "bg-amber-50 border-amber-200" 
                        : "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                  data-testid={`price-${status}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? status === "İskontolu"
                          ? "bg-amber-500 border-amber-500"
                          : "bg-blue-600 border-blue-600"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isSelected 
                        ? status === "İskontolu" ? "text-amber-700" : "text-blue-700"
                        : "text-slate-600"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visit Days */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Ziyaret Günleri
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS.map((day) => {
              const isSelected = formData.visit_days.includes(day);
              return (
                <div
                  key={day}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDay(day);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                    isSelected
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                  data-testid={`day-${day}`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-blue-700" : "text-slate-600"
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAZ 2: Müşteri Uyarıları */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Müşteri Uyarıları (Kırmızı Bayrak)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {CUSTOMER_ALERTS.map((alert) => {
              const isSelected = formData.alerts.includes(alert);
              return (
                <div
                  key={alert}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleAlert(alert);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                    isSelected
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                  data-testid={`alert-${alert}`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-red-600 border-red-600"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-red-700" : "text-slate-600"
                    }`}
                  >
                    {alert}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-base"
            data-testid="submit-button"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </span>
            ) : isEditMode ? (
              "Güncelle"
            ) : (
              "Müşteri Ekle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
