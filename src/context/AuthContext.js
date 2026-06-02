'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/apiConfig';
import { authorizedFetch } from '@/lib/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse auth-user from localStorage', err);
        localStorage.removeItem('auth-user');
      }
    }
  }, []);

  // ✅ Login Function
  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resData = await res.json();
      console.log('resData ========', resData);

      if (resData.statusCode === 200 || resData.status === true) {
        const { Id, Token } = resData.data;
        console.log('Login Success:', resData.data);
        const userInfo = { id: Id, email };

        // Save auth data
        localStorage.setItem('auth-user', JSON.stringify(userInfo));
        document.cookie = `auth-token=${Token}; path=/`;
        setUser(userInfo);

        // ✅ Show success toast
        toast.success('Signed in successfully 🎉');
        router.push('/dashboard');
      } else {
        toast.error('Invalid credentials 😕');
        // throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login Error:', error);
      toast.error('Login failed. Please try again.');
      throw error;
    }
  };

  // ✅ Logout Function
  const logout = async () => {
    try {
      const logoutRes = await authorizedFetch(`/admin/logout`, {
        method: 'POST',
      });

      if (logoutRes.statusCode === 200 && logoutRes.status === true) {
        // Clear everything
        document.cookie = 'auth-token=; Max-Age=0; path=/';
        localStorage.removeItem('auth-user');
        setUser(null);

        toast.success('Logged out successfully 👋');
        router.push('/');
      } else {
        toast.error('Logout failed 😕');
      }
    } catch (err) {
      console.error('Logout Error:', err);
      toast.error('Something went wrong during logout.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
