import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Requête traitée avec succès',
  statusCode = 200
) => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message
  };

  return res.status(statusCode).json(payload);
};

export const sendError = (res: Response, message: string, statusCode = 400) => {
  const payload: ApiResponse<null> = {
    success: false,
    data: null,
    message
  };

  return res.status(statusCode).json(payload);
};
