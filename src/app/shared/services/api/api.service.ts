import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { PaginatedResponse } from '../../models/conditions.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  // This is a mock service. In a real app, you would use this.http.get()
  // to fetch data from your backend.
  getSelectOptions(apiUrl: string, page: number, term: string): Observable<PaginatedResponse<any>> {
    console.log(`Fetching from ${apiUrl} page ${page} with term "${term}"`);

    const paginate = (items: any[], limit: number) => {
      const filtered = items.filter((c) => c.name.toLowerCase().includes(term.toLowerCase()));

      const totalResults = filtered.length;
      const totalPages = Math.ceil(totalResults / limit);
      const startIndex = (page - 1) * limit;
      const results = filtered.slice(startIndex, startIndex + limit);

      return {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
    };

    // Mocking customer data as an example
    if (apiUrl === '/api/customers') {
      const allCustomers = [
        { id: '68e80f7aa47e7b7821168cdb', name: 'Dai Toan', email: 'nguyentoan10@gmail.com' },
        { id: 'user_2', name: 'Jane Smith', email: 'jane.s@example.com' },
        { id: 'user_3', name: 'Peter Jones', email: 'peter.j@example.com' },
        { id: 'user_4', name: 'Mary Johnson', email: 'mary.j@example.com' },
        { id: 'user_5', name: 'Chris Lee', email: 'chris.l@example.com' },
        { id: 'user_6', name: 'Patricia Brown', email: 'pat.b@example.com' },
        { id: 'user_7', name: 'Robert Williams', email: 'rob.w@example.com' },
        { id: 'user_8', name: 'Linda Davis', email: 'linda.d@example.com' },
      ];

      const response = paginate(allCustomers, 5);
      return of(response).pipe(delay(500)); // Simulate network latency
    }

    // Mocking tag data for multi-select
    if (apiUrl === '/api/tags') {
      const allTags = [
        { id: 'vip', name: 'VIP' },
        { id: 'new_customer', name: 'New Customer' },
        { id: 'lapsed', name: 'Lapsed Customer' },
        { id: 'high_value', name: 'High Value' },
        { id: 'wholesale', name: 'Wholesale' },
        { id: 'influencer', name: 'Influencer' },
        { id: 'beta_tester', name: 'Beta Tester' },
      ];
      const response = paginate(allTags, 5);
      return of(response).pipe(delay(300));
    }

    // Fallback for other APIs
    return of({ results: [], page: 1, limit: 10, totalPages: 0, totalResults: 0 });
  }
}
