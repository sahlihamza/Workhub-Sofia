// src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
// ✅ 1. Import ActivatedRouteSnapshot and Router
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
// ✅ 2. Import your UserService and jwt-decode
import { UserService } from '../services/user.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  // ✅ 3. Inject Router and UserService in the constructor
  constructor(private router: Router, private userService: UserService) {}

  // ✅ 4. Update the canActivate method to include the new logic
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('access_token');

    // First, check if user is logged in
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Now, check for role permissions
    const expectedRoles = route.data.roles as Array<string>;
    // If the route has no 'roles' data, allow access to any logged-in user
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    // Get the user's role from the token
    try {
      const decodedToken: { role: string } = jwtDecode(token);
      const userRole = decodedToken.role;

      // If the user's role is in the list of expected roles, allow access
      if (expectedRoles.includes(userRole)) {
        return true;
      }
    } catch (error) {
      console.error('Invalid token:', error);
      this.router.navigate(['/login']);
      return false;
    }

    // If the role does not match, redirect and deny access
    this.router.navigate(['/dashboard']); // Redirect to a safe page
    return false;
  }
}
