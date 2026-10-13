import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Team {
  responsable: any;
  departement: any;
  responsableEquipeId: number;
  id: number;
  nomEquipe: string;
  descriptionEquipe: string;
  nbMembres: number;
  departementId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/equipe`;

  constructor(private http: HttpClient) {}

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  getTeamsByManagerId(managerId: number): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/manager/${managerId}`);
  }

  getTeamsByDepartmentId(departmentId: number): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/department/${departmentId}`);
  }

  createTeam(teamData: any): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, teamData);
  }

  updateTeam(id: number, teamData: any): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/${id}`, teamData);
  }

  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTeamById(id: number): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${id}`);
  }


}
