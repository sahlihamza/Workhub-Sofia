import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface is defined inside the service file, like your example
export interface Campaign {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  // API URL matches your pattern
  private apiUrl = 'http://localhost:3000/campaigns';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }


  // getCampaignById(id: number): Observable<Campaign> {
  //   return this.http.get<Campaign>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  // }

  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    return this.http.post<Campaign>(this.apiUrl, campaign, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return throwError(() => new Error('This campaign name is already in use.'));
        }
        return throwError(() => new Error('An error occurred while creating the campaign.'));
      })
    );
  }

  updateCampaign(id: number, campaign: Partial<Campaign>): Observable<Campaign> {
    return this.http.patch<Campaign>(`${this.apiUrl}/${id}`, campaign, { headers: this.getAuthHeaders() });
  }

  deleteCampaign(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
