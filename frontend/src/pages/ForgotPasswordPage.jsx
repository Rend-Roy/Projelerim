import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("E-posta adresi gerekli");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Şifre sıfırlama bağlantısı gönderildi");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.response?.data?.detail || "İşlem başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Şifremi Unuttum</h1>
          <p className="text-slate-500 mt-1">
            E-posta adresinize sıfırlama bağlantısı göndereceğiz
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
          {sent ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                E-posta Gönderildi!
              </h2>
              <p className="text-slate-500 mb-6">
                <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                Lütfen e-postanızı kontrol edin.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                E-posta gelmedi mi? Spam klasörünü kontrol edin veya tekrar deneyin.
              </p>
              <Button
                onClick={() => setSent(false)}
                variant="outline"
                className="w-full h-12"
              >
                Tekrar Dene
              </Button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                data-testid="submit-button"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gönderiliyor...
                  </div>
                ) : (
                  "Sıfırlama Bağlantısı Gönder"
                )}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
