import { useState, useEffect } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import './UserAuthBar.css';

export default function UserAuthBar({ onNavigate }) {
  const { isSignedIn } = useUser();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('namma_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('namma_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('namma_theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="uab-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button 
        type="button" 
        className="theme-toggle-btn" 
        onClick={() => setIsDark(d => !d)}
        title="Toggle Light/Dark Theme"
      >
        {isDark ? 'Theme: Dark' : 'Theme: Light'}
      </button>

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
