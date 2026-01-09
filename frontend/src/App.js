import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileLayout from "@/components/MobileLayout";
import TodayPage from "@/pages/TodayPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import CustomerFormPage from "@/pages/CustomerFormPage";
import PerformancePage from "@/pages/PerformancePage";
import RegionsPage from "@/pages/RegionsPage";
import RegionDetailPage from "@/pages/RegionDetailPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes (Auth) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Routes>
                      <Route path="/" element={<TodayPage />} />
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/regions" element={<RegionsPage />} />
                      <Route path="/regions/:id" element={<RegionDetailPage />} />
                      <Route path="/performance" element={<PerformancePage />} />
                      <Route path="/customer/:id" element={<CustomerDetailPage />} />
                      <Route path="/customer/new" element={<CustomerFormPage />} />
                      <Route path="/customer/:id/edit" element={<CustomerFormPage />} />
                    </Routes>
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
