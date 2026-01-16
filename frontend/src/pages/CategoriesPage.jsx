import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FolderOpen, Plus, Edit, Trash2, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New category dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  
  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  
  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories?include_inactive=true`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Kategoriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Kategori adı zorunludur");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/categories`, newCategory);
      toast.success("Kategori oluşturuldu");
      setNewOpen(false);
      setNewCategory({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Oluşturma hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCategory?.name.trim()) {
      toast.error("Kategori adı zorunludur");
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/categories/${editCategory.id}`, {
        name: editCategory.name,
        description: editCategory.description,
        is_active: editCategory.is_active
      });
      toast.success("Kategori güncellendi");
      setEditOpen(false);
      setEditCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Güncelleme hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    
    try {
      await axios.delete(`${API}/categories/${deleteCategory.id}`);
      toast.success("Kategori silindi");
      setDeleteOpen(false);
      setDeleteCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Silme hatası");
    }
  };

  const toggleActive = async (category) => {
    try {
      await axios.put(`${API}/categories/${category.id}`, {
        is_active: !category.is_active
      });
      toast.success(category.is_active ? "Kategori pasif yapıldı" : "Kategori aktif yapıldı");
      fetchCategories();
    } catch (error) {
      toast.error("Güncelleme hatası");
    }
  };

  return (
    <MobileLayout title="Kategoriler" showBackButton data-testid="categories-page">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{categories.length} kategori</p>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Kategori</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <Input
                  placeholder="Kategori Adı *"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  data-testid="new-category-name"
                />
                <Input
                  placeholder="Açıklama (opsiyonel)"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                />
                <Button onClick={handleCreate} disabled={saving} className="w-full bg-blue-600">
                  {saving ? "Kaydediliyor..." : "Kategori Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Henüz kategori yok</p>
            <p className="text-sm text-slate-400 mt-1">
              Yeni kategori ekleyin veya ürün yüklerken otomatik oluşturulur
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl border p-4 ${
                  category.is_active ? "border-slate-100" : "border-slate-200 bg-slate-50 opacity-60"
                }`}
                data-testid={`category-item-${category.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${category.is_active ? "bg-blue-50" : "bg-slate-100"}`}>
                      <FolderOpen className={`w-5 h-5 ${category.is_active ? "text-blue-600" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-slate-500 mt-0.5">{category.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {category.product_count || 0} ürün
                        </span>
                        {!category.is_active && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            Pasif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditCategory(category);
                        setEditOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteCategory(category);
                        setDeleteOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      disabled={category.product_count > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <div className="space-y-4 py-4">
              <Input
                placeholder="Kategori Adı"
                value={editCategory.name}
                onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
              />
              <Input
                placeholder="Açıklama"
                value={editCategory.description || ""}
                onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Aktif</span>
                <Switch
                  checked={editCategory.is_active}
                  onCheckedChange={(checked) => setEditCategory({...editCategory, is_active: checked})}
                />
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full bg-blue-600">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategori Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteCategory?.name}" kategorisini silmek istediğinizden emin misiniz?
              {deleteCategory?.product_count > 0 && (
                <span className="block mt-2 text-red-600">
                  Bu kategoride {deleteCategory.product_count} ürün var. Önce ürünleri başka kategoriye taşıyın.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategory?.product_count > 0}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
