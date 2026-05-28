import { UserModel } from "@/app/generated/prisma/models";
import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email("Invalid email address").transform((email) => (email.toLowerCase().trim())),
    timezone: z.string().optional(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password is too long')
        .regex(
            /[A-Z]/,
            'Password must contain at least one uppercase letter'
        )
        .regex(
            /[a-z]/,
            'Password must contain at least one lowercase letter'
        )
        .regex(
            /[0-9]/,
            'Password must contain at least one number'
        )
        .regex(
            /[^A-Za-z0-9]/,
            'Password must contain at least one special character'
        ),
})

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").transform((email) => (email.toLowerCase().trim())),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password is too long')
        .regex(
            /[A-Z]/,
            'Password must contain at least one uppercase letter'
        )
        .regex(
            /[a-z]/,
            'Password must contain at least one lowercase letter'
        )
        .regex(
            /[0-9]/,
            'Password must contain at least one number'
        )
        .regex(
            /[^A-Za-z0-9]/,
            'Password must contain at least one special character'
        ),
})

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>
export type LoginSchema = z.infer<typeof loginSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>