export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  };
}

export function fail(message: string, code?: string): ApiError {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}