import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable field schemas
// ---------------------------------------------------------------------------

const emailField = z
  .string({ required_error: "Informe seu e-mail." })
  .email("E-mail inválido.");

const passwordField = z
  .string({ required_error: "Informe sua senha." })
  .min(8, "A senha precisa ter pelo menos 8 caracteres.");

const strongPasswordField = passwordField
  .regex(/[A-Z]/, "Adicione pelo menos uma letra maiúscula.")
  .regex(/[a-z]/, "Adicione pelo menos uma letra minúscula.")
  .regex(/[0-9]/, "Adicione pelo menos um número.")
  .regex(/[^A-Za-z0-9]/, "Adicione pelo menos um símbolo (ex.: !@#$%).");

// ---------------------------------------------------------------------------
// SignIn
// ---------------------------------------------------------------------------

export const SignInSchema = z.object({
  email: emailField,
  password: passwordField,
  turnstileToken: z.string().optional(),
});

export type SignInInput = z.infer<typeof SignInSchema>;

// ---------------------------------------------------------------------------
// SignUp
// ---------------------------------------------------------------------------

export const SignUpSchema = z
  .object({
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string({ required_error: "Confirme sua senha." }),
    turnstileToken: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

// ---------------------------------------------------------------------------
// Reset request (forgot password)
// ---------------------------------------------------------------------------

export const ResetRequestSchema = z.object({
  email: emailField,
  turnstileToken: z.string().optional(),
});

export type ResetRequestInput = z.infer<typeof ResetRequestSchema>;

// ---------------------------------------------------------------------------
// New password (after clicking reset link)
// ---------------------------------------------------------------------------

export const NewPasswordSchema = z
  .object({
    password: strongPasswordField,
    confirmPassword: z.string({ required_error: "Confirme sua senha." }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type NewPasswordInput = z.infer<typeof NewPasswordSchema>;
