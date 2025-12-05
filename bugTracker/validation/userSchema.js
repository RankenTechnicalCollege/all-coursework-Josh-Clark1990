import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20),
    confirmPassword: z.string(),
    role: z.enum([
        'developer',
        'business analyst',
        'quality analyst',
        'product manager',
        'technical manager',
        'user'
    ]),
    name: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20)
});

const userIdSchema = z.object({
    id: z.string().min(1)
});

const userUpdateSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).max(20).optional(),
    currentPassword: z.string().optional(),
    name: z.string().optional(),
    role: z.string().optional()
});

export { registerSchema, loginSchema, userIdSchema, userUpdateSchema };