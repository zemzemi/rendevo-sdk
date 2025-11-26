import { BaseClient } from '../core/base-client';
import type { User, UpdateUserDto } from '../types/user.types';

export class UsersAPI extends BaseClient {
  async getAll(): Promise<User[]> {
    return this.get<User[]>('/users');
  }

  async getById(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.patch<User>(`/users/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    await this.delete<void>(`/users/${id}`);
  }

  async getMe(): Promise<User> {
    return this.get<User>('/users/me');
  }
}
