import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Phone, CheckCircle, XCircle, Save, Banknote, Bell, Plus, Calendar, Play, Square, Star, AlertTriangle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VISIT_SKIP_REASONS = [
  "Müşteri yerinde değildi",
  "İşyeri kapalıydı",
  "Müşteri görüşmek istemedi",
  "Ulaşım sorunu",
  "Zaman yetersizliği",
  "Diğer"
];

const PAYMENT_SKIP_REASONS = [
  "Müşterinin ödeme gücü yok",
  "Vade henüz dolmadı",
  "Müşteri erteleme istedi",
  "Ödeme bilgisi yok",
  "Diğer"
];

const PAYMENT_TYPES = [
  "Nakit",
  "Kredi Kartı",
  "Havale/EFT",
  "Çek"
];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [visit, setVisit] = useState(null);
  
  // Form states - Yeni status sistemi
  const [visitStatus, setVisitStatus] = useState("pending"); // pending, visited, not_visited
  const [completed, setCompleted] = useState(false); // Geriye uyumluluk
  const [visitSkipReason, setVisitSkipReason] = useState("");
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [paymentSkipReason, setPaymentSkipReason] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [note, setNote] = useState("");
  
  // Follow-up states
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    due_date: "",
    due_time: "",
    reason: "",
    note: ""
  });
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  
  // FAZ 2: Ziyaret süresi ve kalite states
  const [visitStarted, setVisitStarted] = useState(false);
  const [visitEnded, setVisitEnded] = useState(false);
  const [visitDuration, setVisitDuration] = useState(null);
  const [qualityRating, setQualityRating] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const date = location.state?.date || new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      const customerRes = await axios.get(`${API}/customers/${id}`);
      setCustomer(customerRes.data);

      const visitRes = await axios.post(`${API}/visits?customer_id=${id}&date=${date}`);
      setVisit(visitRes.data);
      
      // Set form values from visit data
      // Yeni status sistemi
      const status = visitRes.data.status || (visitRes.data.completed ? "visited" : (visitRes.data.visit_skip_reason ? "not_visited" : "pending"));
      setVisitStatus(status);
      setCompleted(visitRes.data.completed || false);
      setVisitSkipReason(visitRes.data.visit_skip_reason || "");
      setPaymentCollected(visitRes.data.payment_collected || false);
      setPaymentSkipReason(visitRes.data.payment_skip_reason || "");
      setPaymentType(visitRes.data.payment_type || "");
      setPaymentAmount(visitRes.data.payment_amount ? String(visitRes.data.payment_amount) : "");
      setCustomerRequest(visitRes.data.customer_request || "");
      setNote(visitRes.data.note || "");
      
      // FAZ 2: Ziyaret süresi ve kalite verilerini yükle
      setVisitStarted(!!visitRes.data.started_at);
      setVisitEnded(!!visitRes.data.ended_at);
      setVisitDuration(visitRes.data.duration_minutes);
      setQualityRating(visitRes.data.quality_rating || 0);
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

  // FAZ 2: Ziyaret süresi sayacı
  useEffect(() => {
    let interval;
    if (visitStarted && !visitEnded) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visitStarted, visitEnded]);

  // FAZ 2: Ziyareti başlat
  const handleStartVisit = async () => {
    if (!visit) return;
    try {
      await axios.post(`${API}/visits/${visit.id}/start`);
      setVisitStarted(true);
      setElapsedTime(0);
      toast.success("Ziyaret başlatıldı");
    } catch (error) {
      console.error("Error starting visit:", error);
      toast.error(error.response?.data?.detail || "Ziyaret başlatılamadı");
    }
  };

  // FAZ 2: Ziyareti bitir
  const handleEndVisit = async () => {
    if (!visit) return;
    try {
      const res = await axios.post(`${API}/visits/${visit.id}/end`);
      setVisitEnded(true);
      setVisitDuration(res.data.duration_minutes);
      toast.success(`Ziyaret tamamlandı (${res.data.duration_minutes} dakika)`);
    } catch (error) {
      console.error("Error ending visit:", error);
      toast.error(error.response?.data?.detail || "Ziyaret bitirilemedi");
    }
  };

  // Geçen süreyi formatla (mm:ss)
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!visit) return;
    
    // Ziyaret Edilmedi seçiliyse sebep zorunlu
    if (visitStatus === "not_visited" && !visitSkipReason) {
      toast.error("Ziyaret edilmeme sebebi seçiniz");
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/visits/${visit.id}`, {
        status: visitStatus,
        completed: visitStatus === "visited",
        visit_skip_reason: visitStatus === "not_visited" ? visitSkipReason : null,
        payment_collected: visitStatus === "visited" ? paymentCollected : false,
        payment_skip_reason: (visitStatus === "visited" && !paymentCollected) ? paymentSkipReason : null,
        payment_type: (visitStatus === "visited" && paymentCollected) ? paymentType : null,
        payment_amount: (visitStatus === "visited" && paymentCollected && paymentAmount) ? parseFloat(paymentAmount) : null,
        customer_request: customerRequest || null,
        note: note || null,
        quality_rating: qualityRating > 0 ? qualityRating : null,
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

  const handleCreateFollowUp = async () => {
    if (!followUpData.due_date) {
      toast.error("Tarih seçiniz");
      return;
    }
    
    setSavingFollowUp(true);
    try {
      await axios.post(`${API}/follow-ups`, {
        customer_id: id,
        due_date: followUpData.due_date,
        due_time: followUpData.due_time || null,
        reason: followUpData.reason || null,
        note: followUpData.note || null
      });
      toast.success("Takip oluşturuldu");
      setFollowUpDialogOpen(false);
      setFollowUpData({ due_date: "", due_time: "", reason: "", note: "" });
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast.error("Takip oluşturulamadı");
    } finally {
      setSavingFollowUp(false);
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

  const priceStatus = customer.price_status || "Standart";

  return (
    <div className="p-4 pt-6 pb-24" data-testid="customer-detail-page">
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Geri</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFollowUpDialogOpen(true)}
            className="flex items-center gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
            data-testid="create-followup-button"
          >
            <Bell className="w-4 h-4" />
            Takip Oluştur
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {customer.name}
          </h1>
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
            priceStatus === "İskontolu" 
              ? "bg-amber-100 text-amber-700" 
              : "bg-slate-100 text-slate-600"
          }`}>
            {priceStatus}
          </span>
        </div>
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
        
        {/* FAZ 2: Müşteri Uyarıları */}
        {customer.alerts && customer.alerts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" data-testid="customer-alerts">
            {customer.alerts.map((alert, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200"
              >
                <AlertTriangle className="w-3 h-3" />
                {alert}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* FAZ 2: Ziyaret Süresi Takibi */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Ziyaret Süresi
        </h2>
        
        {!visitStarted ? (
          <Button
            onClick={handleStartVisit}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
            data-testid="start-visit-button"
          >
            <Play className="w-5 h-5 mr-2" />
            Ziyareti Başlat
          </Button>
        ) : !visitEnded ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-2xl font-mono font-bold text-green-700">{formatElapsedTime(elapsedTime)}</span>
            </div>
            <Button
              onClick={handleEndVisit}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
              data-testid="end-visit-button"
            >
              <Square className="w-5 h-5 mr-2" />
              Ziyareti Bitir
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-lg">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="text-lg font-medium text-slate-700">
              Ziyaret süresi: <span className="font-bold">{visitDuration} dakika</span>
            </span>
          </div>
        )}
      </div>

      {/* Ziyaret Durumu - Yeni 3 durumlu sistem */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Ziyaret Durumu
        </h2>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div
            onClick={() => {
              setVisitStatus("visited");
              setCompleted(true);
              setVisitSkipReason("");
            }}
            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
              visitStatus === "visited"
                ? "bg-green-50 border-green-200"
                : "bg-white border-slate-200"
            }`}
            data-testid="visit-yes"
          >
            <CheckCircle className={`w-5 h-5 ${visitStatus === "visited" ? "text-green-600" : "text-slate-300"}`} />
            <span className={`text-sm font-medium ${visitStatus === "visited" ? "text-green-700" : "text-slate-600"}`}>
              Ziyaret Edildi
            </span>
          </div>
          <div
            onClick={() => {
              setVisitStatus("not_visited");
              setCompleted(false);
              // Tahsilat alanlarını sıfırla
              setPaymentCollected(false);
              setPaymentType("");
              setPaymentAmount("");
              setPaymentSkipReason("");
            }}
            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
              visitStatus === "not_visited"
                ? "bg-red-50 border-red-200"
                : "bg-white border-slate-200"
            }`}
            data-testid="visit-no"
          >
            <XCircle className={`w-5 h-5 ${visitStatus === "not_visited" ? "text-red-600" : "text-slate-300"}`} />
            <span className={`text-sm font-medium ${visitStatus === "not_visited" ? "text-red-700" : "text-slate-600"}`}>
              Ziyaret Edilmedi
            </span>
          </div>
        </div>

        {visitStatus === "not_visited" && (
          <div className="mt-3">
            <label className="block text-sm text-slate-600 mb-1.5">
              Ziyaret Edilmeme Sebebi <span className="text-red-500">*</span>
            </label>
            <Select value={visitSkipReason} onValueChange={setVisitSkipReason}>
              <SelectTrigger className={`h-11 bg-slate-50 rounded-lg ${!visitSkipReason ? "border-red-300" : "border-slate-200"}`} data-testid="visit-skip-reason">
                <SelectValue placeholder="Sebep seçin (zorunlu)..." />
              </SelectTrigger>
              <SelectContent>
                {VISIT_SKIP_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tahsilat Durumu - Ziyaret Edilmedi ise pasif */}
      <div className={`bg-white rounded-xl p-4 border shadow-sm mb-3 ${visitStatus === "not_visited" ? "opacity-50 border-slate-200" : "border-slate-100"}`}>
        <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-slate-600" />
          Tahsilat Durumu
          {visitStatus === "not_visited" && (
            <span className="text-xs text-slate-400 font-normal ml-2">(Ziyaret edilmedi)</span>
          )}
        </h2>
        
        {visitStatus === "not_visited" ? (
          <div className="text-center py-4 text-slate-400 text-sm">
            Ziyaret edilmediği için tahsilat bilgisi girilemez
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div
                onClick={() => setPaymentCollected(true)}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentCollected
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-slate-200"
                }`}
                data-testid="payment-yes"
              >
                <CheckCircle className={`w-5 h-5 ${paymentCollected ? "text-green-600" : "text-slate-300"}`} />
                <span className={`text-sm font-medium ${paymentCollected ? "text-green-700" : "text-slate-600"}`}>
                  Tahsilat Yapıldı
                </span>
              </div>
              <div
                onClick={() => setPaymentCollected(false)}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  !paymentCollected
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-slate-200"
                }`}
                data-testid="payment-no"
              >
                <XCircle className={`w-5 h-5 ${!paymentCollected ? "text-orange-600" : "text-slate-300"}`} />
                <span className={`text-sm font-medium ${!paymentCollected ? "text-orange-700" : "text-slate-600"}`}>
                  Tahsilat Yapılmadı
                </span>
              </div>
            </div>

            {paymentCollected ? (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">Ödeme Türü</label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-lg" data-testid="payment-type">
                      <SelectValue placeholder="Tür seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">Tahsilat Tutarı (TL)</label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-11 bg-slate-50 border-slate-200 rounded-lg"
                    data-testid="payment-amount"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <label className="block text-sm text-slate-600 mb-1.5">Tahsilat Yapılmama Sebebi</label>
                <Select value={paymentSkipReason} onValueChange={setPaymentSkipReason}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-lg" data-testid="payment-skip-reason">
                    <SelectValue placeholder="Sebep seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_SKIP_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAZ 2: Ziyaret Kalitesi (Yıldız Puanlama) */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          Ziyaret Kalitesi
        </h2>
        <div className="flex items-center justify-center gap-2" data-testid="quality-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setQualityRating(star)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
              data-testid={`star-${star}`}
            >
              <Star 
                className={`w-10 h-10 transition-colors ${
                  star <= qualityRating 
                    ? "text-amber-400 fill-amber-400" 
                    : "text-slate-200"
                }`} 
              />
            </button>
          ))}
        </div>
        {qualityRating > 0 && (
          <p className="text-center mt-2 text-sm text-slate-500">
            {qualityRating === 1 && "Çok Düşük"}
            {qualityRating === 2 && "Düşük"}
            {qualityRating === 3 && "Orta"}
            {qualityRating === 4 && "İyi"}
            {qualityRating === 5 && "Mükemmel"}
          </p>
        )}
      </div>

      {/* Müşteri Talebi */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-3">
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Müşteri Talebi / Özel Not
        </h2>
        <Textarea
          placeholder="Müşterinin özel talep veya istekleri..."
          value={customerRequest}
          onChange={(e) => setCustomerRequest(e.target.value)}
          className="min-h-[80px] bg-slate-50 border-slate-200 rounded-lg resize-none"
          data-testid="customer-request"
        />
      </div>

      {/* Genel Not */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Ziyaret Notu
        </h2>
        <Textarea
          placeholder="Ziyaret hakkında genel notlar..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[80px] bg-slate-50 border-slate-200 rounded-lg resize-none"
          data-testid="note-textarea"
        />
      </div>

      {/* Kaydet Butonu */}
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

      {/* Follow-Up Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Takip Oluştur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {customer?.name} için yeni bir takip hatırlatması oluşturun.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tarih *
                </label>
                <Input
                  type="date"
                  value={followUpData.due_date}
                  onChange={(e) => setFollowUpData({...followUpData, due_date: e.target.value})}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-11"
                  data-testid="followup-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Saat
                </label>
                <Input
                  type="time"
                  value={followUpData.due_time}
                  onChange={(e) => setFollowUpData({...followUpData, due_time: e.target.value})}
                  className="h-11"
                  data-testid="followup-time"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Takip Nedeni
              </label>
              <Input
                value={followUpData.reason}
                onChange={(e) => setFollowUpData({...followUpData, reason: e.target.value})}
                placeholder="Örn: Teklif takibi, ödeme hatırlatma..."
                className="h-11"
                data-testid="followup-reason"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Not
              </label>
              <Textarea
                value={followUpData.note}
                onChange={(e) => setFollowUpData({...followUpData, note: e.target.value})}
                placeholder="Ek notlar..."
                className="min-h-[80px] resize-none"
                data-testid="followup-note"
              />
            </div>
            
            <Button
              onClick={handleCreateFollowUp}
              disabled={savingFollowUp}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="save-followup-button"
            >
              {savingFollowUp ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Takip Oluştur
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
