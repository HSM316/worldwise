import styles from "./Login.module.css";
import { useState, useEffect } from "react";
import PageNav from "../components/PageNav";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function Login() {
  // PRE-FILL FOR DEV PURPOSES
  const [email, setEmail] = useState("jack@example.com");
  const [password, setPassword] = useState("qwerty");
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  }

  useEffect(
    function () {
      if (isAuthenticated) navigate("/app", { replace: true });
    },
    [isAuthenticated, navigate],
  );

  return (
    <main className={styles.login}>
      <PageNav />
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            disabled={isLoading}
          />
        </div>

        <div className={styles.row}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            disabled={isLoading}
          />
        </div>

        <div>
          <Button type="primary">
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          {error ? <p style={{ color: "var(--color-brand--2)" }}>{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
