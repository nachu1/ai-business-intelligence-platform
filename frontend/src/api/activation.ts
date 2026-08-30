import api from "./api";

export async function getInvitation(token: string) {
  const response = await api.get(
    `/users/invitation/${token}`
  );

  return response.data;
}

export async function activateAccount(data: {
  token: string;
  password: string;
  confirm_password: string;
}) {
  const response = await api.post(
    "/users/activate",
    data
  );

  return response.data;
}