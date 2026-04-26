/** user-service JSON (camelCase). */

export type UserRole = "SUPER_ADMIN" | "STORE_MANAGER" | "CUSTOMER";

export type UserProfile = {
  id: string;
  phone?: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  roles: UserRole[];
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SavedAddress = {
  id: string;
  userId: string;
  label: string;
  region: string;
  district: string;
  street: string;
  house: string;
  apartment?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
