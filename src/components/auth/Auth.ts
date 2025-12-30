// src/lib/Auth.ts
import api from "@/lib/Api";

const TOKEN_KEY = "auth_token";

export type AuthResponse = {
  token: string;
  expiresAt?: string;
};

export type User = {
  id: string;
  email: string;
  fullName?: string;
  fullNamePascal?: string; // FullName
  name?: string;
  namePascal?: string; // Name
  firstName?: string;
  lastName?: string;
  displayName?: string;
  companyName?: string;
  company?: string;
  tenantName?: string;
  tenant?: {
    name: string;
  };
  // Supporting PascalCase/Other from C# backend
  FullName?: string;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  DisplayName?: string;
  Tenant?: {
    Name: string;
  };
  TenantName?: string;
  CompanyName?: string;
  Company?: string;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/Auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function me(): Promise<User> {
  const { data } = await api.get<User>("/Auth/me");
  return data;
}

export function isAuthenticated() {
  return !!getToken();
}
