import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Department} from "./departement.service";

export interface Poste {
  id: number;
  nomPoste: string;
  description: string;
  departement: Department;
}

@Injectable({
  providedIn: 'root'
})
export class PostesService {

  private apiUrl = 'http://localhost:3000/postes';

  constructor(private http: HttpClient) { }

  getPostes(): Observable<Poste[]> {
    return this.http.get<Poste[]>(this.apiUrl);
  }

  addPoste(poste: { nomPoste: string }): Observable<Poste> {
    return this.http.post<Poste>(this.apiUrl, poste);
  }

  updatePoste(id: number, poste: { nomPoste: string }): Observable<Poste> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch<Poste>(url, poste);
  }

  deletePoste(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url);
  }

  getPostesByDepartment(departmentId: number): Observable<Poste[]> {
    return this.http.get<Poste[]>(`${this.apiUrl}/by-department/${departmentId}`);
  }

}
