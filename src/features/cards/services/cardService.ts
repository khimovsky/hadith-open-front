import { BehaviorSubject, Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/apiService';
import type { CardDTO } from '../models/card.model';
import type { LoadingStatus } from '../../../core/models/loading-status.model';
import type { ErrorStatus } from '../../../core/models/error-status.model';

export class CardService {
  private readonly apiService: ApiService = new ApiService();
  private readonly cardsSubject = new BehaviorSubject<CardDTO[]>([]);
  private readonly statusSubject = new BehaviorSubject<LoadingStatus>('init');
  private readonly errorSubject = new BehaviorSubject<ErrorStatus | null>(null);
  private readonly destroy$ = new Subject<void>();

  public readonly cards$ = this.cardsSubject.asObservable();
  public readonly status$ = this.statusSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  public loadCards(searchText: string): void {
    console.log(searchText);
    if (this.statusSubject.value === 'loading' || this.statusSubject.value === 'loaded') {
      return;
    }

    this.statusSubject.next('loading');

    this.apiService.get<CardDTO[]>('/task1').pipe(
      catchError((error: any) => {
        const errorStatus: ErrorStatus = { status: error.status, message: error.message };
        this.errorSubject.next(errorStatus);
        this.statusSubject.next('error');
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(cards => {
      if (this.statusSubject.value !== 'error') {
        this.cardsSubject.next(cards);
        this.statusSubject.next('loaded');
      }
    });
  }

  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}