import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders, HttpResponse} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduleEntry } from '../models/schedule-entry.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/planning`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getEntriesForMonth(date: Date, userId?: number): Observable<ScheduleEntry[]> {
    let params = new HttpParams()
      .set('year', date.getFullYear().toString())
      .set('month', (date.getMonth() + 1).toString());

    if (userId) {
      params = params.set('userId', userId.toString());
    }

    return this.http.get<ScheduleEntry[]>(this.apiUrl, { headers: this.getAuthHeaders(), params });
  }

  saveEntry(entry: Partial<ScheduleEntry>, userId?: number): Observable<ScheduleEntry> {
    const payload: any = {
      date: entry.date,
      status: entry.status,
      notes: entry.notes,
    };

    if (userId) {
      payload.userId = userId;
    }
    return this.http.post<ScheduleEntry>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }



  deleteEntry(date: string, userId?: number): Observable<any> {
    const options = {
      headers: this.getAuthHeaders(),
      body: {
        date,
        userId
      }
    };
    return this.http.delete(this.apiUrl, options);
  }

  exportPlanning(filters: { searchTerm?: string; departmentId?: number; teamId?: number; userId?: number }): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }
    if (filters.departmentId) {
      params = params.set('departmentId', filters.departmentId.toString());
    }
    if (filters.teamId) {
      params = params.set('teamId', filters.teamId.toString());
    }
    if (filters.userId) {
      params = params.set('userId', filters.userId.toString());
    }

    return this.http.get(`${this.apiUrl}/export`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      observe: 'response',
      params: params
    });
  }
}
