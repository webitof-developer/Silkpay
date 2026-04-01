'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const redirectToServerUnavailable = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/server-unavailable') {
    window.location.assign('/server-unavailable');
  }
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (!token) {
        toast.error("Missing reset token");
        return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      });

      if (response.ok) {
        toast.success("Password Reset Successful", {
          description: "You can now login with your new password"
        });
        router.push('/login?reset=success');
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Invalid or expired reset token");
      }
    } catch (error) {
      console.error(error);
      if (error?.name === 'TypeError' || error?.message === 'Failed to fetch') {
        redirectToServerUnavailable();
        return;
      }
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-red-400">Invalid Link</CardTitle>
                <CardDescription>
                    This password reset link is invalid or missing the token.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl w-full max-w-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
            <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter your new password to secure your account
        </CardDescription>
      </CardHeader>
      <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                name="newPassword"
                type="password" 
                placeholder="Enter new password" 
                required 
                minLength={6}
                className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                placeholder="Confirm new password" 
                required 
                minLength={6}
                className="bg-black/20 border-white/5 focus-visible:ring-primary/50 text-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
      </CardContent>
      <CardFooter>
        <Button variant="link" className="w-full text-muted-foreground" size="sm" onClick={() => router.push('/login')}>
             Back to Login
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0e12] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#0d0e12] to-[#0d0e12] z-0 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/40 rounded-full blur-[100px] opacity-30 animate-pulse delay-700" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-500/40 rounded-full blur-[100px] opacity-30 animate-pulse" />

      <div className="w-full max-w-md z-10 relative flex justify-center">
          <Suspense fallback={<div className="flex items-center text-white"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
      </div>
    </div>
  );
}
