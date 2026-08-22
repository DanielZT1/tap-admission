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

export const sectionGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const user = session.user();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  const requiredSection = route.data['section'] as string | undefined;

  if (!requiredSection || session.can(requiredSection)) {
    return true;
  }

  const fallbackSection = fallbackByPriority.find((section) => session.can(section));

  return router.createUrlTree([fallbackSection ? pathBySection[fallbackSection] : '/login']);
};
