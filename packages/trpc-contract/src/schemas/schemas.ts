import { z } from 'zod';

const userNameSchema = z
  .string()
  .min(3, 'Name must be at least 3 characters long')
  .max(16, 'Name must be at most 16 characters long')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Name can only contain letters, numbers, and underscores'
  );

const userPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.\n')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.\n')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.\n')
  .regex(/[0-9]/, 'Password must contain at least one number.\n')
  .regex(/[\W_]/, 'Password must contain at least one special character.\n');

export const signUpInput = z.object({
  name: userNameSchema,
  email: z.string().email(),
  password: userPasswordSchema,
});

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const tournamentNameSchema = z
  .string()
  .min(3, 'Tournament name must be at least 3 characters long')
  .regex(/^\S+$/, { message: 'Name must not contain spaces' });

export const tournamentInput = z.object({
  name: tournamentNameSchema,
  playerLimit: z.number().min(2).max(8),
});
