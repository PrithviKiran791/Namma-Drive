import { Show, UserButton, useAuth } from '@clerk/react';
import './UserAuthBar.css';

export default function UserAuthBar({ onNavigate }) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="uab-skeleton" aria-hidden />;
  }

  return (
    <div className="uab-wrap">
      <Show when="signed-out">
        <button type="button" className="uab-login" onClick={() => onNavigate('login')}>
          Log in
        </button>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: { avatarBox: 'uab-avatar' },
          }}
        />
      </Show>
    </div>
  );
}
