```instructions
---
description: 'Enterprise-level Angular 20 architectural patterns and best practices'
applyTo: '**/*.ts'
---

# Enterprise Angular 20 Architecture

Enterprise-level architectural patterns, best practices, and design guidelines for scalable Angular 20 applications.

## Core Architectural Principles

### 1. Separation of Concerns

Organize code into distinct layers with clear responsibilities:

**Presentation Layer** (Components)
- Handle UI rendering and user interactions
- Delegate business logic to services
- Use OnPush change detection
- Keep components thin and focused

**Business Logic Layer** (Services/Facades)
- Encapsulate business rules and workflows
- Coordinate between multiple data sources
- Manage application state
- Provide reusable business operations

**Data Access Layer** (Repositories)
- Abstract data source implementations
- Handle API calls and database queries
- Implement caching strategies
- Provide consistent data interfaces

**Infrastructure Layer**
- Cross-cutting concerns (logging, error handling)
- HTTP interceptors
- Authentication/Authorization
- Configuration management

### 2. Dependency Injection

Use Angular's DI system effectively:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  
  // Service implementation
}
```

**Best Practices**:
- Use `inject()` function in constructors or class fields
- Prefer `providedIn: 'root'` for singleton services
- Use `providedIn: 'any'` for module-scoped services
- Inject abstractions, not concrete implementations

### 3. State Management

#### Signal-Based State

Use Angular Signals for reactive state management:

```typescript
import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  // Private state
  private _users = signal<User[]>([]);
  private _selectedId = signal<string | null>(null);
  
  // Public read-only state
  readonly users = this._users.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  
  // Computed values
  readonly selectedUser = computed(() => {
    const id = this._selectedId();
    return this._users().find(u => u.id === id) || null;
  });
  
  readonly userCount = computed(() => this._users().length);
  
  // Actions
  setUsers(users: User[]): void {
    this._users.set(users);
  }
  
  addUser(user: User): void {
    this._users.update(users => [...users, user]);
  }
  
  updateUser(id: string, updates: Partial<User>): void {
    this._users.update(users =>
      users.map(u => u.id === id ? { ...u, ...updates } : u)
    );
  }
  
  deleteUser(id: string): void {
    this._users.update(users => users.filter(u => u.id !== id));
  }
  
  selectUser(id: string): void {
    this._selectedId.set(id);
  }
}
```

#### Service-Based State

For complex state management, use service patterns:

```typescript
import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

interface AppState {
  loading: boolean;
  error: string | null;
  data: any[];
}

@Injectable({ providedIn: 'root' })
export class StateService {
  private state = signal<AppState>({
    loading: false,
    error: null,
    data: []
  });
  
  // Public getters
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly data = computed(() => this.state().data);
  
  setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }
  
  setError(error: string | null): void {
    this.state.update(s => ({ ...s, error }));
  }
  
  setData(data: any[]): void {
    this.state.update(s => ({ ...s, data, error: null }));
  }
}
```

## Design Patterns

### 1. Facade Pattern

