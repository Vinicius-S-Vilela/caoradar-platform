import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;
  private readonly uploadPreset = environment.cloudinary.uploadPreset;

  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post<{ secure_url: string }>(this.uploadUrl, formData).pipe(
      map(res => res.secure_url),
      catchError((err) => {
        const msg = err?.error?.error?.message || err?.message || 'Erro desconhecido';
        return throwError(() => new Error(`Falha ao enviar "${file.name}": ${msg}`));
      })
    );
  }

  uploadImages(files: File[]): Observable<string[]> {
    return forkJoin(files.map(f => this.uploadImage(f)));
  }
}
