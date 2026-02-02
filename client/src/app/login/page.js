'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { login, forgotPassword, resetPassword } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Login Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Forgot Password Schema
const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Reset Password Schema
const resetSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset'
  const [resetToken, setResetToken] = useState('');

  // Check if redirected after password reset
  const resetSuccess = searchParams?.get('reset');

  // --- Login Form Setup ---
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@silkpay.local',
      password: 'password123',
    },
  });

  const onLoginSubmit = async (data) => {
    try {
      const response = await login(data.email, data.password);
      
      toast.success("Login Successful", {
        description: `Welcome back, ${response.merchant.name || 'to SilkPay'}`
      });
      
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle Field-Specific Validation Errors
      if (error.fields) {
          Object.keys(error.fields).forEach((field) => {
              loginForm.setError(field, {
                  type: "server",
                  message: error.fields[field]
              });
          });
      } else {
           // Handle specific auth errors
           if (error.message.includes('Locked') || error.message.includes('attempts')) {
               toast.error("Account Locked", { description: "Too many failed attempts. Please try again later." });
           } else if (error.message.includes('credentials')) {
               loginForm.setError('root', { message: "Invalid email or password" });
               toast.error("Invalid credentials");
           } else {
               toast.error(error.message || "Login failed");
           }
      }
    }
  };

  // --- Forgot Password Form Setup ---
  const forgotForm = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onForgotSubmit = async (data) => {
    try {
      const response = await forgotPassword(data.email);

      toast.success("Reset Link Sent", {
        description: "Check your email for password reset instructions."
      });
      
      // Development Helper (Removed logging for security in production, but logic logic preserved if needed for testing flow)
      if (response.data?.token) {
        setResetToken(response.data.token);
        setForgotStep('reset');
      } else {
        setShowForgot(false);
        forgotForm.reset();
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.message || "Failed to send reset link");
    }
  };

  // --- Reset Password Form Setup ---
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onResetSubmit = async (data) => {
    try {
      await resetPassword(resetToken, data.newPassword);

      toast.success("Password Reset Successful", {
        description: "You can now login with your new password"
      });
      setShowForgot(false);
      setForgotStep('email');
      setResetToken('');
      resetForm.reset();
    } catch (error) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  return (
    <div className="w-full max-w-sm z-10 relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/40">
                  S
                </div>
                <span className="text-2xl font-bold text-white tracking-wide">SilkPay</span>
            </div>
        </div>

        {/* Success message if coming from password reset */}
        {resetSuccess && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
            ✓ Password reset successful! Please login.
          </div>
        )}

        {!showForgot ? (
          // LOGIN FORM
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email or Username</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="username or email@example.com" 
                                            className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white pr-10"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-xs text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        
                        {loginForm.formState.errors.root && (
                            <div className="text-[0.8rem] font-medium text-destructive text-center">
                                {loginForm.formState.errors.root.message}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200" disabled={loginForm.formState.isSubmitting}>
                            {loginForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-xs text-center text-muted-foreground pb-6">
                <div className="text-muted-foreground">
                    Don't have an account? <span className="text-primary cursor-pointer hover:underline">Contact Sales</span>
                </div>
                <div className="opacity-50">Protected by SilkPay Security</div>
            </CardFooter>
          </Card>
        ) : (
          // FORGOT/RESET PASSWORD FLOW
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotStep('email');
                    setResetToken('');
                    forgotForm.reset();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {forgotStep === 'email' ? 'Forgot Password?' : 'Reset Password'}
              </CardTitle>
              <CardDescription className="text-center">
                {forgotStep === 'email' 
                  ? 'Enter your email to receive reset instructions' 
                  : 'Enter your new password'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotStep === 'email' ? (
                <Form {...forgotForm}>
                    <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                        <FormField
                            control={forgotForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="name@example.com" 
                                            className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90" 
                            disabled={forgotForm.formState.isSubmitting}
                        >
                            {forgotForm.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
                </Form>
              ) : (
                <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                        <FormField
                            control={resetForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="password"
                                            placeholder="Enter new password" 
                                            className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={resetForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="password"
                                            placeholder="Confirm new password" 
                                            className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90" 
                            disabled={resetForm.formState.isSubmitting}
                        >
                            {resetForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </Form>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0e12] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0d0e12] to-[#0d0e12] z-0 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/40 rounded-full blur-[100px] opacity-30 animate-pulse delay-700" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-500/40 rounded-full blur-[100px] opacity-30 animate-pulse" />

      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
