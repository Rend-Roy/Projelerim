import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import MobileLayout from "@/components/MobileLayout";
import TodayPage from "@/pages/TodayPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import CustomerFormPage from "@/pages/CustomerFormPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/customers" element={<CustomersPage />} />
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
