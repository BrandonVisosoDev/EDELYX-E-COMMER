import { HttpErrorResponse } from '@angular/common/http';

export function extractApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el API Gateway (http://localhost:8080). Verifica que el backend esté en ejecución.';
    }

    const payload = error.error;
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.validationErrors) && payload.validationErrors.length > 0) {
        return payload.validationErrors.join(' · ');
      }
      if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message;
      }
    }

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }
  }

  return fallbackMessage;
}
