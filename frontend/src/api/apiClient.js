const API_URL = "http://127.0.0.1:8000";

export async function apiRequest(
  endpoint,
  options = {},
  logout = null
) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    options
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // =========================================================
  // TOKEN EXPIRED / INVALID
  // =========================================================

  if (response.status === 401) {
    console.log(
      "Token expired or invalid. Logging out..."
    );

    if (logout) {
      logout();
    }

    throw new Error(
      "Your session has expired. Please login again."
    );
  }

  // =========================================================
  // OTHER API ERRORS
  // =========================================================

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        "Something went wrong"
    );
  }

  return data;
}

export { API_URL };