import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  to: string
  end?: boolean
  activeClassName?: string
  children: React.ReactNode
}

export function NavLink({
  to,
  end = false,
  className,
  activeClassName = '',
  children,
  ...props
}: NavLinkProps) {
  const location = useLocation()
  const isActive = end
    ? location.pathname === to
    : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  )
}
