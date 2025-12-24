import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch('https://oneceylon.space/api/profile', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        router.push('/login');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await fetch('https://oneceylon.space/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Welcome to your profile, {user.name}!
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-card-foreground font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-card-foreground font-medium">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
