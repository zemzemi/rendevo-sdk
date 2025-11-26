import type { ClientConfig } from './types/common';
import { AuthAPI } from './api/auth.api';
import { UsersAPI } from './api/users.api';

/**
 * Main Rendevo API Client
 */
export class RendevoClient {
  public readonly auth: AuthAPI;
  public readonly users: UsersAPI;

  private readonly _apis: (AuthAPI | UsersAPI)[];

  constructor(config: ClientConfig) {
    this.auth = new AuthAPI(config);
    this.users = new UsersAPI(config);
    this._apis = [this.auth, this.users];
    this._linkTokenManagement();
  }

  private _linkTokenManagement(): void {
    const originalAuthSetToken = this.auth.setToken.bind(this.auth);
    const originalAuthClearToken = this.auth.clearToken.bind(this.auth);
    const originalAuthSetRefreshToken = this.auth.setRefreshToken.bind(this.auth);
    const originalAuthClearRefreshToken = this.auth.clearRefreshToken.bind(this.auth);
    
    this.auth.setToken = (token: string) => {
      originalAuthSetToken(token);
      this._apis.forEach(api => {
        if (api !== this.auth) api.setToken(token);
      });
    };

    this.auth.clearToken = () => {
      originalAuthClearToken();
      this._apis.forEach(api => {
        if (api !== this.auth) api.clearToken();
      });
    };

    this.auth.setRefreshToken = (token: string) => {
      originalAuthSetRefreshToken(token);
      this._apis.forEach(api => {
        if (api !== this.auth) api.setRefreshToken(token);
      });
    };

    this.auth.clearRefreshToken = () => {
      originalAuthClearRefreshToken();
      this._apis.forEach(api => {
        if (api !== this.auth) api.clearRefreshToken();
      });
    };
  }

  setToken(token: string): void {
    this.auth.setToken(token);
  }

  clearToken(): void {
    this.auth.clearToken();
  }

  getToken(): string | undefined {
    return this.auth.getToken();
  }

  setRefreshToken(token: string): void {
    this.auth.setRefreshToken(token);
  }

  clearRefreshToken(): void {
    this.auth.clearRefreshToken();
  }

  getRefreshToken(): string | undefined {
    return this.auth.getRefreshToken();
  }
}
