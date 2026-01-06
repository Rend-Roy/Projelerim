import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Search, Users, MapPin, ChevronRight, Plus, Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("Sadece Excel dosyaları (.xlsx, .xls) kabul edilir");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(`${API}/customers/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success(res.data.message);
      
      if (res.data.errors && res.data.errors.length > 0) {
        toast.warning(`${res.data.errors.length} satırda hata var`);
      }
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      fetchCustomers();
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMsg = error.response?.data?.detail || "Dosya yüklenirken hata oluştu";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/customers/template`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "musteri_sablonu.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Şablon indirildi");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Şablon indirilemedi");
    }
  };

  return (
    <div className="p-4 pt-6" data-testid="customers-page">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Müşteriler
            </h1>
            <p className="text-slate-500 mt-1">
              Toplam {customers.length} müşteri
            </p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            data-testid="upload-excel-button"
          >
            <Upload className="w-4 h-4" />
            Excel Yükle
          </Button>
        </div>
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
              : "Excel dosyası ile toplu yükleme yapabilirsiniz"}
          </p>
          {!searchQuery && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setUploadDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                data-testid="upload-excel-empty"
              >
                <Upload className="w-4 h-4" />
                Excel ile Yükle
              </button>
              <button
                onClick={() => navigate("/customer/new")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors"
                data-testid="add-first-customer"
              >
                <Plus className="w-4 h-4" />
                Tekli Ekle
              </button>
            </div>
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      customer.price_status === "İskontolu" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      <span className={`font-semibold text-sm ${
                        customer.price_status === "İskontolu" ? "text-amber-600" : "text-blue-600"
                      }`}>
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 truncate">
                          {customer.name}
                        </h3>
                        {customer.price_status === "İskontolu" && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                            İSK
                          </span>
                        )}
                      </div>
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

      {/* Excel Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Excel ile Müşteri Yükle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
              <p className="font-medium mb-2">Gerekli sütunlar:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Müşteri Adı</span> (zorunlu)</li>
                <li><span className="font-medium">Bölge</span> (zorunlu)</li>
                <li>Telefon, Adres, Fiyat Statüsü, Ziyaret Günleri (opsiyonel)</li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2"
              data-testid="download-template"
            >
              <Download className="w-4 h-4" />
              Örnek Şablon İndir
            </Button>

            <div className="border-t pt-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls"
                className="hidden"
                data-testid="file-input"
              />
              
              {selectedFile ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className="flex-1 text-sm text-green-700 truncate">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-green-100 rounded"
                  >
                    <X className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  data-testid="select-file-button"
                >
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">Dosya Seç</span>
                    <span className="text-xs">.xlsx veya .xls</span>
                  </div>
                </button>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="upload-button"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Yükleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Müşterileri Yükle
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
