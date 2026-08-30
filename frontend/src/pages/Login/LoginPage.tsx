import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { login as loginApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
const navigate = useNavigate();

const { login } = useAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);

const [errors, setErrors] = useState({
  email: "",
  password: "",
});

const [error, setError] = useState("");

async function handleLogin() {
  const newErrors = {
    email:
      email === ""
        ? "Email is required."
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? ""
        : "Please enter a valid email.",

    password:
      password === ""
        ? "Password is required."
        : "",
  };

  setErrors(newErrors);

  if (Object.values(newErrors).some((value) => value !== "")) {
    return;
  }

  try {
    setLoading(true);
    setError("");

    const response = await loginApi({
      email,
      password,
    });

    login(response.access_token);

    navigate("/dashboard");

  } catch (err: any) {
  setError(
    err.response?.data?.detail ||
    "Invalid email or password."
  );

  console.error(err);
} finally {
    setLoading(false);
  }
}

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Background Glow */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg">

        <Card>

          {/* Logo */}
          <div className="mb-10 flex flex-col items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-cyan-500/20 sm:h-24 sm:w-24">

              <BarChart3 className="h-10 w-10 text-white sm:h-12 sm:w-12" />

            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              BizInsight
            </h1>

          </div>

          {/* Form */}
          <div className="space-y-6">

            <Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => {
    const value = e.target.value;

    setEmail(value);

    setErrors((prev) => ({
      ...prev,
      email:
        value === ""
          ? "Email is required."
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Please enter a valid email.",
    }));
  }}
  error={errors.email}
/>


              <Input
  label="Password"
  type="password"
  placeholder="Enter your password"
  value={password}
  onChange={(e) => {
    const value = e.target.value;

    setPassword(value);

    setErrors((prev) => ({
      ...prev,
      password:
        value === ""
          ? "Password is required."
          : "",
    }));
  }}
  error={errors.password}
/>
<div className="flex justify-end -mt-3">
  <Link
    to="/forgot-password"
    className="text-sm font-semibold text-teal-600 transition hover:text-teal-700"
  >
    Forgot password?
  </Link>
</div>
             {error && (
  <p className="text-sm text-red-500 text-center">
    {error}
  </p>
)}
           <Button
  onClick={handleLogin}
  disabled={loading}
>
  {loading ? "Signing In..." : "Sign In"}
</Button>

          </div>

          {/* Register */}
          <div className="mt-8 text-center">

            <p className="text-sm text-slate-500">
  New to BizInsight?{" "}

  <Link
    to="/company-register"
    className="font-semibold text-teal-600 transition hover:text-teal-700"
  >
    Create Company
  </Link>
</p>

          </div>

        </Card>

      </div>

    </div>
  );
}

export default LoginPage;