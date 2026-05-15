import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SetupPage from "./pages/SetupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { getStatus } from "./services/api.js";

function AppRoutes() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getStatus();
        if (cancelled) return;
        setSetupComplete(Boolean(status.setupComplete));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e?.response?.data?.error ||
            e?.message ||
            "Could not reach MemoryBridge. Is the API running?"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.state?.editSetup]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center text-lg text-[var(--color-text-muted)]">
          Loading MemoryBridge…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="max-w-lg text-center text-lg text-[var(--color-text)]">
          {error}
        </p>
        <button
          type="button"
          className="min-h-[52px] rounded-full bg-[var(--color-primary)] px-8 text-lg font-semibold text-white"
          onClick={() => window.location.reload()}
          aria-label="Retry loading MemoryBridge"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route
        path="/"
        element={
          setupComplete ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          setupComplete ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
