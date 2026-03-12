import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: "" };

    case "login/success":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: "",
      };

    case "restore/success":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: "",
      };

    case "error":
      return { ...state, isLoading: false, error: action.payload };

    case "logout":
      return { ...initialState };

    default:
      throw new Error("Unknown action");
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  const [{ user, isAuthenticated, isLoading, error }, dispatch] = useReducer(
    reducer,
    initialState,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function restoreSession() {
      dispatch({ type: "loading" });
      try {
        let res = await fetch("/api/auth/profile", {
          credentials: "include",
          signal: controller.signal,
        });

        let data = await safeJson(res);

        if (res.status === 401) {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            signal: controller.signal,
          });

          if (refreshRes.ok) {
            res = await fetch("/api/auth/profile", {
              credentials: "include",
              signal: controller.signal,
            });
            data = await safeJson(res);
          }
        }

        if (!res.ok) throw new Error(data?.message ?? "Session expired");

        dispatch({
          type: "restore/success",
          payload: { user: data.user },
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        dispatch({
          type: "error",
          payload: err?.message ?? "Failed to restore session",
        });
      }
    }

    restoreSession();
    return () => controller.abort();
  }, []);

  async function login(email, password) {
    dispatch({ type: "loading" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message ?? "Login failed");

      dispatch({
        type: "login/success",
        payload: { user: data.user },
      });
      return true;
    } catch (err) {
      dispatch({ type: "error", payload: err?.message ?? "Login failed" });
      return false;
    }
  }

  function logout() {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    dispatch({ type: "logout" });
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
    }),
    [user, isAuthenticated, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
