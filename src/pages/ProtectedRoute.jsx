import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import SpinnerFullPage from "../components/SpinnerFullPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(
    function () {
      if (!isLoading && !isAuthenticated) navigate("/login");
    },
    [isAuthenticated, isLoading, navigate],
  );

  if (isLoading) return <SpinnerFullPage />;
  return isAuthenticated ? children : null;
}

export default ProtectedRoute;
