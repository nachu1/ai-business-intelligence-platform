import { useState } from "react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { forgotPassword } from "../../api/auth";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await forgotPassword({ email });

      if (response.success) {
        setSent(true);
        toast.success("Password reset link sent.");
      } else {
        setError(response.message || "Unable to send reset link.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to send reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <Card>
          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-cyan-500/20">
              <KeyRound className="h-8 w-8 text-white" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
              Forgot Password?
            </h1>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              Enter your email and we'll send you a password reset link.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <Mail className="mx-auto h-8 w-8 text-emerald-600" />

              <h2 className="mt-3 text-base font-bold text-emerald-800">
                Check your email
              </h2>

              <p className="mt-1 text-sm text-emerald-700">
                If an account exists with this email, a reset link has been
                sent.
              </p>

              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700"
              >
                <ArrowLeft size={15} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                error={error}
              />

              <div className="mt-5">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-600"
                >
                  <ArrowLeft size={15} />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;