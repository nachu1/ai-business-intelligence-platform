import api from "./api";


// --------------------------------------------------
// CURRENT USER
// --------------------------------------------------

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");

  return response.data;
};


// --------------------------------------------------
// COMPANY USER STATISTICS
// --------------------------------------------------

export interface UserStats {
  total_users: number;
  administrators: number;
  managers: number;
  employees: number;
}

export const getUserStats =
  async (): Promise<UserStats> => {
    const response = await api.get(
      "/users/stats"
    );

    return response.data;
  };


// --------------------------------------------------
// COMPANY DEPARTMENTS
// --------------------------------------------------

export interface UserDepartment {
  id: string;
  name: string;
  is_active: boolean;
}

export const getUserDepartments =
  async (): Promise<UserDepartment[]> => {
    const response = await api.get(
      "/users/departments"
    );

    return response.data.departments;
  };

export interface DepartmentManager {
  id: string;
  name: string;
}

export const getDepartmentManagers = async (
  departmentId: string
): Promise<DepartmentManager[]> => {
  const response = await api.get(
    "/users/managers",
    {
      params: {
        department_id: departmentId,
      },
    }
  );

  return response.data;
};

// --------------------------------------------------
// USERS
// --------------------------------------------------

export interface GetUsersParams {
  search?: string;
  role?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  company_id: string;

  name: string;
  email: string;

  role:
    | "admin"
    | "manager"
    | "employee";

  department_id: string;
  designation_id: string;

  department: string;
  designation: string;
  manager_id: string | null;

  is_active: boolean;
  created_at: string;

  company: {
    id: string;
    name: string;
  };
}

export const getUsers = async (
  params?: GetUsersParams
): Promise<User[]> => {

  const response = await api.get(
    "/users",
    {
      params,
    }
  );

  return response.data;
};



export const updateUser = async (
  userId: string,
  data: {
    name: string;
    role: "admin" | "manager" | "employee";
    department_id: string;
    designation_id: string;
    manager_id: string | null;
    is_active: boolean;
  }
) => {
  const response = await api.put(
    `/users/${userId}`,
    data
  );

  return response.data;
};

export const deleteUser = async (
  userId: string
) => {
  const response = await api.delete(
    `/users/${userId}`
  );

  return response.data;
};


// --------------------------------------------------
// INVITE USER
// --------------------------------------------------

export interface InviteUserData {
  name: string;
  email: string;

  department_id: string;
  designation_id: string;

  role:
    | "admin"
    | "manager"
    | "employee";
}

export const inviteUser = async (
  data: InviteUserData
) => {

  const response = await api.post(
    "/users/invite",
    data
  );

  return response.data;
};

// --------------------------------------------------
// INVITATIONS
// --------------------------------------------------

export interface Invitation {
  id: string;
  name: string;
  email: string;

  role:
    | "admin"
    | "manager"
    | "employee";

  department_id: string;
  designation_id: string;

  status:
    | "pending"
    | "accepted"
    | "cancelled";

  created_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
}

export const getInvitations = async (): Promise<Invitation[]> => {
  const response = await api.get("/users/invitations");
  return response.data;
};

export const resendInvitation =
  async (invitationId: string) => {
    const response = await api.post(
      `/users/invitations/${invitationId}/resend`
    );

    return response.data;
  };

export const cancelInvitation =
  async (invitationId: string) => {
    const response = await api.delete(
      `/users/invitations/${invitationId}`
    );

    return response.data;
  };

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.put(
    "/users/me/password",
    data
  );

  return response.data;
};