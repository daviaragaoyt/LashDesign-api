// middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

// Lista negra de tokens
const tokenBlacklist: string[] = [];

/**
 * Middleware para autenticar o usuário via JWT.
 * Se o token for inválido, expirado ou estiver na blacklist, envia uma resposta 401.
 */
export const autenticar: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    res.status(401).json({
      status: 'error',
      message: 'Token de autenticação não fornecido',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  // Verifica se o token está na lista negra
  if (tokenBlacklist.includes(token)) {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido (logout realizado)',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: Role };
    // Extensão da propriedade 'usuario' no Request (lembre-se de estender a interface Express.Request)
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido ou expirado',
    });
    return;
  }
};

/**
 * Função auxiliar para adicionar um token à blacklist (útil no logout).
 */
export const addTokenToBlacklist = (token: string): void => {
  tokenBlacklist.push(token);
};

export default autenticar;
