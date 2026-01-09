import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Axios interceptor for adding token to requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) {
          config.headers.Authorization = `Bearer ${savedToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Check token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const res = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          setUser(res.data);
          setToken(savedToken);
        } catch (error) {
          // Token geçersiz, temizle
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await axios.post(`${API}/auth/login`, {
      email,
      password,
      remember_me: rememberMe
    });
    
    const { token: newToken, user: userData } = res.data;
    
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(`${API}/auth/register`, {
      name,
      email,
      password
    });
    
    const { token: newToken, user: userData } = res.data;
    
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const res = await axios.post(`${API}/auth/forgot-password`, { email });
    return res.data;
  };

  const resetPassword = async (token, newPassword) => {
    const res = await axios.post(`${API}/auth/reset-password`, {
      token,
      new_password: newPassword
    });
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
