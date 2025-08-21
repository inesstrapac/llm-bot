import http from "../../../services/http";

export const login = (email, password) =>
  http.post("/auth/login", { email, password });

export const refresh = () => http.post("/auth/refresh");

export const register = (payload) => http.post("/auth/register", payload);

export const logout = () => http.post("/auth/logout");
