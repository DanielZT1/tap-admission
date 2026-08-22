import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppUser, AuditLog, LoginResponse, Product, Profile } from './api.models';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${apiUrl}/login`, { email, password });
  }

  recoverPassword(email: string) {
    return this.http.post<{ message: string }>(`${apiUrl}/recover-password`, { email });
  }

  logout() {
    return this.http.post<{ message: string }>(`${apiUrl}/logout`, {});
  }

  auditLogs() {
    return this.http.get<AuditLog[]>(`${apiUrl}/audit-logs`);
  }

  products() {
    return this.http.get<Product[]>(`${apiUrl}/products`);
  }

  saveProduct(payload: Partial<Product>, id?: string) {
    return id
      ? this.http.put<Product>(`${apiUrl}/products/${id}`, payload)
      : this.http.post<Product>(`${apiUrl}/products`, payload);
  }

  deleteProduct(id: string) {
    return this.http.delete(`${apiUrl}/products/${id}`);
  }

  profiles() {
    return this.http.get<Profile[]>(`${apiUrl}/profiles`);
  }

  profile(id: string) {
    return this.http.get<Profile>(`${apiUrl}/profiles/${id}`);
  }

  saveProfile(payload: Partial<Profile>, id?: string) {
    return id
      ? this.http.put<Profile>(`${apiUrl}/profiles/${id}`, payload)
      : this.http.post<Profile>(`${apiUrl}/profiles`, payload);
  }

  deleteProfile(id: string) {
    return this.http.delete(`${apiUrl}/profiles/${id}`);
  }

  users() {
    return this.http.get<AppUser[]>(`${apiUrl}/users`);
  }

  user(id: string) {
    return this.http.get<AppUser>(`${apiUrl}/users/${id}`);
  }

  saveUser(payload: FormData, id?: string) {
    return id
      ? this.http.post<AppUser>(`${apiUrl}/users/${id}?_method=PUT`, payload)
      : this.http.post<AppUser>(`${apiUrl}/users`, payload);
  }

  deleteUser(id: string) {
    return this.http.delete(`${apiUrl}/users/${id}`);
  }

  downloadUrl(resource: 'products' | 'users' | 'profiles', type: 'pdf' | 'excel'): string {
    return `${apiUrl}/${resource}/export/${type}`;
  }

  download(resource: 'products' | 'users' | 'profiles', type: 'pdf' | 'excel') {
    return this.http.get(this.downloadUrl(resource, type), {
      responseType: 'blob',
    });
  }
}
