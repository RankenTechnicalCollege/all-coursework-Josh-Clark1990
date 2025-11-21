import { Navigate } from 'react-router-dom';
import { useSession, type ExtendedUser } from '@/lib/betterAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  const user = session?.user as ExtendedUser | undefined;
  const userRole = user?.role;

  // Check if user has one of the allowed roles
  const hasPermission = userRole && allowedRoles.includes(userRole);

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}