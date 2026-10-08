import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cloudinary`;

  uploadImage(file: File): Observable<{url: string; public_id: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{url: string; public_id: string}>(`${this.apiUrl}/upload`, formData);
  }

  deleteImage(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
