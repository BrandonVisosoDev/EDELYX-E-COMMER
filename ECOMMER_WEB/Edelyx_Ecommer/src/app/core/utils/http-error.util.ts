import { HttpErrorResponse } from '@angular/common/http';

export function extractApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No fue posible establecer conexión con el servidor. Por favor, verifica tu conexión a internet o intenta de nuevo.';
    }

    if (error.status === 502 || error.status === 503 || error.status === 504) {
      return 'El servicio no se encuentra disponible temporalmente. Por favor, intenta de nuevo en unos momentos.';
    }

    const payload = error.error;
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.validationErrors) && payload.validationErrors.length > 0) {
        return payload.validationErrors.join(' · ');
      }
      if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message;
      }
      if (payload.error === 'Internal Server Error' && !payload.message) {
        return fallbackMessage;
      }
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      if (payload.includes('<!DOCTYPE html>') || payload.includes('<html')) {
        return fallbackMessage;
      }
      return payload;
    }
  }

  return fallbackMessage;
}
