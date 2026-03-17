const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? `+${digits}` : `+91${digits.slice(-10)}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem("gramsync_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || data.error || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function storeSession(data) {
  if (data.accessToken) {
    localStorage.setItem("gramsync_token", data.accessToken);
  }

  if (data.refreshToken) {
    localStorage.setItem("gramsync_refresh_token", data.refreshToken);
  }

  if (data.merchant) {
    localStorage.setItem("gramsync_merchant", JSON.stringify(data.merchant));
  }
}

export function clearSession() {
  localStorage.removeItem("gramsync_token");
  localStorage.removeItem("gramsync_refresh_token");
  localStorage.removeItem("gramsync_merchant");
}

const authService = {
  normalizePhone,
  sendOtp(phone) {
    return request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhone(phone) }),
    });
  },
  verifyOtp(phone, otp) {
    return request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: normalizePhone(phone), otp }),
    });
  },
  setPin(pin) {
    return request("/auth/set-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },
  verifyPin(pin, phone) {
    return request("/auth/verify-pin", {
      method: "POST",
      body: JSON.stringify({
        pin,
        ...(phone ? { phone: normalizePhone(phone) } : {}),
      }),
    });
  },
  refresh() {
    return request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refreshToken: localStorage.getItem("gramsync_refresh_token"),
      }),
    });
  },
};

export default authService;
