import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth/authService';
import { useConfig } from '@/providers/ConfigProvider';

export function UserPage() {
  const { toast } = useToast();
  const config = useConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    username: '',
    email: '',
    display_name: '',
  });
  const [passwords, setPasswords] = useState({
    new_password1: '',
    new_password2: '',
  });

  // Fetch user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await authService.getUserDetails();
        if (userDetails) {
          setUser({
            username: userDetails.username || '',
            email: userDetails.email || '',
            display_name: userDetails.display_name || userDetails.first_name || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch user details',
          variant: 'destructive',
        });
      }
    };

    fetchUserDetails();
  }, [toast]);

  // Handle user details update
  const handleUpdateUser = async () => {
    setIsLoading(true);
    try {
      // Only send email and display_name as they are the only fields that can be updated
      const updatedUser = await authService.updateUserDetails(config.apis.meshBot.baseUrl, {
        email: user.email,
        display_name: user.display_name,
      });

      if (updatedUser) {
        toast({
          title: 'Success',
          description: 'User details updated successfully',
        });
      }
    } catch (error) {
      console.error('Failed to update user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwords.new_password1 !== passwords.new_password2) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(config.apis.meshBot.baseUrl, passwords);
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      // Clear password fields
      setPasswords({
        new_password1: '',
        new_password2: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View and update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={user.username} disabled readOnly />
            <p className="text-sm text-muted-foreground">Username cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={user.display_name}
              onChange={(e) => setUser({ ...user, display_name: e.target.value })}
            />
          </div>

          <Button onClick={handleUpdateUser} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwords.new_password1}
              onChange={(e) => setPasswords({ ...passwords, new_password1: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwords.new_password2}
              onChange={(e) => setPasswords({ ...passwords, new_password2: e.target.value })}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isLoading || !passwords.new_password1 || !passwords.new_password2}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
