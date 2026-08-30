import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { resetPassword } from "../../api/auth";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleReset = async () => {
    const newErrors = {
      password:
        password === ""
          ? "Password is required."
          : password.length < 8
          ? "Password must be at least 8 characters."
          : "",
      confirmPassword:
        confirmPassword === ""
          ? "Please confirm your password."
          : confirmPassword !== password
          ? "Passwords do not match."
          : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    if (!token) {
      toast.error("Invalid password reset link.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });

      if (!response.success) {
        toast.error(
          response.message || "Unable to reset password."
        );
        return;
      }

      setSuccess(true);
      toast.success("Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err: any) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to reset password."
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
              {success ? (
                <CheckCircle2 className="h-8 w-8 text-white" />
              ) : (
                <KeyRound className="h-8 w-8 text-white" />
              )}
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900">
              {success ? "Password Updated" : "Reset Password"}
            </h1>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              {success
                ? "Your password has been changed successfully."
                : "Create a new password for your BizInsight account."}
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-sm font-medium text-emerald-700">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="Create new password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);

                  setErrors((prev) => ({
                    ...prev,
                    password:
                      value === ""
                        ? "Password is required."
                        : value.length < 8
                        ? "Password must be at least 8 characters."
                        : "",
                    confirmPassword:
                      confirmPassword === ""
                        ? prev.confirmPassword
                        : confirmPassword === value
                        ? ""
                        : "Passwords do not match.",
                  }));
                }}
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfirmPassword(value);

                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      value === ""
                        ? "Please confirm your password."
                        : value === password
                        ? ""
                        : "Passwords do not match.",
                  }));
                }}
                error={errors.confirmPassword}
              />

              <Button
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600"
                >
                  <ArrowLeft size={15} />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;