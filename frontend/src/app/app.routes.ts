import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { AuditLogsComponent } from './features/audit-logs/audit-logs.component';
import { ProductsComponent } from './features/products/products.component';
import { ProfilesComponent } from './features/profiles/profiles.component';
import { UsersComponent } from './features/users/users.component';
import { sectionGuard } from './core/section.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent, canActivate: [sectionGuard], data: { section: 'products' } },
  { path: 'users', component: UsersComponent, canActivate: [sectionGuard], data: { section: 'users' } },
  { path: 'profiles', component: ProfilesComponent, canActivate: [sectionGuard], data: { section: 'profiles' } },
  { path: 'audit-logs', component: AuditLogsComponent, canActivate: [sectionGuard], data: { section: 'audit_logs' } },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'products' },
];
