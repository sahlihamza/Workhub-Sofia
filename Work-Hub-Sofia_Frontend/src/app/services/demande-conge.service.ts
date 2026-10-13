import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemandeCongeService {

  private apiUrl = `${environment.apiUrl}/demande-conge`;

  constructor(private http: HttpClient) { }

  createDemande(demande: any): Observable<{ message: string }> {
    const token = localStorage.getItem('access_token'); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{ message: string }>(this.apiUrl, demande, { headers });
  }

  getAllDemandes(): Observable<any[]> {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<any[]>(`${this.apiUrl}`, { headers });
}

traiterDemande(id: number, statut: 'confirmee' | 'rejettee'): Observable<{ message: string }> {
  const token = localStorage.getItem('access_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.patch<{ message: string }>(
    `${this.apiUrl}/traiter/${id}`,
    { statut },
    { headers }
  );
}


}
