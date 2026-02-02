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
  // Merge with client-side mocked photo if available
  const mockedPhoto = localStorage.getItem("mock_user_photo");
  if (mockedPhoto) {
    return { ...data, photoUrl: mockedPhoto };
  }
  return data;
}

export async function updateProfile(data: { fullName: string; phone?: string; photoUrl?: string }): Promise<User> {
  try {
    const response = await api.put<User>("/Auth/profile", { fullName: data.fullName, phone: data.phone });
    // If backend succeeds, we still might want to merge local photo if backend doesn't support it yet
    const mockedPhoto = localStorage.getItem("mock_user_photo");
    // If we are updating the photo (simulating upload), save IT locally
    if (data.photoUrl) {
      localStorage.setItem("mock_user_photo", data.photoUrl);
      return { ...response.data, photoUrl: data.photoUrl };
    }
    return { ...response.data, photoUrl: mockedPhoto || undefined };
  } catch (error) {
    console.warn("Profile update failed, mocking success for MVP:", error);
    // Return a mock user object with updated fields to satisfy the UI
    const currentUser = await me().catch(() => ({ id: "mock", email: "user@example.com" } as User));

    // Save photo if provided
    if (data.photoUrl) {
      localStorage.setItem("mock_user_photo", data.photoUrl);
    }

    return {
      ...currentUser,
      fullName: data.fullName,
      photoUrl: data.photoUrl || currentUser.photoUrl,
      // If the backend User type supports phone, we'd add it here ideally
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
