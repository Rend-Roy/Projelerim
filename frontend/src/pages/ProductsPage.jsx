import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
  Search, Package, Plus, Filter, Upload, ChevronRight,
  Grid, List, ImageOff
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters - URL'den kategori parametresini oku
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  
  // Excel Upload Dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  
  // New Product Dialog
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_code: "",
    name: "",
    category: "",
    base_price: "",
    unit: "Adet",
    description: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      params.append("limit", "200");
      
      const res = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Ürünler yüklenirken hata oluştu");
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
    fetchCategories();
  }, []);

  // URL'den kategori değişikliğini takip et
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Kategori değişince URL'i güncelle
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    if (value && value !== "all") {
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  };

  // Filtreyi temizle
  const clearFilter = () => {
    setSelectedCategory("");
    setSearchParams({});
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/products/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadResult(res.data);
      toast.success(`${res.data.created} yeni ürün, ${res.data.updated} güncelleme`);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error(error.response?.data?.detail || "Yükleme hatası");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.product_code || !newProduct.name || !newProduct.category) {
      toast.error("Ürün kodu, adı ve kategori zorunludur");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/products`, {
        ...newProduct,
        base_price: parseFloat(newProduct.base_price) || 0
      });
      toast.success("Ürün oluşturuldu");
      setNewProductOpen(false);
      setNewProduct({
        product_code: "",
        name: "",
        category: "",
        base_price: "",
        unit: "Adet",
        description: ""
      });
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Ürün oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout title="Ürün Kataloğu" showBackButton data-testid="products-page">
      <div className="p-4 space-y-4">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı veya kodu ara..."
              className="pl-10 h-11 bg-white"
              data-testid="product-search"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="flex-1 h-10 bg-white" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name} {cat.product_count !== undefined && `(${cat.product_count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-10 w-10"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Aktif filtre badge */}
          {selectedCategory && selectedCategory !== "all" && (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                <span>Kategori: <strong>{selectedCategory}</strong></span>
                <button 
                  onClick={clearFilter}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                  data-testid="clear-filter-btn"
                >
                  ✕
                </button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilter}
                className="text-slate-500 hover:text-slate-700"
              >
                Tüm Ürünler
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{total} ürün</span>
          <span>{categories.length} kategori</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-blue-600 hover:bg-blue-700" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Ürün
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Ürün Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <Input
                  placeholder="Ürün Kodu *"
                  value={newProduct.product_code}
                  onChange={(e) => setNewProduct({...newProduct, product_code: e.target.value})}
                  data-testid="new-product-code"
                />
                <Input
                  placeholder="Ürün Adı *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  data-testid="new-product-name"
                />
                <Input
                  placeholder="Kategori *"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  list="categories-list"
                  data-testid="new-product-category"
                />
                <datalist id="categories-list">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
                <Input
                  type="number"
                  placeholder="Fiyat (TL)"
                  value={newProduct.base_price}
                  onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                  data-testid="new-product-price"
                />
                <Select 
                  value={newProduct.unit} 
                  onValueChange={(v) => setNewProduct({...newProduct, unit: v})}
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
                  placeholder="Açıklama (opsiyonel)"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
                <Button 
                  onClick={handleCreateProduct} 
                  disabled={saving}
                  className="w-full bg-blue-600"
                  data-testid="save-new-product"
                >
                  {saving ? "Kaydediliyor..." : "Ürün Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10" data-testid="excel-upload-btn">
                <Upload className="w-4 h-4 mr-2" />
                Excel Yükle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excel'den Ürün Yükle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-500">
                  Excel dosyanızda şu kolonlar olmalı:<br/>
                  <code className="text-xs bg-slate-100 px-1 rounded">
                    product_code | product_name | category | price | unit | description
                  </code>
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={uploading}
                  className="w-full text-sm"
                  data-testid="excel-file-input"
                />
                {uploading && <p className="text-sm text-blue-600 animate-pulse">Yükleniyor...</p>}
                {uploadResult && (
                  <div className="text-sm space-y-1 p-3 bg-slate-50 rounded-lg">
                    <p className="text-green-600">✓ {uploadResult.created} yeni ürün oluşturuldu</p>
                    <p className="text-blue-600">↻ {uploadResult.updated} ürün güncellendi</p>
                    {uploadResult.categories_created?.length > 0 && (
                      <p className="text-purple-600">+ {uploadResult.categories_created.length} yeni kategori</p>
                    )}
                    {uploadResult.errors?.length > 0 && (
                      <p className="text-red-600">⚠ {uploadResult.errors.length} hatalı satır</p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Ürün bulunamadı</p>
            <p className="text-sm text-slate-400 mt-1">
              Excel ile toplu yükleyin veya manuel ekleyin
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                data-testid={`product-card-${product.id}`}
              >
                <div className="aspect-square bg-slate-100 relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-400 mb-1">{product.product_code}</p>
                  <h3 className="font-medium text-slate-900 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold">
                      {product.base_price?.toLocaleString("tr-TR")} ₺
                    </span>
                    <span className="text-xs text-slate-400">{product.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 shadow-sm active:bg-slate-50 cursor-pointer"
                data-testid={`product-row-${product.id}`}
              >
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">{product.product_code}</p>
                  <h3 className="font-medium text-slate-900 truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    {product.base_price?.toLocaleString("tr-TR")} ₺
                  </p>
                  <p className="text-xs text-slate-400">{product.unit}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
