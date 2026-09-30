const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Small fetch wrapper: adds the token, parses JSON, throws readable errors.
export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // token missing or expired -> back to login
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/";
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}
