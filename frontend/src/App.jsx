import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateInterview from "./pages/CreateInterview";
import Interview from "./pages/Interview";
import InterviewResult from "./pages/InterviewResult";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =====================================================
              PUBLIC ROUTES
          ===================================================== */}

          <Route
            path="/"
            element={<Login />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* =====================================================
              PROTECTED ROUTES
          ===================================================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-interview"
            element={
              <ProtectedRoute>
                <CreateInterview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/:interviewId"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/:interviewId/result"
            element={
              <ProtectedRoute>
                <InterviewResult />
              </ProtectedRoute>
            }
          />

          {/* =====================================================
              FALLBACK ROUTE
          ===================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;