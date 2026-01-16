import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, Users, PlusCircle, BarChart3, MapPin, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SideDrawer from "@/components/SideDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Bugün", icon: CalendarCheck },
  { path: "/customers", label: "Müşteriler", icon: Users },
  { path: "/customer/new", label: "Ekle", icon: PlusCircle, highlight: true },
  { path: "/regions", label: "Bölgeler", icon: MapPin },
  { path: "/performance", label: "Performans", icon: BarChart3 },
];

export default function MobileLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50 flex flex-col">
      {/* Side Drawer */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Top Header with User Info */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Left - Hamburger Menu */}
        <button 
          onClick={() => setDrawerOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          data-testid="hamburger-menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        
        {/* Center - Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Saha Yönetim Logo" 
            className="w-8 h-8"
          />
          <span className="font-semibold text-slate-900">Saha Yönetim</span>
        </div>
        
        {/* Right - User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      {/* Bottom Navigation */}
      <nav
        className="bottom-nav fixed bottom-0 left-0 right-0 border-t border-slate-100 safe-area-bottom"
        style={{ zIndex: 99999 }}
        data-testid="bottom-navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center -mt-6 relative"
                  style={{ zIndex: 100000 }}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <div className="fab w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-slate-500 mt-1">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] transition-colors ${
                  active ? "text-blue-600" : "text-slate-400"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`w-6 h-6 ${active ? "stroke-[2.5px]" : ""}`} />
                <span className={`text-xs mt-1 ${active ? "font-medium" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