Simplify complex subsystems with a unified interface:

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectFacade {
  private projectRepo = inject(ProjectRepository);
  private taskRepo = inject(TaskRepository);
  private userRepo = inject(UserRepository);
  
  // Expose simplified API
  getProjectDetails(projectId: string): Observable<ProjectDetails> {
    return combineLatest([
      this.projectRepo.getById(projectId),
      this.taskRepo.getByProject(projectId),
      this.userRepo.getProjectMembers(projectId)
    ]).pipe(
      map(([project, tasks, members]) => ({
        project,
        tasks,
        members,
        progress: this.calculateProgress(tasks)
      }))
    );
  }
  
  private calculateProgress(tasks: Task[]): number {
    const completed = tasks.filter(t => t.status === 'completed').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }
}
```

### 2. Repository Pattern

Abstract data access logic:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CacheService } from '@delon/cache';

export interface Repository<T> {
  getAll(): Observable<T[]>;
  getById(id: string): Observable<T>;
  create(entity: T): Observable<T>;
  update(id: string, entity: Partial<T>): Observable<T>;
  delete(id: string): Observable<void>;
}

@Injectable({ providedIn: 'root' })
export class ProjectRepository implements Repository<Project> {
  private http = inject(HttpClient);
  private cache = inject(CacheService);
  private baseUrl = '/api/projects';
  
  getAll(): Observable<Project[]> {
    const cached = this.cache.get('projects');
    if (cached) return of(cached);
    
    return this.http.get<Project[]>(this.baseUrl).pipe(
      tap(projects => this.cache.set('projects', projects, { expire: 300 }))
    );
  }
  
  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }
  
  create(project: Project): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, project).pipe(
      tap(() => this.cache.remove('projects'))
    );
  }
  
  update(id: string, updates: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, updates).pipe(
      tap(() => this.cache.remove('projects'))
    );
  }
  
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.cache.remove('projects'))
    );
  }
}
```

### 3. Strategy Pattern

Encapsulate algorithms and make them interchangeable:

```typescript
// Strategy interface
export interface ValidationStrategy {
  validate(value: any): boolean;
  getErrorMessage(): string;
}

// Concrete strategies
export class EmailValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  getErrorMessage(): string {
    return 'Invalid email format';
  }
}

export class PhoneValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    return /^\+?[\d\s-()]+$/.test(value);
  }
  
  getErrorMessage(): string {
    return 'Invalid phone number';
  }
}

// Context
@Injectable({ providedIn: 'root' })
export class ValidationService {
  private strategies = new Map<string, ValidationStrategy>();
  
  constructor() {
    this.strategies.set('email', new EmailValidationStrategy());
    this.strategies.set('phone', new PhoneValidationStrategy());
  }
  
  validate(type: string, value: any): ValidationResult {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unknown validation type: ${type}`);
    }
    
    const isValid = strategy.validate(value);
    return {
      isValid,
      errorMessage: isValid ? null : strategy.getErrorMessage()
    };
  }
}
```

### 4. Observer Pattern (with RxJS)

Implement reactive data flows:

```typescript
import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export enum EventType {
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_LOGGED_OUT = 'USER_LOGGED_OUT',
  DATA_UPDATED = 'DATA_UPDATED'
}

export interface AppEvent {
  type: EventType;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class EventBus {
  private eventSubject = new Subject<AppEvent>();
  
  emit(event: AppEvent): void {
    this.eventSubject.next(event);
  }
  
  on(type: EventType): Observable<AppEvent> {
    return this.eventSubject.pipe(
      filter(event => event.type === type)
    );
  }
  
  onAny(): Observable<AppEvent> {
    return this.eventSubject.asObservable();
  }
}

// Usage
@Component({...})
export class HeaderComponent implements OnInit {
  private eventBus = inject(EventBus);
  
