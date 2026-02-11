'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/services/authService';
import { toast } from 'sonner';

/**
 * RoleGuard - Protects routes based on user role
 * Usage: Wrap page components with this to restrict access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string[]} props.allowedRoles - Array of allowed roles  (e.g., ['ADMIN'])
 * @param {string} props.redirectTo - Where to redirect unauthorized users (default: '/transactions')
 */
export function RoleGuard({ children, allowedRoles = [], redirectTo = '/transactions' }) {
  const router = useRouter();

  useEffect(() => {
    const userRole = getUserRole();

    if (!userRole) {
      // Not logged in - middleware should handle this, but just in case
      router.replace('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      toast.error('Access Denied', {
        description: 'You do not have permission to view this page'
      });
      router.replace(redirectTo);
    }
  }, [allowedRoles, redirectTo, router]);

  return <>{children}</>;
}
