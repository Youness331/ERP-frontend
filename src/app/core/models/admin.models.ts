export interface Role {
  id: number;
  name: string;
  label: string;
  description: string | null;
  permissions?: string[];
  users_count?: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  is_active: boolean;
  role: Role | null;
  last_login_at: string | null;
  created_at: string;
}

export interface PermissionGroup {
  module: string;
  permissions: { id: number; name: string; label: string }[];
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role_id?: number | null;
  phone?: string | null;
  job_title?: string | null;
  is_active?: boolean;
}
