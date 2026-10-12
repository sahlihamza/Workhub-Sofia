import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:3000/auth';
  private apiUrlUser = 'http://localhost:3000/user';

  constructor(private http: HttpClient) {}

  login(email: string, motDePasse: string): Observable<any> {
    const body = { email, motDePasse };
    return this.http.post(`${this.apiUrl}/login`, body);
  }

  getUsers(): Observable<User[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<User[]>(this.apiUrlUser, { headers });
  }

  findUsersByRole(roles: string[]): Observable<User[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('Utilisateur non authentifié.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const rolesQueryParam = roles.join(',');

    const url = `${this.apiUrlUser}/by-roles?roles=${rolesQueryParam}`;

    return this.http.get<User[]>(url, { headers }).pipe(
      catchError(err => {
        console.error(`Erreur lors de la récupération des utilisateurs par rôles "${rolesQueryParam}"`, err);
        return throwError(() => err);
      })
    );
  }

  deleteUser(id: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrlUser}/${id}`, { headers });
  }

  updateUser(id: number, updatedUser: any): Observable<User> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('Utilisateur non authentifié.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<User>(`${this.apiUrlUser}/${id}`, updatedUser, { headers }).pipe(
      catchError(err => {
        console.error('Erreur lors de la mise à jour utilisateur', err);
        return throwError(() => err);
      })
    );
  }

  getProfile(): Observable<User> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('Token manquant'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<User>(`${this.apiUrlUser}/me`, { headers }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du profil', error);
        return throwError(() => error);
      })
    );
  }

  createUser(userData: any): Observable<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return throwError(() => new Error('Utilisateur non authentifié.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrlUser}`, userData, { headers }).pipe(
      catchError(err => {
        console.error('Erreur lors de la création utilisateur', err);
        return throwError(() => err);
      })
    );
  }

  getAvailableCollaborators(): Observable<User[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<User[]>(`${this.apiUrlUser}/role/collaborateur/available`, { headers });
  }

  assignTeamToUser(userId: number, equipeId: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.patch(`${this.apiUrlUser}/${userId}/assign-team`, { equipeId }, { headers });
  }

  assignPosition(userId: number, posteId: number | null): Observable<User> {
    const url = `${this.apiUrlUser}/${userId}/assign-position`;
    const body = { posteId: posteId };
    return this.http.patch<User>(url, body);
  }

  unassignPosition(userId: number): Observable<User> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${this.apiUrlUser}/${userId}/assign-position`;
    const body = { posteId: null };


    return this.http.patch<User>(url, body, { headers });
  }

updateMyProfile(updatedUser: any): Observable<any> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return throwError(() => new Error('Utilisateur non authentifié.'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.patch(`${this.apiUrlUser}/me`, updatedUser, { headers }).pipe(
    catchError(err => {
      console.error('Erreur lors de la mise à jour du profil utilisateur connecté', err);
      return throwError(() => err);
    })
  );
}


updatePassword(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<any> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return throwError(() => new Error('Utilisateur non authentifié.'));
  }

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const body = {
    ancienMotDePasse,
    nouveauMotDePasse
  };

  return this.http.patch(`${this.apiUrlUser}/updatePassword`, body, { headers }).pipe(
    catchError(err => {
      console.error('Erreur lors de la mise à jour du mot de passe', err);
      return throwError(() => err);
    })
  );
}
  getUsersByTeamId(teamId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/team/${teamId}`);
  }

  getAvailableAdmins(): Observable<User[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<User[]>(`${this.apiUrlUser}/available-admins`, { headers });
  }

  getAvailableDepartmentHeads(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/available-department-heads`);
  }

  getUsersByDepartmentPaginated(departmentId: number, page: number, limit: number): Observable<any> {
    const url = `${this.apiUrlUser}/department/${departmentId}/members?page=${page}&limit=${limit}`;
    return this.http.get<any>(url);
  }

  unassignDepartment(userId: number): Observable<any> {
    return this.http.patch(`${this.apiUrlUser}/${userId}/unassign-department`, {});
  }

  getAvailableMembers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/available-members`);
  }

  assignDepartment(userId: number, departmentId: number): Observable<any> {
    return this.http.patch(`${this.apiUrlUser}/${userId}/assign-department`, { departmentId });
  }

  getUsersByTeamPaginated(teamId: number, page: number, limit: number): Observable<any> {
    const url = `${this.apiUrlUser}/team/${teamId}/members?page=${page}&limit=${limit}`;
    return this.http.get<any>(url);
  }

  unassignTeam(userId: number): Observable<any> {
    return this.http.patch(`${this.apiUrlUser}/${userId}/unassign-team`, {});
  }

  getAvailableTeamLeads(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/available-team-leads`);
  }

  getCollaboratorsForPositioning(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/collaborators-for-positioning`);
  }

 AddCompensation(userId?: number, jours?: number): Observable<any> {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(`${this.apiUrlUser}/add-compensation`,
    { userId, jours },
    { headers }
  );
}


  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/all/simple`);
  }

  findAllUsersSimple(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/all/simple`);
  }

  getViewableUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrlUser);
  }

  getUsersByDepartment(departmentId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrlUser}/by-department/${departmentId}`);
  }

}
