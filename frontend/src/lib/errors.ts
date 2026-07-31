/**
 * Utilitaire de gestion d'erreur TypeScript — remplace les 'catch (err: any)'.
 *
 * Usage :
 *   } catch (err) {
 *     setError(extractApiError(err, 'Fallback message'));
 *   }
 */
export interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
      errors?: string | Record<string, string[]>;
    };
  };
  message?: string;
}

export function extractApiError(error: unknown, fallback = 'Une erreur est survenue.'): string {
  const err = error as ApiErrorShape;
  const data = err?.response?.data;

  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.errors === 'string')  return data.errors;
  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join(', ');
  }
  if (typeof err?.message === 'string' && err.message !== '[object Object]') return err.message;

  return fallback;
}

/** Type safe catch pour les handlers d'événements async */
export type AsyncHandler = () => Promise<void>;
