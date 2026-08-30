import api from "./api";

export interface CompanyRegisterData {
  company_name: string;
  industry: string;
  phone: string;
  country: string;
  address: string;
  owner_name: string;
  email: string;
  password: string;
}

export const registerCompany = async (
  data: CompanyRegisterData
) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};