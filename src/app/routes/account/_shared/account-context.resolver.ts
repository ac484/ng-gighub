import { Injectable, inject } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Minimal Account context resolver.
 * Replace the body of `resolve` with real fetching logic (e.g., from an AccountService).
 */
@Injectable({ providedIn: 'root' })
export class AccountContextResolver implements Resolve<any> {
  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<any> {
    // Placeholder: return an empty context so routes depending on resolved data work.
    // In a real app inject an AccountService with `inject(AccountService)` and fetch the context.
    return of({});
  }
}
