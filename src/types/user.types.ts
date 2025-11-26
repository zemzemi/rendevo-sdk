/**
 * User Domain Types
 * User Entity and Related DTOs
 */

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}
