import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL = "http://127.0.0.1:8000";

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

      // No token = not logged in
      if (!storedToken) {
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

        // Token expired / invalid
        if (response.status === 401) {
          console.log(
            "Session expired. Logging out..."
          );

          localStorage.removeItem(
            "access_token"
          );

          setToken(null);

          return;
        }

        // Other server error
        if (!response.ok) {
          console.error(
            "Session validation failed:",
            response.status
          );

          return;
        }

        console.log(
          "Existing session is valid."
        );

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