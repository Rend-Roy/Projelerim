import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Car, BarChart3, Fuel, Settings, Package, ImagePlus, FolderOpen } from "lucide-react";

export default function SideDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      section: "Ürün Kataloğu",
      items: [
        {
          icon: Package,
          label: "Ürün Kataloğu",
          path: "/products",
          description: "Ürünleri görüntüle ve yönet"
        },
        {
          icon: FolderOpen,
          label: "Kategoriler",
          path: "/categories",
          description: "Kategori yönetimi"
        },
        {
          icon: ImagePlus,
          label: "Toplu Görsel Yükle",
          path: "/products/upload-images",
          description: "Ürün görselleri yükle"
        },
      ]
    },
    {
      section: "Araç & Yakıt",
      items: [
        {
          icon: Car,
          label: "Araç & Yakıt Takibi",
          path: "/vehicles",
          description: "Araçlar ve yakıt kayıtları"
        },
        {
          icon: BarChart3,
          label: "Günlük KM Kayıtları",
          path: "/daily-km",
          description: "Günlük kilometre takibi"
        },
      ]
    }
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-[101] transform transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.svg" 
              alt="Saha Yönetim Logo" 
              className="w-8 h-8"
            />
            <span className="font-semibold text-slate-900">Saha Yönetim</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Menu Sections */}
        <div className="p-3 space-y-4">
          {menuItems.map((section) => (
            <div key={section.section}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      data-testid={`menu-${item.path.replace(/\//g, '-').slice(1)}`}
                    >
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 mt-4">
          <p className="text-xs text-slate-400 text-center">
            FAZ 4 & 5 Modülleri
          </p>
        </div>
      </div>
    </>
  );
}
