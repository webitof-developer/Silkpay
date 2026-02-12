'use client';

import { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/userService';
import { getCurrentUser } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Pencil, Trash2, Shield, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagementPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <UserManagementContent />
    </RoleGuard>
  );
}

function UserManagementContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '', // Added username
    email: '',
    password: '',
    role: 'USER'
  });
  const [submitting, setSubmitting] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'USER'
    });
    setDialogOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || '', // Load existing username
      email: user.email,
      password: '',
      role: user.role
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          username: formData.username, // Include username
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const updatedUserResponse = await updateUser(editingUser.id, updateData);
        
        // If updating self, notify header to update profile
        // If updating self, notify header to update profile
        const currentUserId = currentUser.id || currentUser._id;
        const editingUserId = editingUser.id || editingUser._id;
        
        if (currentUser && currentUserId === editingUserId) {
            window.dispatchEvent(new CustomEvent('settings-updated', { detail: updatedUserResponse }));
        }

        toast.success('User updated successfully');
      } else {
        // Create new user
        await createUser({
          ...formData, // Includes username
          merchant_id: currentUser.merchant_id
        });
        toast.success('User created successfully');
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to create user', {
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user', {
        description: error.message
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <Button onClick={handleCreateClick}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage user accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Create your first user to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const cells = [
                    (
                      <TableCell key="user">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                    ),
                    (
                      <TableCell key="role">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                    ),
                    (
                      <TableCell key="username" className="text-muted-foreground">
                        {user.username ? `@${user.username}` : '-'}
                      </TableCell>
                    ),
                    (
                      <TableCell key="status">
                        <Badge variant={user.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    ),
                    (
                      <TableCell key="actions" className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )
                  ];

                  return <TableRow key={user.id}>{cells}</TableRow>;
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details and permissions.' : 'Create a new user account for your team.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username (Optional)</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!editingUser}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {(() => {
                const currentUserId = currentUser?.id || currentUser?._id;
                const editingUserId = editingUser?.id || editingUser?._id;
                const isEditingSelf = editingUser && currentUserId && editingUserId && currentUserId === editingUserId;
                
                return (
                  <>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={isEditingSelf}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User (Standard Access)</SelectItem>
                        <SelectItem value="ADMIN">Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditingSelf && (
                      <p className="text-[0.8rem] text-muted-foreground">
                          You cannot change your own role.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for
              <span className="font-semibold text-foreground mx-1">{userToDelete?.name}</span>
               ({userToDelete?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {userToDelete && (
             <div className="bg-muted/50 p-4 rounded-md border text-sm space-y-2">
                 <div className="flex justify-between">
                     <span className="text-muted-foreground">User Name:</span>
                     <span className="font-medium">{userToDelete.name}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-muted-foreground">Email:</span>
                     <span className="font-medium">{userToDelete.email}</span>
                 </div>
                 <div className="flex justify-between">
                     <span className="text-muted-foreground">Role:</span>
                     <Badge variant="outline" className="text-xs py-0 h-5">{userToDelete.role}</Badge>
                 </div>
             </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
