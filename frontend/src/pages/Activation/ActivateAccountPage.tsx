import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { getInvitation, activateAccount } from "../../api/activation";

import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

type InvitationStatus =
  | "pending"
  | "already_activated"
  | "invalid";

function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [activating, setActivating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] =
    useState<InvitationStatus>("invalid");

  const [invitation, setInvitation] =
    useState<any>(null);

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setStatus("invalid");
        setLoading(false);
        return;
      }

      try {
        const response = await getInvitation(token);

        setStatus(
          response.status || (
            response.success
              ? "pending"
              : "invalid"
          )
        );

        if (response.success) {
          setInvitation(response.invitation);
        }
      } catch (err) {
        console.error(
          "Failed to load invitation:",
          err
        );

        setStatus("invalid");
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function handleActivate() {
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

    if (
      Object.values(newErrors).some(
        (value) => value !== ""
      )
    ) {
      return;
    }

    try {
      setActivating(true);

      const response = await activateAccount({
        token: token!,
        password,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        toast.success(
          "Account activated successfully!"
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast.error(
          response.message ||
            "Activation failed."
        );
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Activation failed."
      );
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
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

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 text-white">
          <Loader2
            className="animate-spin"
            size={24}
          />
          <span className="text-sm font-medium sm:text-base">
            Checking invitation...
          </span>
        </div>
      </div>
    );
  }

  // ==================================================
  // ALREADY ACTIVATED
  // ==================================================

  if (status === "already_activated") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-3 py-6 sm:px-5 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-lg">
          <Card>
            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-cyan-500/20 sm:h-20 sm:w-20 sm:rounded-3xl">
                <CheckCircle2 className="h-8 w-8 text-white sm:h-10 sm:w-10" />
              </div>

              <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Account Already Activated
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                Your BizInsight account has already
                been activated. Please sign in to
                continue.
              </p>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Invitation email
                </p>

                <p className="mt-1 break-all text-sm font-bold text-slate-800 sm:text-base">
                  {invitation?.email || "This account"}
                </p>
              </div>

              <div className="mt-7">
                <Button
                  onClick={() =>
                    navigate("/login")
                  }
                >
                  Sign In
                </Button>
              </div>

            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ==================================================
  // INVALID INVITATION
  // ==================================================

  if (status === "invalid") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-3 py-6 sm:px-5 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-lg">
          <Card>
            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 sm:h-20 sm:w-20 sm:rounded-3xl">
                <AlertCircle className="h-8 w-8 text-white sm:h-10 sm:w-10" />
              </div>

              <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Invalid Invitation
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                This invitation link is not valid.
                Please contact your administrator
                and request a new invitation.
              </p>

              <div className="mt-7">
                <Button
                  onClick={() =>
                    navigate("/login")
                  }
                >
                  Go to Sign In
                </Button>
              </div>

            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ==================================================
  // PENDING INVITATION
  // ==================================================

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-3 py-6 sm:px-5 sm:py-8">
      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        <Card>

          {/* Header */}
          <div className="mb-7 flex flex-col items-center sm:mb-9">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-cyan-500/20 sm:h-20 sm:w-20 sm:rounded-3xl">
              <ShieldCheck className="h-8 w-8 text-white sm:h-10 sm:w-10" />
            </div>

            <h1 className="mt-5 text-center text-2xl font-black tracking-tight text-slate-900 sm:mt-6 sm:text-4xl">
              Activate Account
            </h1>

            <p className="mt-2 max-w-md text-center text-sm leading-6 text-slate-500 sm:text-base">
              Complete your account setup to start
              using BizInsight.
            </p>

          </div>

          <div className="space-y-5 sm:space-y-6">

            {/* Invitation Details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

              <p className="mb-4 text-sm font-bold text-slate-800">
                Invitation Details
              </p>

              <div className="space-y-4">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Full Name
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-slate-800 sm:text-base">
                    {invitation?.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email Address
                  </p>

                  <p className="mt-1 break-all text-sm font-bold text-slate-800 sm:text-base">
                    {invitation?.email}
                  </p>
                </div>

              </div>
            </div>

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="Create password"
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

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
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

            {/* Activate */}
            <Button
              onClick={handleActivate}
              disabled={activating}
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Activating...
                </span>
              ) : (
                "Activate Account"
              )}
            </Button>

            <p className="text-center text-xs leading-5 text-slate-400">
              By activating your account, you can
              sign in to BizInsight using your email
              and newly created password.
            </p>

          </div>
        </Card>
      </div>
    </div>
  );
}

export default ActivateAccountPage;