import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/router";

interface User {
  id: string;        // Nên thêm ID
  email: string;
  full_name: string;
  role: string;      // 👈 THÊM DÒNG NÀY ĐỂ HẾT LỖI
  // user_type: string; // Dòng này có thể xóa nếu không dùng nữa
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async (accessToken: string) => {
    try {
      // Gọi API Backend thật (hoặc mock)
      const res = await axios.get("http://localhost:3001/api/v1/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      logout();
    }
  };

  const login = (accessToken: string) => {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    fetchUser(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_type");
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);