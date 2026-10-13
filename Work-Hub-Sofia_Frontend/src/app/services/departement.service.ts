import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Department {
  id: number;
  nomDepartement: string;
  descriptionDepartement: string;
  nbEquipe: number;
  statut: boolean;
  responsable?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DepartementService {
  private apiUrl = `${environment.apiUrl}/departement`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }


  getDepartmentById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createDepartment(data: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, data, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return throwError(() => new Error('Ce nom de département est déjà utilisé.'));
        }
        return throwError(() => new Error('Erreur lors de la création du département.'));
      })
    );
  }

  updateDepartment(id: number, data: Partial<Department>): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
  }

  checkNameExists(name: any): Observable<boolean> {
    if (typeof name !== 'string' || name === '') {
      return of(false);
    }
    const params = new HttpParams().set('nomDepartement', name);

    return this.http.get<boolean>(`${this.apiUrl}/check`, { params });
  }
  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  setDepartmentHead(departmentId: number, newHeadId: number): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${departmentId}/set-head`, { newHeadId });
  }
}