  ngOnInit(): void {
    this.eventBus.on(EventType.USER_LOGGED_IN).subscribe(event => {
      console.log('User logged in:', event.payload);
    });
  }
}
```

## Modular Architecture

### Feature Modules

Organize features as self-contained modules:

```typescript
// Feature structure
src/app/features/
├── user-management/
│   ├── components/
│   │   ├── user-list/
│   │   ├── user-detail/
│   │   └── user-form/
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── user-store.ts
│   │   └── user.repository.ts
│   ├── models/
│   │   └── user.model.ts
│   ├── guards/
│   │   └── user.guard.ts
│   └── user-management.routes.ts
```

### Lazy Loading

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => 
      import('./features/user-management/user-management.routes')
        .then(m => m.USER_MANAGEMENT_ROUTES)
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('./features/projects/projects.routes')
        .then(m => m.PROJECT_ROUTES)
  }
];
```

## Error Handling

### Global Error Handler

```typescript
import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private message = inject(NzMessageService);
  private logger = inject(LoggerService);
  
  handleError(error: Error | HttpErrorResponse): void {
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else {
      this.handleClientError(error);
    }
  }
  
  private handleHttpError(error: HttpErrorResponse): void {
    this.logger.error('HTTP Error:', error);
    
    switch (error.status) {
      case 401:
        this.message.error('Unauthorized. Please login again.');
        break;
      case 403:
        this.message.error('Access denied.');
        break;
      case 404:
        this.message.error('Resource not found.');
        break;
      case 500:
        this.message.error('Server error. Please try again later.');
        break;
      default:
        this.message.error('An error occurred. Please try again.');
    }
  }
  
  private handleClientError(error: Error): void {
    this.logger.error('Client Error:', error);
    this.message.error('An unexpected error occurred.');
  }
}

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
```

### HTTP Interceptor

```typescript
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  return next(req).pipe(
    retry(2),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

## Performance Optimization

### Virtual Scrolling

```typescript
import { Component, signal } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-large-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items()" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 600px;
      width: 100%;
    }
    .item {
      height: 50px;
      padding: 10px;
    }
  `]
})
export class LargeListComponent {
  items = signal<any[]>(
    Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  );
}
```

### Memoization

```typescript
import { computed, signal } from '@angular/core';

export class DataService {
  private data = signal<any[]>([]);
  
  // Memoized computation
  readonly filteredData = computed(() => {
    const items = this.data();
    return items.filter(item => item.active);
  });
  
  // Only recalculates when data changes
  readonly expensiveComputation = computed(() => {
    return this.data().reduce((acc, item) => {
      // Complex calculation
      return acc + item.value;
    }, 0);
  });
}
```

### Trackby Functions

```typescript
@Component({
  template: `
    <div *ngFor="let item of items(); trackBy: trackById">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  items = signal<Item[]>([]);
  
  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

## Testing Strategies

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('should fetch projects', () => {
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' }
    ];
    
    service.getAll().subscribe(projects => {
      expect(projects).toEqual(mockProjects);
    });
    
    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });
});
```

### Integration Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '@core/services/project.service';
import { of } from 'rxjs';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  
  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProjectService', ['getAll']);
    
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        { provide: ProjectService, useValue: spy }
      ]
    }).compileComponents();
    
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
  });
  
  it('should load projects on init', () => {
    const mockProjects = [{ id: '1', name: 'Test' }];
    projectService.getAll.and.returnValue(of(mockProjects));
    
    fixture.detectChanges();
    
    expect(component.projects()).toEqual(mockProjects);
  });
});
```

## Security Best Practices

### Input Sanitization

```typescript
import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SanitizationService {
  private sanitizer = inject(DomSanitizer);
  
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, html) || '';
  }
  
  sanitizeUrl(url: string): string {
    return this.sanitizer.sanitize(SecurityContext.URL, url) || '';
  }
}
```

### XSS Prevention

```typescript
// Always use property binding for dynamic content
@Component({
  template: `
    <!-- Safe -->
    <div [textContent]="userInput"></div>
    
    <!-- Unsafe -->
    <div>{{ userInput }}</div>
  `
})
```

## Documentation Standards

Use JSDoc for all public APIs:

```typescript
/**
 * Service for managing user data and operations.
 * 
 * @example
 * ```typescript
 * const userService = inject(UserService);
 * userService.getAll().subscribe(users => {
 *   console.log(users);
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  /**
   * Fetches all users from the API.
   * 
   * @returns Observable of user array
   * @throws {HttpErrorResponse} When API request fails
   */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

## Conclusion

Enterprise Angular applications require:
- Clear architectural boundaries
- Consistent patterns and practices
- Comprehensive error handling
- Performance optimization
- Thorough testing
- Security by design
- Maintainable documentation

Follow these patterns to build scalable, maintainable applications.
```
