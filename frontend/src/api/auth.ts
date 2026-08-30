import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(data: LoginRequest) {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    data
  );

  return response.data;
}

export const forgotPassword = async (
  data: { email: string }
) => {
  const response = await api.post(
    "/auth/forgot-password",
    data
  );

  return response.data;
};

export const resetPassword = async (
  data: {
    token: string;
    password: string;
    confirm_password: string;
  }
) => {
  const response = await api.post(
    "/auth/reset-password",
    data
  );

  return response.data;
};