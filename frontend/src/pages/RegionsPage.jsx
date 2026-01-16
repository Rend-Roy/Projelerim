import { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Plus, ChevronRight, Trash2, Edit2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RegionsPage() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/regions`);
      
      // Get customer counts for each region
      const regionsWithCounts = await Promise.all(
        res.data.map(async (region) => {
          try {
            const detailRes = await axios.get(`${API}/regions/${region.id}`);
            return { ...region, customer_count: detailRes.data.customer_count || 0 };
          } catch {
            return { ...region, customer_count: 0 };
          }
        })
      );
      
      setRegions(regionsWithCounts);
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast.error("Bölgeler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const openAddDialog = () => {
    setSelectedRegion(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (region, e) => {
    e.stopPropagation();
    setSelectedRegion(region);
    setFormData({ name: region.name, description: region.description || "" });
    setDialogOpen(true);
  };

  const openDeleteDialog = (region, e) => {
    e.stopPropagation();
    setSelectedRegion(region);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Bölge adı zorunludur");
      return;
    }

    setSaving(true);
    try {
      if (selectedRegion) {
        await axios.put(`${API}/regions/${selectedRegion.id}`, formData);
        toast.success("Bölge güncellendi");
      } else {
        await axios.post(`${API}/regions`, formData);
        toast.success("Bölge eklendi");
      }
      setDialogOpen(false);
      fetchRegions();
    } catch (error) {
      console.error("Error saving region:", error);
      const errorMsg = error.response?.data?.detail || "Kaydetme sırasında hata oluştu";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRegion) return;

    setDeleting(true);
    try {
      await axios.delete(`${API}/regions/${selectedRegion.id}`);
      toast.success("Bölge silindi");
      setDeleteDialogOpen(false);
      fetchRegions();
    } catch (error) {
      console.error("Error deleting region:", error);
      const errorMsg = error.response?.data?.detail || "Silme sırasında hata oluştu";
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 pt-6" data-testid="regions-page">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Bölgeler
            </h1>
            <p className="text-slate-500 mt-1">
              Toplam {regions.length} bölge
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="add-region-button"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ekle
          </Button>
        </div>
      </div>

      {/* Region List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : regions.length === 0 ? (
        <div
          className="bg-white rounded-xl p-8 border border-slate-100 text-center"
          data-testid="empty-state"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">
            Henüz bölge yok
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Müşterilerinizi organize etmek için bölge ekleyin
          </p>
          <Button onClick={openAddDialog} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            İlk Bölgeyi Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3" data-testid="region-list">
          {regions.map((region) => (
            <div
              key={region.id}
              onClick={() => navigate(`/regions/${region.id}`)}
              className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              data-testid={`region-item-${region.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{region.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      {region.customer_count || 0} müşteri
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEditDialog(region, e)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    data-testid={`edit-region-${region.id}`}
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={(e) => openDeleteDialog(region, e)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    data-testid={`delete-region-${region.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
              {region.description && (
                <p className="text-sm text-slate-500 mt-2 ml-15">
                  {region.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRegion ? "Bölge Düzenle" : "Yeni Bölge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Bölge Adı *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kadıköy"
                className="h-11"
                data-testid="region-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Açıklama
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bölge hakkında notlar..."
                className="min-h-[80px] resize-none"
                data-testid="region-description-input"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="save-region-button"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : selectedRegion ? (
                "Güncelle"
              ) : (
                "Bölge Ekle"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bölgeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedRegion?.name}" bölgesini silmek istediğinizden emin misiniz?
              {selectedRegion?.customer_count > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Bu bölgede {selectedRegion.customer_count} müşteri var. 
                  Önce müşterileri başka bölgeye taşımalısınız.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
              data-testid="confirm-delete-region"
            >
              {deleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
