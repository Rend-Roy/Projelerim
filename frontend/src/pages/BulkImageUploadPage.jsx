import { useState, useRef } from "react";
import axios from "axios";
import { 
  ImagePlus, Upload, CheckCircle, AlertCircle, X, 
  FileImage, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

export default function BulkImageUploadPage() {
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  
  // Cloudinary credentials (fetched from backend)
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null);

  const fetchCloudinarySignature = async () => {
    try {
      const res = await axios.get(`${API}/cloudinary/signature?folder=products`);
      setCloudinaryConfig(res.data);
      return res.data;
    } catch (error) {
      console.error("Error getting Cloudinary signature:", error);
      toast.error("Cloudinary yapılandırması alınamadı");
      return null;
    }
  };

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
      // Remove extension and parse product_code
      // Supports: ABC123.jpg, ABC123_1.jpg, ABC123_2.png
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const productCode = nameWithoutExt.split("_")[0];
      
      return {
        file,
        name: file.name,
        productCode,
        status: "pending", // pending, uploading, success, error
        url: null,
        error: null
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

  const uploadToCloudinary = async (file, config) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", config.api_key);
    formData.append("timestamp", config.timestamp);
    formData.append("signature", config.signature);
    formData.append("folder", config.folder);
    
    const response = await fetch(
      `${CLOUDINARY_UPLOAD_URL}/${config.cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error("Cloudinary upload failed");
    }
    
    const data = await response.json();
    return data.secure_url;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Lütfen görsel seçin");
      return;
    }

    setUploading(true);
    setProgress(0);
    
    // Get fresh Cloudinary signature
    const config = await fetchCloudinarySignature();
    if (!config) {
      setUploading(false);
      return;
    }

    const uploadedImages = [];
    const totalFiles = files.length;
    
    // Upload each file to Cloudinary
    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i];
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: "uploading" } : f
      ));
      
      try {
        const url = await uploadToCloudinary(fileObj.file, config);
        
        // Update status to success
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: "success", url } : f
        ));
        
        uploadedImages.push({
          product_code: fileObj.productCode,
          url
        });
        
      } catch (error) {
        console.error("Upload error:", error);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: "error", error: "Yükleme hatası" } : f
        ));
      }
      
      setProgress(((i + 1) / totalFiles) * 100);
    }

    // Match images with products in backend
    if (uploadedImages.length > 0) {
      try {
        const matchRes = await axios.post(`${API}/products/match-images`, uploadedImages);
        setResults(matchRes.data);
        
        if (matchRes.data.matched_count > 0) {
          toast.success(`${matchRes.data.matched_count} görsel eşleştirildi`);
        }
        if (matchRes.data.unmatched_count > 0) {
          toast.warning(`${matchRes.data.unmatched_count} görsel eşleştirilemedi`);
        }
      } catch (error) {
        console.error("Match error:", error);
        toast.error("Eşleştirme hatası");
      }
    }

    setUploading(false);
  };

  return (
    <MobileLayout title="Toplu Görsel Yükle" showBackButton data-testid="bulk-image-upload-page">
      <div className="p-4 space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Görsel Eşleştirme Kuralları
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Dosya adı = Ürün Kodu olmalı</li>
            <li>• Örnek: <code className="bg-blue-100 px-1 rounded">ABC123.jpg</code></li>
            <li>• Çoklu görsel: <code className="bg-blue-100 px-1 rounded">ABC123_1.jpg</code>, <code className="bg-blue-100 px-1 rounded">ABC123_2.jpg</code></li>
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
                      fileObj.status === "error" ? "bg-red-50" :
                      fileObj.status === "uploading" ? "bg-blue-50" :
                      "bg-slate-50"
                    }`}
                  >
                    {fileObj.status === "uploading" ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : fileObj.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
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
            {/* Matched */}
            {results.matched?.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Eşleşen ({results.matched_count})
                </h3>
                <div className="space-y-1 text-sm text-green-700">
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
                <div className="space-y-1 text-sm text-orange-700">
                  {results.unmatched.map((item, idx) => (
                    <p key={idx}>
                      ✗ {item.product_code} - {item.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
