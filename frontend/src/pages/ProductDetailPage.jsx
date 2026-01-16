import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Edit, Trash2, ImageOff, ChevronLeft, ChevronRight,
  Eye, X, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Image slider
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Edit mode
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Presentation mode (Müşteriye Göster)
  const [presentationMode, setPresentationMode] = useState(false);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`);
      setProduct(res.data);
      setEditData(res.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Ürün yüklenemedi");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/products/${id}`, {
        product_code: editData.product_code,
        name: editData.name,
        category: editData.category,
        base_price: parseFloat(editData.base_price) || 0,
        unit: editData.unit,
        description: editData.description
      });
      toast.success("Ürün güncellendi");
      setEditOpen(false);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Güncelleme hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Ürün silindi");
      navigate("/products");
    } catch (error) {
      toast.error("Silme hatası");
    }
  };

  const nextImage = () => {
    if (product?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Yükleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Ürün bulunamadı</p>
      </div>
    );
  }

  // ===== SUNUM MODU =====
  if (presentationMode) {
    return (
      <div 
        className="fixed inset-0 bg-white z-[200] flex flex-col"
        data-testid="presentation-mode"
      >
        {/* Close button */}
        <button
          onClick={() => setPresentationMode(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 rounded-full hover:bg-black/30 transition-colors"
          data-testid="close-presentation"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {/* Image */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {product.images?.length > 0 ? (
            <>
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 p-3 bg-white/20 rounded-full hover:bg-white/30"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 p-3 bg-white/20 rounded-full hover:bg-white/30"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? "bg-white" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-white/50 text-center">
              <ImageOff className="w-20 h-20 mx-auto mb-4" />
              <p>Görsel yok</p>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="bg-white p-6 text-center border-t">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {product.name}
          </h1>
          <p className="text-4xl font-bold text-blue-600">
            {product.base_price?.toLocaleString("tr-TR")} ₺
            <span className="text-lg text-slate-400 font-normal ml-2">
              / {product.unit}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ===== NORMAL GÖRÜNÜM =====
  return (
    <div className="min-h-screen bg-slate-50" data-testid="product-detail-page">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/products")}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              data-testid="edit-product-btn"
            >
              <Edit className="w-4 h-4 mr-1" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="delete-product-btn"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Slider */}
      <div className="relative bg-white">
        <div className="aspect-square bg-slate-100 relative">
          {product.images?.length > 0 ? (
            <>
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 rounded-full hover:bg-black/30"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 rounded-full hover:bg-black/30"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <ImageOff className="w-16 h-16 mx-auto mb-2" />
                <p>Görsel yok</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Image indicators */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentImageIndex ? "bg-blue-600" : "bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-400 mb-1">{product.product_code}</p>
          <h1 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
              {product.category}
            </span>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm">
              {product.unit}
            </span>
          </div>
          
          <div className="text-3xl font-bold text-blue-600">
            {product.base_price?.toLocaleString("tr-TR")} ₺
          </div>
        </div>

        {product.description && (
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-2">Açıklama</h3>
            <p className="text-slate-600 text-sm">{product.description}</p>
          </div>
        )}

        {/* Müşteriye Göster Butonu */}
        <Button
          onClick={() => setPresentationMode(true)}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-lg"
          data-testid="presentation-mode-btn"
        >
          <Eye className="w-5 h-5 mr-2" />
          Müşteriye Göster
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder="Ürün Kodu"
              value={editData.product_code || ""}
              onChange={(e) => setEditData({...editData, product_code: e.target.value})}
            />
            <Input
              placeholder="Ürün Adı"
              value={editData.name || ""}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
            />
            <Input
              placeholder="Kategori"
              value={editData.category || ""}
              onChange={(e) => setEditData({...editData, category: e.target.value})}
              list="edit-categories-list"
            />
            <datalist id="edit-categories-list">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name} />
              ))}
            </datalist>
            <Input
              type="number"
              placeholder="Fiyat (TL)"
              value={editData.base_price || ""}
              onChange={(e) => setEditData({...editData, base_price: e.target.value})}
            />
            <Select 
              value={editData.unit || "Adet"} 
              onValueChange={(v) => setEditData({...editData, unit: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Birim" />
              </SelectTrigger>
              <SelectContent>
                {["Adet", "Kg", "Lt", "Paket", "Kutu", "Koli", "Metre"].map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Açıklama"
              value={editData.description || ""}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
            />
            <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{product.name}" ürününü silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
