export type ApiError = {
  error: string;
  details?: string;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type FamilyMember = {
  id: number;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

export type Location = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
};
