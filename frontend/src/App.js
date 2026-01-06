import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import MobileLayout from "@/components/MobileLayout";
import TodayPage from "@/pages/TodayPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import CustomerFormPage from "@/pages/CustomerFormPage";
import PerformancePage from "@/pages/PerformancePage";
import RegionsPage from "@/pages/RegionsPage";
import RegionDetailPage from "@/pages/RegionDetailPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
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
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
