import { useState, useRef } from "react";
import axios from "axios";
import { 
  ImagePlus, Upload, CheckCircle, AlertCircle, X, 
  FileImage, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BulkImageUploadPage() {
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Filter only images
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith("image/")
    );
    
    if (imageFiles.length !== selectedFiles.length) {
      toast.warning("Sadece görsel dosyaları kabul edilir");
    }
    
    // Parse product_code from filename
    const parsedFiles = imageFiles.map(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const productCode = nameWithoutExt.split("_")[0];
      
      return {
        file,
        name: file.name,
        productCode,
        status: "pending"
      };
    });
    
    setFiles(prev => [...prev, ...parsedFiles]);
    setResults(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setResults(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Lütfen görsel seçin");
      return;
    }

    setUploading(true);
    setProgress(0);
    
    // FormData ile tüm dosyaları backend'e gönder
    const formData = new FormData();
    files.forEach(fileObj => {
      formData.append("files", fileObj.file);
    });

    try {
      // Tüm dosyaları tek seferde yükle
      setProgress(50);
      
      const response = await axios.post(`${API}/upload-images-bulk`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percentCompleted, 90));
        }
      });
      
      setProgress(100);
      setResults(response.data);
      
      // Dosya durumlarını güncelle
      const matchedCodes = new Set(response.data.matched?.map(m => m.product_code) || []);
      const unmatchedCodes = new Set(response.data.unmatched?.map(u => u.product_code) || []);
      const errorFiles = new Set(response.data.errors?.map(e => e.file) || []);
      
      setFiles(prev => prev.map(f => ({
        ...f,
        status: errorFiles.has(f.name) ? "error" : 
                matchedCodes.has(f.productCode) ? "success" :
                unmatchedCodes.has(f.productCode) ? "warning" : "success"
      })));
      
      if (response.data.matched_count > 0) {
        toast.success(`${response.data.matched_count} görsel eşleştirildi`);
      }
      if (response.data.unmatched_count > 0) {
        toast.warning(`${response.data.unmatched_count} görsel eşleştirilemedi`);
      }
      if (response.data.error_count > 0) {
        toast.error(`${response.data.error_count} görsel yüklenemedi`);
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.detail || "Yükleme hatası");
      setFiles(prev => prev.map(f => ({ ...f, status: "error" })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="bulk-image-upload-page">
      <div className="p-4 space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Görsel Eşleştirme Kuralları
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Dosya adı = Ürün Kodu olmalı</li>
            <li>• Örnek: <code className="bg-blue-100 px-1 rounded">SNC000001.jpg</code></li>
            <li>• Çoklu görsel: <code className="bg-blue-100 px-1 rounded">SNC000001_1.jpg</code>, <code className="bg-blue-100 px-1 rounded">SNC000001_2.jpg</code></li>
            <li>• Desteklenen formatlar: JPG, PNG, WEBP</li>
          </ul>
        </div>

        {/* File Selection */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            data-testid="image-file-input"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full h-24 border-dashed border-2 flex flex-col gap-2"
            disabled={uploading}
          >
            <FileImage className="w-8 h-8 text-slate-400" />
            <span className="text-slate-600">Görselleri Seçin</span>
          </Button>
          
          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{files.length} dosya seçildi</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700"
                >
                  Temizle
                </Button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((fileObj, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                      fileObj.status === "success" ? "bg-green-50" :
                      fileObj.status === "warning" ? "bg-orange-50" :
                      fileObj.status === "error" ? "bg-red-50" :
                      "bg-slate-50"
                    }`}
                  >
                    {fileObj.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : fileObj.status === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : fileObj.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <FileImage className="w-4 h-4 text-slate-400" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{fileObj.name}</p>
                      <p className="text-xs text-slate-500">Kod: {fileObj.productCode}</p>
                    </div>
                    
                    {fileObj.status === "pending" && !uploading && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Yükleniyor...</span>
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          data-testid="upload-images-btn"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Yükleniyor...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Görselleri Yükle ve Eşleştir
            </>
          )}
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Özet</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-green-600">✓ Yüklenen: {results.uploaded_count}</div>
                <div className="text-green-600">✓ Eşleşen: {results.matched_count}</div>
                <div className="text-orange-600">⚠ Eşleşmeyen: {results.unmatched_count}</div>
                <div className="text-red-600">✗ Hatalı: {results.error_count}</div>
              </div>
            </div>
            
            {/* Matched */}
            {results.matched?.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Eşleşen ({results.matched_count})
                </h3>
                <div className="space-y-1 text-sm text-green-700 max-h-40 overflow-y-auto">
                  {results.matched.map((item, idx) => (
                    <p key={idx}>
                      ✓ {item.product_code} → {item.product_name}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Unmatched */}
            {results.unmatched?.length > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Eşleşmeyen ({results.unmatched_count})
                </h3>
                <div className="space-y-1 text-sm text-orange-700 max-h-40 overflow-y-auto">
                  {results.unmatched.map((item, idx) => (
                    <p key={idx}>
                      ✗ {item.product_code} - {item.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Errors */}
            {results.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Hatalar ({results.error_count})
                </h3>
                <div className="space-y-1 text-sm text-red-700 max-h-40 overflow-y-auto">
                  {results.errors.map((item, idx) => (
                    <p key={idx}>
                      ✗ {item.file} - {item.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
