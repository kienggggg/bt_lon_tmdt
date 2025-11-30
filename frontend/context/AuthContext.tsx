import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/router";
// 👇 IMPORT API INSTANCE THAY VÌ AXIOS GỐC
import api from "../services/api"; 

interface User {
  id: string;
  full_name: string;
  role: string;
  email: string;
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
      // 👇 SỬA ĐOẠN NÀY: Dùng api.get thay vì axios.get
      // Không cần truyền header Authorization nữa vì api.ts đã tự làm rồi
      // Không cần gõ http://localhost... nữa vì api.ts đã có baseURL
      const res = await api.get("/users/me"); 
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      logout(); // Token lỗi thì logout luôn
    } finally {
        setLoading(false);
    }
  };

  const login = (accessToken: string) => {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    fetchUser(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
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