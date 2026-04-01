'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { DEFAULT_USER_PROFILE } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavContent } from "@/components/layout/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { isAdmin } from '@/services/authService';
import { BrandWordmark } from "@/components/brand/BrandMark";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const [userProfile, setUserProfile] = useState(DEFAULT_USER_PROFILE);

  const [isAdminUser, setIsAdminUser] = useState(false);

  // Sync with API on mount and listen for updates
  useEffect(() => {
     setIsAdminUser(isAdmin());

     const fetchProfile = async () => {
         try {
             // Use /auth/me to get current user's info (not merchant info)
             const profileRes = await api.get('/auth/me');
             if (profileRes.data) {
                 setUserProfile(prev => ({ 
                     ...prev, 
                     name: profileRes.data.name || prev.name,
                     username: profileRes.data.username || prev.username,
                     email: profileRes.data.email || prev.email,
                     avatar: profileRes.data.avatar || prev.avatar
                 }));
             }
         } catch (e) {
             console.error("Failed to fetch profile header", e);
         }
     };

     fetchProfile();
     // ... existing event listener
     const handleSettingsUpdate = (e) => {
         const newSettings = e.detail;
         setUserProfile(prev => ({
             ...prev,
             name: newSettings?.name || prev.name,
             email: newSettings?.email || prev.email,
             avatar: newSettings?.avatar || prev.avatar,
             username: newSettings?.username || prev.username
         }));
     };

     window.addEventListener('settings-updated', handleSettingsUpdate);
     return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);

  // ... (breadcrumbs logic)



  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    // ... (logic remains same, just ensuring scope)
    const paths = pathname.split('/').filter(path => path);
    const labelMap = {
      'payouts': 'Payouts',
      'transactions': 'Transactions',
      'beneficiaries': 'Beneficiaries',
      'bank-account': 'Bank Account',
      'merchant': 'Merchant Center',
      'backend-status': 'Backend Status',
      'settings': 'Settings',
      'new': 'Create New',
    };

    if (paths.length === 0) {
      if (!isAdminUser) return null; // Don't show Dashboard for non-admins on root
      return (
         <BreadcrumbItem>
           <BreadcrumbPage>Dashboard</BreadcrumbPage>
         </BreadcrumbItem>
      );
    }

    return (
       <>
         {isAdminUser && (
           <>
             <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
             </BreadcrumbItem>
             <BreadcrumbSeparator />
           </>
         )}
         {paths.map((path, index) => {
           const href = `/${paths.slice(0, index + 1).join('/')}`;
           const isLast = index === paths.length - 1;
           const label = labelMap[path] || path.charAt(0).toUpperCase() + path.slice(1);

           return (
             <React.Fragment key={path}>
               <BreadcrumbItem>
                 {isLast ? (
                   <BreadcrumbPage>{label}</BreadcrumbPage>
                 ) : (
                   <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                 )}
               </BreadcrumbItem>
               {!isLast && <BreadcrumbSeparator />}
             </React.Fragment>
           );
         })}
       </>
    );
  };

  const handleLogout = () => {
    document.cookie = "silkpay_session=; path=/; max-age=0";
    toast.success("Logged out successfully");
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between px-6 pt-4">
      {/* Combined Left Section: Mobile Menu + Breadcrumbs in a single glassy pill */}
      <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md border border-white/5 rounded-full pl-3 pr-6 py-2 shadow-sm">
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-sidebar-border">
              <div className="flex h-16 items-center border-b px-6 border-sidebar-border">
                <SheetTitle className="sr-only">SilkPay navigation</SheetTitle>
                <BrandWordmark iconClassName="h-8 w-8" textClassName="text-xl" />
              </div>
              <NavContent pathname={pathname} />
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
               {generateBreadcrumbs()}
            </BreadcrumbList>
          </Breadcrumb>
      </div>

      {/* Right side (Controls) */}
      <div className="flex items-center gap-4">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:scale-105 transition-all duration-200 ring-2 ring-offset-2 ring-transparent hover:ring-primary/20">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} className="object-cover" />
                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                Profile
            </DropdownMenuItem>
            {isAdminUser && (
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>Settings</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-500 hover:text-red-500 focus:text-red-500 cursor-pointer">
                Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Confirm Logout</DialogTitle>
               <DialogDescription>
                 Are you sure you want to log out of your account?
               </DialogDescription>
             </DialogHeader>
             <DialogFooter className="flex gap-2 justify-end">
               <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
               <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
             </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>User Profile</DialogTitle>
                    <DialogDescription>
                        Manage your profile details and preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative h-24 w-24">
                        <Avatar className="h-24 w-24 border-4 border-white/10 shadow-xl">
                                <AvatarImage src={userProfile.avatar} className="object-cover" />
                                <AvatarFallback className="text-2xl">{userProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg">{userProfile.name}</h3>
                            {userProfile.username && (
                                <p className="text-sm font-medium text-primary">@{userProfile.username}</p>
                            )}
                            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 mt-2">
                        {isAdminUser && (
                          <>
                            <Button variant="outline" className="w-full" onClick={() => {
                                setShowProfileDialog(false);
                                router.push('/settings');
                            }}>
                                Edit Profile
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => {
                                setShowProfileDialog(false);
                                router.push('/settings?section=change-password');
                            }}>
                                Change Password
                            </Button>
                          </>
                        )}
                        {!isAdminUser && (
                           <div className="col-span-2 text-center text-sm text-muted-foreground italic py-2">
                               Contact administrator to modify profile
                           </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={() => setShowProfileDialog(false)} variant="ghost">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
