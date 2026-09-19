import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_URL } from "../api/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = (accessToken) => {
    localStorage.setItem(
      "access_token",
      accessToken
    );

    setToken(accessToken);
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setToken(null);
  };

  // =========================================================
  // VALIDATE EXISTING SESSION
  // =========================================================

  useEffect(() => {
    const validateToken = async () => {
      const storedToken =
        localStorage.getItem("access_token");

      // No token = user is not logged in
      if (!storedToken) {
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        // =====================================================
        // TOKEN EXPIRED / INVALID
        // =====================================================

        if (response.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          setToken(null);

          return;
        }

        // =====================================================
        // OTHER SERVER ERROR
        // =====================================================

        if (!response.ok) {
          console.error(
            "Session validation failed:",
            response.status
          );

          return;
        }

        // Token is valid.
        // Keep the existing token.
      } catch (error) {
        console.error(
          "SESSION VALIDATION ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}