import { Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useState } from "react";
import { registerCompany } from "../../api/company";
import toast from "react-hot-toast";

function CompanyRegisterPage() {
  const [companyName, setCompanyName] = useState("");
const [industry, setIndustry] = useState("");
const [phone, setPhone] = useState("");
const [country, setCountry] = useState("");
const [address, setAddress] = useState("");

const [ownerName, setOwnerName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState({
  companyName: "",
  industry: "",
  phone: "",
  country: "",
  address: "",
  ownerName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const navigate = useNavigate();

const handleRegister = async () => {
    console.log("Register button clicked"); 
  

  const newErrors = {
  companyName: companyName
    ? ""
    : "Company name is required.",

  industry: industry
    ? ""
    : "Please select an industry.",

  phone: phone
    ? ""
    : "Phone number is required.",

  country: country
    ? ""
    : "Country is required.",

  address: address
    ? ""
    : "Address is required.",

  ownerName: ownerName
    ? ""
    : "Owner name is required.",

  email: email
    ? ""
    : "Business email is required.",

  password: password
    ? password.length >= 8
      ? ""
      : "Password must be at least 8 characters."
    : "Password is required.",

  confirmPassword:
    confirmPassword === ""
      ? "Please confirm your password."
      : password !== confirmPassword
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
    setLoading(true);
  console.log("About to call register API");
    await registerCompany({
  name: companyName,
  industry,
  email,
  phone,
  country,
  address,
  owner_name: ownerName,
  password,
});

    toast.success("Company registered successfully!");

setTimeout(() => {
  navigate("/login");
}, 1500);

  } catch (err: any) {
  console.log("Backend Error:", err.response?.data);

  if (err.response?.data?.detail) {
    console.log(
  "Detail:",
  JSON.stringify(err.response.data.detail, null, 2)
);
  }

  toast.error("Registration failed.");
} finally {
  setLoading(false);
}
};

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
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />

      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl">

        <Card>

          <div className="mb-10 flex flex-col items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-xl shadow-cyan-500/20">

              <Building2 className="h-10 w-10 text-white" />

            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900">
              Create Company
            </h1>

            <p className="mt-2 text-slate-500">
              Register your organization to get started
            </p>

          </div>

        {/* Company Information */}

<h2 className="mb-5 text-xl font-bold text-slate-800">
  Company Information
</h2>

<div className="grid grid-cols-1 gap-6 md:grid-cols-2">

  <Input
  label="Company Name"
  placeholder="Enter company name"
  value={companyName}
  onChange={(e) => {
  setCompanyName(e.target.value);

  setErrors((prev) => ({
    ...prev,
    companyName: "",
  }));
}}
  error={errors.companyName}
/>

  <Select
  label="Industry"
  value={industry}
  onChange={(e) => {
  setIndustry(e.target.value);

  setErrors((prev) => ({
    ...prev,
    industry: "",
  }));
}}
  error={errors.industry}
>
  <option value="">Select Industry</option>

  <option>Information Technology</option>
  <option>Healthcare</option>
  <option>Finance</option>
  <option>Education</option>
  <option>Manufacturing</option>
  <option>Retail</option>
  <option>Logistics</option>
  <option>Hospitality</option>
  <option>Real Estate</option>
  <option>Marketing</option>
  <option>Consulting</option>
  <option>Other</option>
</Select>

  <Input
  label="Phone"
  placeholder="Enter phone number"
  value={phone}
  onChange={(e) => {
  setPhone(e.target.value);

  setErrors((prev) => ({
    ...prev,
    phone: "",
  }));
}}
  error={errors.phone}
/>

  <Input
  label="Country"
  placeholder="Enter country"
  value={country}
  onChange={(e) => {
  setCountry(e.target.value);

  setErrors((prev) => ({
    ...prev,
    country: "",
  }));
}}
  error={errors.country}
/>

</div>

<div className="mt-6">

  <Input
  label="Address"
  placeholder="Enter company address"
  value={address}
onChange={(e) => {
  setAddress(e.target.value);

  setErrors((prev) => ({
    ...prev,
    address: "",
  }));
}}
  error={errors.address}
/>

</div>
          {/* Administrator Information */}

<h2 className="mt-10 mb-5 text-xl font-bold text-slate-800">
  Administrator Information
</h2>

<div className="grid grid-cols-1 gap-6 md:grid-cols-2">

  <Input
  label="Owner Name"
  placeholder="Enter owner's name"
  value={ownerName}
  onChange={(e) => {
  setOwnerName(e.target.value);

  setErrors((prev) => ({
    ...prev,
    ownerName: "",
  }));
}}
  error={errors.ownerName}
/>

 <Input
  label="Business Email"
  type="email"
  placeholder="Enter business email"
  value={email}
  onChange={(e) => {
    const value = e.target.value;

    setEmail(value);

    setErrors((prev) => ({
      ...prev,

      email:
        value === ""
          ? "Business email is required."
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Please enter a valid email address.",
    }));
  }}
  error={errors.email}
/>

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

</div>

<div className="mt-8">
 

  <Button onClick={handleRegister} disabled={loading}>
  {loading ? "Creating..." : "Create Company"}
</Button>

</div>
          <div className="mt-8 text-center">

            <p className="text-sm text-slate-500">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-semibold text-teal-600 hover:text-teal-700"
              >
                Sign In
              </Link>

            </p>

          </div>

        </Card>

      </div>

    </div>
  );
}

export default CompanyRegisterPage;