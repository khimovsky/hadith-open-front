import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import type { ErrorStatus } from '../models/error-status.model';

export class ApiService {
  private readonly apiUrl: string = environment.api_url;

  public get<T>(url: string, params: Record<string, string> = {}): Observable<T> {
    const queryString = new URLSearchParams(params).toString();
    return this.toObservable<T>(fetch(`${this.apiUrl}${url}?${queryString}`, {
      method: 'GET',
      headers: this.headers,
    }));
  }

  public post<T, D>(url: string, data?: D): Observable<T> {
    return this.toObservable<T>(fetch(`${this.apiUrl}${url}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    }));
  }

  public put<T, D>(url: string, data: D): Observable<T> {
    return this.toObservable<T>(fetch(`${this.apiUrl}${url}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data),
    }));
  }

  public delete<T>(url: string): Observable<T> {
    return this.toObservable<T>(fetch(`${this.apiUrl}${url}`, {
      method: 'DELETE',
      headers: this.headers,
    }));
  }

  private get headers(): { [key: string]: string } {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private toObservable<T>(fetchPromise: Promise<Response>): Observable<T> {
    return new Observable<T>(observer => {
      fetchPromise
        .then(response => this.handleResponse<T>(response))
        .then(data => {
          if (data !== undefined) {
            observer.next(data);
          } else {
            observer.error({ status: 204, message: 'No content' } as ErrorStatus);
          }
          observer.complete();
        })
        .catch(error => observer.error(this.createErrorStatus(error)));
    });
  }

  private async handleResponse<T>(response: Response): Promise<T | undefined> {
    if (!response.ok) {
      return response.text().then(text => {
        throw this.createErrorStatus({
          status: response.status,
          message: text,
        });
      });
    }
    return response.json().then(data => data as T);
  }

  private createErrorStatus(error: any): ErrorStatus {
    if (typeof error === 'string') {
      return {
        status: 500,
        message: error,
      };
    }
    return {
      status: error.status || 500,
      ...error,
    };
  }
}