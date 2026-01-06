import { useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, Users, PlusCircle } from "lucide-react";

const navItems = [
  { path: "/", label: "Bugün", icon: CalendarCheck },
  { path: "/customers", label: "Müşteriler", icon: Users },
  { path: "/customer/new", label: "Ekle", icon: PlusCircle, highlight: true },
];

export default function MobileLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50 flex flex-col">
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
