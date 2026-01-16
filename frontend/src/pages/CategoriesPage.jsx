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

  // Kategoriye tıklama - ürünlere filtreli yönlendir
  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div data-testid="categories-page">
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
            {categories.map((category) => {
              const isEmpty = !category.product_count || category.product_count === 0;
              const isInactive = !category.is_active;
              
              return (
                <div
                  key={category.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${
                    isInactive ? "border-slate-200 bg-slate-50" : 
                    isEmpty ? "border-slate-100 opacity-60" : "border-slate-100"
                  }`}
                  data-testid={`category-item-${category.id}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Tıklanabilir Alan - Kategoriye Git */}
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <div className={`p-2 rounded-lg ${
                        isInactive ? "bg-slate-100" : 
                        isEmpty ? "bg-slate-100" : "bg-blue-50"
                      }`}>
                        <FolderOpen className={`w-5 h-5 ${
                          isInactive ? "text-slate-400" : 
                          isEmpty ? "text-slate-400" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${
                          isInactive || isEmpty ? "text-slate-500" : "text-slate-900"
                        }`}>
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-400 truncate">{category.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs ${isEmpty ? "text-slate-400 italic" : "text-slate-500"}`}>
                            {isEmpty ? "Henüz ürün yok" : `${category.product_count} ürün`}
                          </span>
                          {isInactive && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                              Pasif
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isEmpty ? "text-slate-300" : "text-slate-400"}`} />
                    </div>
                    
                    {/* Düzenleme Butonları */}
                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
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
                        onClick={(e) => {
                          e.stopPropagation();
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
              );
            })}
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
    </div>
  );
}
