import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

const fallbackByPriority = ['products', 'users', 'profiles', 'audit_logs'];
const pathBySection: Record<string, string> = {
  products: '/products',
  users: '/users',
  profiles: '/profiles',
  audit_logs: '/audit-logs',
};

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const user = session.user();

  if (!user) {
    return true;
  }

  const fallbackSection = fallbackByPriority.find((section) => session.can(section));

  return router.createUrlTree([fallbackSection ? pathBySection[fallbackSection] : '/products']);
};
