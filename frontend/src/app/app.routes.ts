import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { ProductsComponent } from './features/products/products.component';
import { ProfilesComponent } from './features/profiles/profiles.component';
import { UsersComponent } from './features/users/users.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'profiles', component: ProfilesComponent },
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: '**', redirectTo: 'products' },
];
