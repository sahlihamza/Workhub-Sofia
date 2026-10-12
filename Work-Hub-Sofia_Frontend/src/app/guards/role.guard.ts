import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles: string[] = route.data['roles'];
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      // Pas connecté → redirection vers login ou dashboard
      this.router.navigate(['/dashboard']);
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;

      if (expectedRoles && expectedRoles.length > 0) {
        if (!expectedRoles.includes(userRole)) {
          // Rôle non autorisé → redirection
          this.router.navigate(['/dashboard']);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // Token malformé → redirection
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}
