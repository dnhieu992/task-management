export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
  getToken?: () => string | null | Promise<string | null>;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Required for reliable instanceof checks when compiled to older targets
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
