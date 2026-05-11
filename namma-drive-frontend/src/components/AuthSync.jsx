import { useEffect } from 'react';
import { useUser } from '@clerk/react';
import { userAPI } from '../api';

export default function AuthSync() {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        try {
          await userAPI.sync({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.username || 'User',
            imageUrl: user.imageUrl,
          });
        } catch (err) {
          console.error('Failed to sync user with MongoDB:', err);
        }
      };
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
