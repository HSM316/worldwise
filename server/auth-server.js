import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

const PORT = Number(process.env.AUTH_PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";
const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d";

const USERS = [
  {
    id: 1,
    name: "Jack",
    email: "jack@example.com",
    password: "qwerty",
    avatar: "https://i.pravatar.cc/100?u=zz",
  },
];

function sanitizeUser(user) {
  const { password: _password, ...safe } = user;
  return safe;
}

function signAccessToken(user) {
  return jwt.sign({ sub: String(user.id) }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user.id) }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function getTokenFromCookies(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((pair) => {
      const [key, ...rest] = pair.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  return cookies[name] ?? null;
}

function requireAuthWithAccessToken(req, res, next) {
  const token = getTokenFromCookies(req, "accessToken") ?? getBearerToken(req);
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const user = USERS.find((u) => u.email === email);
  if (!user || user.password !== password)
    return res.status(401).json({ message: "Invalid email or password" });

  const isProduction = process.env.NODE_ENV === "production";
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: sanitizeUser(user) });
});

app.get("/api/auth/profile", requireAuthWithAccessToken, (req, res) => {
  const user = USERS.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ message: "User not found" });
  res.json({ user: sanitizeUser(user) });
});

app.post("/api/auth/refresh", (req, res) => {
  const refreshToken = getTokenFromCookies(req, "refreshToken");
  if (!refreshToken)
    return res.status(401).json({ message: "Missing refresh token" });

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const user = USERS.find((u) => u.id === Number(payload.sub));
    if (!user) return res.status(401).json({ message: "User not found" });

    const isProduction = process.env.NODE_ENV === "production";
    const newAccessToken = signAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.status(204).end();
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
