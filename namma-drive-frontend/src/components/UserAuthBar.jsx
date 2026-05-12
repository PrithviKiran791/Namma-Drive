import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import './UserAuthBar.css';

export default function UserAuthBar({ onNavigate }) {
  const { isSignedIn } = useUser();

  return (
    <div className="uab-wrap">
      {!isSignedIn ? (
        <SignInButton mode="modal">
          <button type="button" className="uab-login">
            Log in
          </button>
        </SignInButton>
      ) : (
        <div className="uab-user-menu">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonPopoverCard: "shadow-xl",
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
