// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.access_token) {
          localStorage.setItem('auth_token', response.access_token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

 //envoyer le mail
  forgotPassword(email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/forgot-password`, { email });
}
//mettre le nouveau mot de passe
 resetPassword(resetToken: string, motDePasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { resetToken, motDePasse });
  }


  public isLoggedIn(): boolean {
    return localStorage.getItem('auth_token') !== null;
  }
}
