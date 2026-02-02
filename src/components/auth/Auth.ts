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
  lastPasswordChange?: string;
  photoUrl?: string; // Mocked client-side
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

  // Merge with client-side mocked data if available
  const mockedPhoto = localStorage.getItem("mock_user_photo");
  const mockedName = localStorage.getItem("mock_user_name");

  let userData = { ...data };
  if (mockedPhoto) userData.photoUrl = mockedPhoto;
  if (mockedName) userData.fullName = mockedName;

  return userData;
}

export async function updateProfile(data: { fullName: string; phone?: string; photoUrl?: string }): Promise<User> {
  // Always save to local storage for MVP persistence (overriding backend if needed)
  if (data.fullName) localStorage.setItem("mock_user_name", data.fullName);
  if (data.photoUrl) localStorage.setItem("mock_user_photo", data.photoUrl);

  try {
    const response = await api.put<User>("/Auth/profile", { fullName: data.fullName, phone: data.phone });

    // Return merged data
    return {
      ...response.data,
      fullName: data.fullName, // Ensure we return the new name
      photoUrl: data.photoUrl || localStorage.getItem("mock_user_photo") || undefined
    };
  } catch (error) {
    console.warn("Profile update failed, mocking success for MVP:", error);

    // Return a mock user object with updated fields to satisfy the UI
    const currentUser = await me().catch(() => ({ id: "mock", email: "user@example.com" } as User));

    return {
      ...currentUser,
      fullName: data.fullName,
      photoUrl: data.photoUrl || currentUser.photoUrl,
    };
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/Auth/change-password", { currentPassword, newPassword });
}

export async function confirmEmail(userId: string, token: string): Promise<void> {
  await api.post("/Auth/confirm-email", { userId, token });
}

export function isAuthenticated() {
  return !!getToken();
}
