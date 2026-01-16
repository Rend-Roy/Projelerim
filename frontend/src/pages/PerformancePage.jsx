import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import axios from "axios";
import {
  BarChart3,
  TrendingUp,
  Users,
  Banknote,
  Target,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Tag,
  Clock,
  Star,
  AlertTriangle,
  FileDown,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function PerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/analytics/performance?period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleDownloadPeriodReport = async (reportPeriod) => {
    setDownloadingPdf(true);
    try {
      const response = await axios.get(
        `${API}/report/pdf/period/${reportPeriod}`,
        { responseType: "blob" }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const periodLabel = reportPeriod === "weekly" ? "haftalik" : "aylik";
      link.setAttribute("download", `performans_raporu_${periodLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportPeriod === "weekly" ? "Haftalık" : "Aylık"} rapor indirildi`);
      setReportDialogOpen(false);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("PDF indirirken hata oluştu");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr) => {
    return format(new Date(dateStr), "d MMM", { locale: tr });
  };

  // Prepare chart data for visit skip reasons
  const visitSkipData = data?.visit_performance?.skip_reasons
    ? Object.entries(data.visit_performance.skip_reasons).map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        value,
      }))
    : [];

  // Prepare chart data for payment skip reasons
  const paymentSkipData = data?.payment_performance?.skip_reasons
    ? Object.entries(data.payment_performance.skip_reasons).map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        value,
      }))
    : [];

  // Price comparison data
  const priceComparisonData = data?.price_analysis
    ? [
        {
          name: "İskontolu",
          ziyaret: data.price_analysis.iskontolu.visit_rate,
          tahsilat: data.price_analysis.iskontolu.total_payment,
        },
        {
          name: "Standart",
          ziyaret: data.price_analysis.standart.visit_rate,
          tahsilat: data.price_analysis.standart.total_payment,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-4 pt-6" data-testid="performance-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 pb-24" data-testid="performance-page">
      {/* Header */}
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Performans
        </h1>
        <p className="text-slate-500 mt-1">
          {data?.start_date && data?.end_date
            ? `${formatDate(data.start_date)} - ${formatDate(data.end_date)}`
            : ""}
        </p>
      </header>

      {/* Period Toggle */}
      <div className="flex gap-2 mb-5">
        <Button
          variant={period === "weekly" ? "default" : "outline"}
          onClick={() => setPeriod("weekly")}
          className={`flex-1 ${period === "weekly" ? "bg-blue-600" : ""}`}
          data-testid="weekly-toggle"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Haftalık
        </Button>
        <Button
          variant={period === "monthly" ? "default" : "outline"}
          onClick={() => setPeriod("monthly")}
          className={`flex-1 ${period === "monthly" ? "bg-blue-600" : ""}`}
          data-testid="monthly-toggle"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Aylık
        </Button>
      </div>

      {/* Dönem Raporu İndir Butonu */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full mb-5 h-12 border-blue-200 hover:bg-blue-50 text-blue-700"
            data-testid="period-report-button"
          >
            <FileDown className="w-5 h-5 mr-2" />
            Dönem Raporu İndir
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-600" />
              Dönem Raporu İndir
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-slate-500">
              Performans özeti, günlük detaylar ve tahsilat bilgilerini içeren profesyonel PDF raporu indirin.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleDownloadPeriodReport("weekly")}
                disabled={downloadingPdf}
                className="h-16 flex flex-col items-center justify-center gap-1 bg-green-600 hover:bg-green-700"
                data-testid="download-weekly-report"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Haftalık Rapor</span>
                <span className="text-xs opacity-80">Bu hafta</span>
              </Button>
              <Button
                onClick={() => handleDownloadPeriodReport("monthly")}
                disabled={downloadingPdf}
                className="h-16 flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700"
                data-testid="download-monthly-report"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Aylık Rapor</span>
                <span className="text-xs opacity-80">Bu ay</span>
              </Button>
            </div>
            {downloadingPdf && (
              <p className="text-center text-sm text-slate-500 animate-pulse">
                Rapor hazırlanıyor...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Visit Rate Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Ziyaret Oranı</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              %{data?.visit_performance?.visit_rate || 0}
            </span>
            {data?.visit_performance?.visit_rate >= 80 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500 mb-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mb-1" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {data?.visit_performance?.total_completed || 0}/{data?.visit_performance?.total_planned || 0} ziyaret
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Banknote className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Toplam Tahsilat</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(data?.payment_performance?.total_amount || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {data?.payment_performance?.customer_count || 0} müşteriden
          </p>
        </div>

        {/* New Customers Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">Yeni Müşteri</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.customer_acquisition?.new_count || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {period === "weekly" ? "Bu hafta" : "Bu ay"} eklenen
          </p>
        </div>

        {/* Payment Rate Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Tahsilat Oranı</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              %{data?.payment_performance?.payment_rate || 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ziyaret edilen müşterilerden
          </p>
        </div>

        {/* FAZ 2: Ortalama Ziyaret Süresi */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-600" />
            </div>
            <span className="text-xs text-slate-500">Ort. Ziyaret Süresi</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {data?.visit_quality?.duration?.average_minutes != null 
                ? `${data.visit_quality.duration.average_minutes} dk`
                : "-"
              }
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {data?.visit_quality?.duration?.total_measured || 0} ölçüm
          </p>
        </div>

        {/* FAZ 2: Ortalama Kalite */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs text-slate-500">Ort. Kalite</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {data?.visit_quality?.rating?.average_rating != null 
                ? `${data.visit_quality.rating.average_rating}/5`
                : "-"
              }
            </span>
            {data?.visit_quality?.rating?.average_rating && (
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 mb-1" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {data?.visit_quality?.rating?.total_rated || 0} değerlendirme
          </p>
        </div>
      </div>

      {/* FAZ 2: Ziyaret Süresi Uyarıları */}
      {data?.visit_quality?.duration?.total_measured > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Çok Kısa Ziyaretler */}
          <div className={`bg-white rounded-xl p-3 border shadow-sm ${
            data.visit_quality.duration.short_visits > 0 
              ? "border-orange-200 bg-orange-50" 
              : "border-slate-100"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-4 h-4 ${
                data.visit_quality.duration.short_visits > 0 
                  ? "text-orange-500" 
                  : "text-slate-400"
              }`} />
              <span className="text-xs text-slate-600">Çok Kısa (&lt;5dk)</span>
            </div>
            <span className={`text-xl font-bold ${
              data.visit_quality.duration.short_visits > 0 
                ? "text-orange-600" 
                : "text-slate-700"
            }`}>
              {data.visit_quality.duration.short_visits}
            </span>
          </div>
          
          {/* Çok Uzun Ziyaretler */}
          <div className={`bg-white rounded-xl p-3 border shadow-sm ${
            data.visit_quality.duration.long_visits > 0 
              ? "border-blue-200 bg-blue-50" 
              : "border-slate-100"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-4 h-4 ${
                data.visit_quality.duration.long_visits > 0 
                  ? "text-blue-500" 
                  : "text-slate-400"
              }`} />
              <span className="text-xs text-slate-600">Çok Uzun (&gt;60dk)</span>
            </div>
            <span className={`text-xl font-bold ${
              data.visit_quality.duration.long_visits > 0 
                ? "text-blue-600" 
                : "text-slate-700"
            }`}>
              {data.visit_quality.duration.long_visits}
            </span>
          </div>
        </div>
      )}

      {/* Daily Performance Chart */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          Günlük Performans
        </h3>
        {data?.daily_breakdown && data.daily_breakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.daily_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11 }} 
                stroke="#94A3B8"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#fff", 
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return formatDate(payload[0].payload.date);
                  }
                  return value;
                }}
              />
              <Bar dataKey="completed" fill="#3B82F6" name="Ziyaret" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400">
            Veri yok
          </div>
        )}
      </div>

      {/* Visit Skip Reasons */}
      {visitSkipData.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-red-500" />
            Ziyaret Edilmeme Nedenleri
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPie>
              <Pie
                data={visitSkipData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {visitSkipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Skip Reasons */}
      {paymentSkipData.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-500" />
            Tahsilat Yapılmama Nedenleri
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPie>
              <Pie
                data={paymentSkipData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {paymentSkipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: "11px" }}
              />
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      )}

      {/* Price Status Analysis */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-600" />
          Fiyat Politikası Analizi
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* İskontolu */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-200 text-amber-800 rounded">
                İSK
              </span>
              <span className="text-sm font-medium text-amber-800">İskontolu</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-amber-700">
                <span className="font-semibold">{data?.price_analysis?.iskontolu?.customer_count || 0}</span> müşteri
              </p>
              <p className="text-amber-700">
                %<span className="font-semibold">{data?.price_analysis?.iskontolu?.visit_rate || 0}</span> ziyaret
              </p>
              <p className="text-amber-700">
                <span className="font-semibold">{formatCurrency(data?.price_analysis?.iskontolu?.total_payment || 0)}</span>
              </p>
            </div>
          </div>
          
          {/* Standart */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-200 text-blue-800 rounded">
                STD
              </span>
              <span className="text-sm font-medium text-blue-800">Standart</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-blue-700">
                <span className="font-semibold">{data?.price_analysis?.standart?.customer_count || 0}</span> müşteri
              </p>
              <p className="text-blue-700">
                %<span className="font-semibold">{data?.price_analysis?.standart?.visit_rate || 0}</span> ziyaret
              </p>
              <p className="text-blue-700">
                <span className="font-semibold">{formatCurrency(data?.price_analysis?.standart?.total_payment || 0)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Customers List */}
      {data?.customer_acquisition?.new_customers?.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Yeni Müşteriler ({data.customer_acquisition.new_count})
          </h3>
          <div className="space-y-2">
            {data.customer_acquisition.new_customers.map((customer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-purple-900">{customer.name}</p>
                  <p className="text-sm text-purple-600">{customer.region}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  customer.price_status === "İskontolu"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {customer.price_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
