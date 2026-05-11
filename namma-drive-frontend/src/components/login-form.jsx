import { useState } from 'react';
import { useSignIn, useSignUp, useAuth } from '@clerk/react';
import { GalleryVerticalEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function clerkErrorMessage(err) {
  if (!err) return 'Something went wrong.';
  const e = err.errors?.[0];
  return e?.longMessage || e?.message || err.message || 'Something went wrong.';
}

export function LoginForm({ className, onSuccess }) {
  const { isLoaded: authLoaded } = useAuth();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loaded = authLoaded;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!signIn) return;
    setBusy(true);
    try {
      await signIn.create({ identifier: email.trim(), password });
      if (signIn.status === 'complete') {
        await setActiveSignIn({ session: signIn.createdSessionId });
        onSuccess?.();
      } else {
        setError('Additional sign-in steps are required. Check your Clerk dashboard settings.');
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!signUp) return;
    setBusy(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      if (signUp.status === 'complete') {
        await setActiveSignUp({ session: signUp.createdSessionId });
        onSuccess?.();
        return;
      }

      try {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setMode('verify');
      } catch {
        setError('Could not start email verification. In Clerk Dashboard, enable email or disable mandatory verification for development.');
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!signUp) return;
    setBusy(true);
    try {
      await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (signUp.status === 'complete') {
        await setActiveSignUp({ session: signUp.createdSessionId });
        onSuccess?.();
      } else {
        setError('Verification incomplete. Check the code and try again.');
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <Card className={cn('w-full max-w-sm border-border shadow-md opacity-60 animate-pulse', className)}>
        <CardHeader className="space-y-2">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="h-10 w-full bg-primary/20 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (mode === 'verify') {
    return (
      <Card className={cn('w-full max-w-sm border-border shadow-md', className)}>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-5" />
            </div>
            <CardTitle className="text-xl">Verify email</CardTitle>
          </div>
          <CardDescription>Enter the code we sent to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="grid gap-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Verifying…' : 'Complete sign up'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setMode('signup'); setCode(''); setError(''); }}>
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-sm border-border shadow-md', className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-5" />
          </div>
          <CardTitle className="text-xl">{mode === 'signin' ? 'Welcome back' : 'Create account'}</CardTitle>
        </div>
        <CardDescription>
          {mode === 'signin' ? 'Sign in with your email and password.' : 'Sign up with email and password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex rounded-lg border border-border p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
              mode === 'signin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
              mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="grid gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
