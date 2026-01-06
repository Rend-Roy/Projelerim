import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import axios from "axios";
import { CalendarDays, RefreshCw, FileText, Download, MessageSquare, Save, ChevronLeft, ChevronRight, Bell, CheckCircle, Clock, AlertCircle } from "lucide-react";
import CustomerCard from "@/components/CustomerCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dailyNote, setDailyNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Selected date - defaults to today
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  
  // Computed values based on selected date
  const englishDayName = format(selectedDate, "EEEE");
  const turkishDayName = dayNameMap[englishDayName];
  const formattedDate = format(selectedDate, "dd MMMM yyyy", { locale: tr });
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = isSameDay(selectedDate, today);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Seed data if needed (only on first load)
      await axios.post(`${API}/seed`);

      // Get customers for selected day
      const customersRes = await axios.get(`${API}/customers/today/${turkishDayName}`);
      setCustomers(customersRes.data);

      // Get visits for selected date
      const visitsRes = await axios.get(`${API}/visits?date=${selectedDateStr}`);
      const visitsMap = {};
      visitsRes.data.forEach((v) => {
        visitsMap[v.customer_id] = v;
      });
      setVisits(visitsMap);
      
      // Get follow-ups for today (only when viewing today)
      if (isToday) {
        const followUpsRes = await axios.get(`${API}/follow-ups/today`);
        setFollowUps(followUpsRes.data);
      } else {
        // Get follow-ups for selected date
        const followUpsRes = await axios.get(`${API}/follow-ups?date=${selectedDateStr}`);
        // Add customer info
        const withCustomers = await Promise.all(
          followUpsRes.data.map(async (fu) => {
            try {
              const customerRes = await axios.get(`${API}/customers/${fu.customer_id}`);
              return { ...fu, customer: { name: customerRes.data.name, region: customerRes.data.region } };
            } catch {
              return fu;
            }
          })
        );
        setFollowUps(withCustomers);
      }
      
      // Get daily note for selected date
      const noteRes = await axios.get(`${API}/daily-note/${selectedDateStr}`);
      setDailyNote(noteRes.data.note || "");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const saveDailyNote = async () => {
    setSavingNote(true);
    try {
      await axios.post(`${API}/daily-note/${selectedDateStr}`, { note: dailyNote });
      toast.success("Gün sonu notu kaydedildi");
      setNoteDialogOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Not kaydedilirken hata oluştu");
    } finally {
      setSavingNote(false);
    }
  };

  // Fetch data when selected date changes
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Reset to today when component unmounts or page is navigated away
  useEffect(() => {
    return () => {
      // This ensures when user comes back, it starts fresh with today
    };
  }, []);

  const completedCount = Object.values(visits).filter((v) => v.completed).length;
  const totalCount = customers.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await axios.post(`${API}/follow-ups/${followUpId}/complete`);
      toast.success("Takip tamamlandı");
      fetchData();
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Takip tamamlanamadı");
    }
  };

  const lateFollowUps = followUps.filter(fu => fu.status === "late");
  const pendingFollowUps = followUps.filter(fu => fu.status === "pending");
  const doneFollowUps = followUps.filter(fu => fu.status === "done");

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await axios.get(
        `${API}/report/pdf/${turkishDayName}/${selectedDateStr}`,
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ziyaret_raporu_${selectedDateStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF raporu indirildi");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("PDF indirirken hata oluştu");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="p-4 pt-6" data-testid="today-page">
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {turkishDayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span className="text-slate-500">{formattedDate}</span>
              {!isToday && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  {format(selectedDate, "yyyy-MM-dd") < format(today, "yyyy-MM-dd") ? "Geçmiş" : "Gelecek"}
                </span>
              )}
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

      {/* Date Navigation */}
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            data-testid="prev-day"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                data-testid="date-picker-trigger"
              >
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">
                  {isToday ? "Bugün" : format(selectedDate, "d MMM", { locale: tr })}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={tr}
                initialFocus
              />
              {!isToday && (
                <div className="p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={goToToday}
                  >
                    Bugüne Dön
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          
          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            data-testid="next-day"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        {!isToday && (
          <button
            onClick={goToToday}
            className="w-full mt-2 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            data-testid="go-to-today"
          >
            Bugüne Dön
          </button>
        )}
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {isToday ? "Günlük İlerleme" : `${format(selectedDate, "d MMM", { locale: tr })} İlerlemesi`}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {completedCount}/{totalCount} Ziyaret
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" data-testid="progress-bar" />
      </div>

      {/* PDF Report Button */}
      <div className="flex gap-2 mb-6">
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 h-12 border-slate-200 hover:bg-slate-50 rounded-xl font-medium"
              data-testid="daily-note-button"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                Gün Sonu Notu
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Gün Sonu Notu - {format(selectedDate, "d MMMM", { locale: tr })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Bu not PDF raporunda yöneticiye gösterilecektir.
              </p>
              <Textarea
                value={dailyNote}
                onChange={(e) => setDailyNote(e.target.value)}
                placeholder="Günün genel değerlendirmesi, önemli notlar, dikkat edilmesi gerekenler..."
                className="min-h-[150px] resize-none"
                data-testid="daily-note-textarea"
              />
              <Button
                onClick={saveDailyNote}
                disabled={savingNote}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="save-daily-note"
              >
                {savingNote ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Notu Kaydet
                  </span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf || totalCount === 0}
          variant="outline"
          className="flex-1 h-12 border-slate-200 hover:bg-slate-50 rounded-xl font-medium"
          data-testid="download-pdf-button"
        >
          {downloadingPdf ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              İndiriliyor...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              PDF Rapor
              <Download className="w-4 h-4 text-slate-400" />
            </span>
          )}
        </Button>
      </div>

      {/* Follow-Ups Section */}
      {followUps.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Takipler
            {lateFollowUps.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {lateFollowUps.length} gecikmiş
              </span>
            )}
          </h2>
          
          <div className="space-y-2">
            {/* Late follow-ups */}
            {lateFollowUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-red-50 rounded-xl p-4 border border-red-200"
                data-testid={`followup-${fu.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-red-900">{fu.customer?.name || "Müşteri"}</h4>
                    <p className="text-sm text-red-700">{fu.reason || "Takip"}</p>
                    <p className="text-xs text-red-500 mt-1">
                      Gecikmiş: {fu.due_date} {fu.due_time && `${fu.due_time}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCompleteFollowUp(fu.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-testid={`complete-followup-${fu.id}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Pending follow-ups */}
            {pendingFollowUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-blue-50 rounded-xl p-4 border border-blue-200"
                data-testid={`followup-${fu.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-blue-900">{fu.customer?.name || "Müşteri"}</h4>
                    <p className="text-sm text-blue-700">{fu.reason || "Takip"}</p>
                    {fu.due_time && (
                      <p className="text-xs text-blue-500 mt-1">Saat: {fu.due_time}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCompleteFollowUp(fu.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid={`complete-followup-${fu.id}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Done follow-ups */}
            {doneFollowUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-green-50 rounded-xl p-4 border border-green-200 opacity-75"
                data-testid={`followup-${fu.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-green-900">{fu.customer?.name || "Müşteri"}</h4>
                    <p className="text-sm text-green-700">{fu.reason || "Takip"}</p>
                    <p className="text-xs text-green-600 mt-1">✓ Tamamlandı</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer List */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          {isToday ? "Bugünkü Ziyaretler" : `${turkishDayName} Ziyaretleri`}
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
              {isToday ? "Bugün için ziyaret yok" : "Bu gün için ziyaret yok"}
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
                date={selectedDateStr}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
