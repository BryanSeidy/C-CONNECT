import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  return res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
};
