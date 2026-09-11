import { apiRequest } from "./apiClient";

export async function registerUser(userData) {
  return apiRequest("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
}

export async function loginUser(userData) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser(token, logout = null) {
  return apiRequest(
    "/auth/me",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}