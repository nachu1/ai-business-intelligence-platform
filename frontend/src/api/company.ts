import api from "./api";

// ==================================================
// COMPANY
// ==================================================

export interface CompanyCreate {
  name: string;
  industry: string;
  email: string;
  phone: string;
  country: string;
  address?: string;
  owner_name: string;
  password: string;
}

export interface CompanyResponse extends CompanyCreate {
  id: string;
}

export const registerCompany = async (
  company: CompanyCreate
): Promise<CompanyResponse> => {
  const response = await api.post(
    "/companies/",
    company
  );

  return response.data;
};

export const getCompany = async (
  companyId: string
): Promise<CompanyResponse> => {
  const response = await api.get(
    `/companies/${companyId}`
  );

  return response.data;
};

// ==================================================
// DEPARTMENTS
// ==================================================

export interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export const getDepartments = async (): Promise<
  Department[]
> => {
  const response = await api.get(
    "/companies/departments"
  );

  return response.data;
};

export const createDepartment = async (
  name: string
): Promise<Department> => {
  const response = await api.post(
    "/companies/departments",
    {
      name,
    }
  );

  return response.data;
};

export const deleteDepartment = async (
  departmentId: string
) => {
  const response = await api.delete(
    `/companies/departments/${departmentId}`
  );

  return response.data;
};

// ==================================================
// DESIGNATIONS
// ==================================================

export interface Designation {
  id: string;
  department_id: string;
  name: string;
  is_active: boolean;
}

export const getDesignations = async (
  departmentId: string
): Promise<Designation[]> => {
  const response = await api.get(
    `/companies/departments/${departmentId}/designations`
  );

  return response.data;
};

export const createDesignation = async (
  departmentId: string,
  name: string
): Promise<Designation> => {
  const response = await api.post(
    `/companies/departments/${departmentId}/designations`,
    {
      name,
    }
  );

  return response.data;
};

export const deleteDesignation = async (
  designationId: string
) => {
  const response = await api.delete(
    `/companies/designations/${designationId}`
  );

  return response.data;
};