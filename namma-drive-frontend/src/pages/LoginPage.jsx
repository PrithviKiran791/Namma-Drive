import { GalleryVerticalEnd } from 'lucide-react';
import { LoginForm } from '@/components/login-form';

export default function LoginPage({ onNavigate }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 font-medium text-foreground"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Namma Drive
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSuccess={() => onNavigate('map')} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center dark:brightness-[0.35] dark:grayscale"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(206,17,38,0.25) 0%, rgba(249,214,22,0.15) 50%, rgba(17,24,39,0.4) 100%), url(/login-hero.svg)',
          }}
          role="img"
          aria-label="Karnataka-inspired abstract map"
        />
      </div>
    </div>
  );
}
