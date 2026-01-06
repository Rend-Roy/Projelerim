import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Phone, CheckCircle, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [visit, setVisit] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const date = location.state?.date || new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get customer
      const customerRes = await axios.get(`${API}/customers/${id}`);
      setCustomer(customerRes.data);

      // Get or create visit for this date
      const visitRes = await axios.post(`${API}/visits?customer_id=${id}&date=${date}`);
      setVisit(visitRes.data);
      setCompleted(visitRes.data.completed || false);
      setNote(visitRes.data.note || "");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, date]);

  const handleSave = async () => {
    if (!visit) return;

    setSaving(true);
    try {
      await axios.put(`${API}/visits/${visit.id}`, {
        completed,
        note,
      });
      toast.success("Ziyaret kaydedildi");
      navigate(-1);
    } catch (error) {
      console.error("Error saving visit:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 pt-6" data-testid="loading-state">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
          <div className="h-24 bg-slate-200 rounded-xl mb-4" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 pt-6 text-center">
        <p className="text-slate-500">Müşteri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6" data-testid="customer-detail-page">
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

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {customer.name}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{customer.region}</span>
          </div>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-blue-600"
              data-testid="phone-link"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{customer.phone}</span>
            </a>
          )}
        </div>
      </header>

      {/* Visit Status Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Ziyaret Durumu
        </h2>

        <div
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 cursor-pointer"
          onClick={() => setCompleted(!completed)}
          data-testid="visit-status-toggle"
        >
          <Checkbox
            checked={completed}
            onCheckedChange={setCompleted}
            className="w-6 h-6 rounded-lg border-2"
            data-testid="completed-checkbox"
          />
          <div className="flex-1">
            <span className="font-medium text-slate-700">Ziyaret Edildi</span>
            <p className="text-sm text-slate-500">
              Müşteriyi ziyaret ettiyseniz işaretleyin
            </p>
          </div>
          {completed && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </div>

      {/* Note Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Ziyaret Notu
        </h2>
        <Textarea
          placeholder="Ziyaret hakkında not ekleyin..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[120px] bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl resize-none"
          data-testid="note-textarea"
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-base"
        data-testid="save-button"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Kaydediliyor...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Kaydet
          </span>
        )}
      </Button>
    </div>
  );
}
