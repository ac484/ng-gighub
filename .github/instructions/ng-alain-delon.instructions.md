```instructions
---
description: 'ng-alain and Delon framework development guidelines for enterprise Angular applications'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css, **/*.less'
---

# ng-alain & Delon Framework Development

Instructions for building enterprise-level Angular applications using ng-alain framework and Delon component library (@delon/*).

## Framework Overview

ng-alain is an enterprise-class admin framework built on Angular, Ant Design (ng-zorro-antd), and the Delon library suite. It provides:
- Ready-to-use business components (@delon/abc)
- Dynamic form generation (@delon/form)
- Authentication & authorization (@delon/auth, @delon/acl)
- Caching strategies (@delon/cache)
- Chart components (@delon/chart)
- Mock data utilities (@delon/mock)
- Theming system (@delon/theme)
- Utility functions (@delon/util)

## Core Principles

- **Enterprise-First**: Design for scalability, maintainability, and team collaboration
- **Type Safety**: Leverage TypeScript for all configurations and data models
- **Consistency**: Follow ng-alain's established patterns and naming conventions
- **Performance**: Optimize for large-scale data handling and complex UIs
- **Modularity**: Create reusable components and services with clear boundaries
- **Testing**: Ensure comprehensive test coverage for business-critical features

## @delon/abc - Business Components

### ST (Simple Table) Component

The ST component is the core data table solution in ng-alain.

**Best Practices**:
- Define columns with `STColumn[]` interface for type safety
- Use `STData` interface for row data typing
- Implement `STChange` for handling table events
- Leverage built-in features: sorting, filtering, pagination, row selection
- Use column templates for custom rendering when needed
- Implement virtual scrolling for large datasets (>1000 rows)

**Common Patterns**:
```typescript
import { Component, signal } from '@angular/core';
import { STColumn, STData } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <st 
      [data]="users()" 
      [columns]="columns"
      [loading]="loading()"
      (change)="handleChange($event)"
    />
  `
})
export class UserListComponent {
  loading = signal(false);
  users = signal<STData[]>([]);
  
  columns: STColumn[] = [
    { title: 'ID', index: 'id', width: 80 },
    { title: 'Name', index: 'name', sort: true },
    { title: 'Email', index: 'email' },
    {
      title: 'Actions',
      buttons: [
        { text: 'Edit', click: (record) => this.edit(record) },
        { text: 'Delete', click: (record) => this.delete(record) }
      ]
    }
  ];
}
```

### Other @delon/abc Components

- **SVContainer/SVItem**: Detail view components for form/data display
- **SEContainer/SE**: Form layout components
- **PageHeader**: Consistent page header with breadcrumbs
- **Result**: Success/error result pages
- **Exception**: Error page templates
- **FooterToolbar**: Fixed bottom toolbar for forms
- **Ellipsis**: Text truncation with tooltip

## @delon/form - Dynamic Forms

Dynamic form generation based on JSON schema.

**Key Features**:
- Schema-driven form generation
- Built-in validation
- Responsive layouts
- Custom widgets support
- Integration with ng-zorro-antd form components

**Schema Definition**:
```typescript
import { Component, signal } from '@angular/core';
import { SFSchema, SFUISchema } from '@delon/form';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <sf 
      [schema]="schema" 
      [ui]="ui"
      [formData]="formData()"
      (formSubmit)="submit($event)"
    />
  `
})
export class UserFormComponent {
  formData = signal<any>({});
  
  schema: SFSchema = {
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        maxLength: 100
      },
      email: {
        type: 'string',
        title: 'Email',
        format: 'email'
      },
      role: {
        type: 'string',
        title: 'Role',
        enum: ['admin', 'user', 'guest']
      }
    },
    required: ['name', 'email']
  };
  
  ui: SFUISchema = {
    '*': { spanLabel: 6, spanControl: 18 },
    $email: { widget: 'email' },
    $role: { widget: 'select' }
  };
}
```

**Best Practices**:
- Define schemas with proper typing
- Use appropriate widgets for different data types
- Implement custom validators when needed
- Handle form submission with proper error handling
- Use reactive updates with signals for form data

## @delon/auth - Authentication

Centralized authentication management with token handling.

**Token Management**:
```typescript
import { inject } from '@angular/core';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';

export class AuthService {
  private tokenService = inject<ITokenService>(DA_SERVICE_TOKEN);
  
  login(credentials: LoginCredentials): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.tokenService.set({
          token: response.access_token,
          expired: response.expires_in
        });
      })
    );
  }
  
  logout(): void {
    this.tokenService.clear();
    this.router.navigate(['/login']);
  }
  
  isAuthenticated(): boolean {
    return this.tokenService.get()?.token != null;
  }
}
```

**Route Guards**:
- Use `@delon/auth` guards for protected routes
- Implement `SimpleGuard` for basic authentication checks
- Use `JWTGuard` for JWT token validation

## @delon/acl - Access Control

Role-based and capability-based access control.

**ACL Configuration**:
```typescript
import { Component, inject } from '@angular/core';
import { ACLService } from '@delon/acl';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div *aclIf="'admin'">
      <button>Admin Action</button>
    </div>
    <div *aclIf="['edit', 'delete']; mode: 'oneOf'">
      <button>Edit or Delete</button>
    </div>
  `
})
export class AdminPanelComponent {
  private aclService = inject(ACLService);
  
  ngOnInit(): void {
    // Set user roles after authentication
    this.aclService.setRole(['admin', 'editor']);
    
    // Set user abilities
    this.aclService.setAbility(['create', 'edit', 'delete']);
  }
  
  canEdit(): boolean {
    return this.aclService.canAbility('edit');
  }
}
```

**Best Practices**:
- Define clear role hierarchies
- Use abilities for fine-grained control
- Guard routes and components appropriately
- Update ACL data after authentication changes

## @delon/cache - Caching Strategies

Efficient caching for HTTP requests and data.

**Cache Configuration**:
```typescript
import { Component, inject } from '@angular/core';
import { CacheService } from '@delon/cache';
import { of } from 'rxjs';

export class DataService {
  private cache = inject(CacheService);
  
  getUserData(userId: string): Observable<User> {
    const cacheKey = `user-${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return of(cached);
    }
    
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      tap(data => this.cache.set(cacheKey, data, { 
        expire: 300000 // 5 minutes
      }))
    );
  }
  
  clearUserCache(): void {
    this.cache.remove(/^user-/);
  }
}
```

**Cache Strategies**:
- Use memory cache for frequently accessed data
- Set appropriate expiration times
- Implement cache invalidation on data updates
- Use cache interceptors for HTTP requests

## @delon/chart - Chart Components

Wrapper components for popular chart libraries.

**Supported Charts**:
- G2 charts (native Ant Design charts)
- Chart.js integration
- NGX-Charts support

**Usage Example**:
```typescript
import { Component, signal } from '@angular/core';
import { G2BarData } from '@delon/chart/bar';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <g2-bar 
      [data]="chartData()" 
      [height]="300"
      [autoLabel]="true"
    />
  `
})
export class DashboardComponent {
  chartData = signal<G2BarData[]>([
    { x: 'Jan', y: 100 },
    { x: 'Feb', y: 200 },
    { x: 'Mar', y: 150 }
  ]);
}
```

## @delon/theme - Theming System

Customizable theming and layout management.

**Theme Configuration**:
- Define theme variables in `src/styles/theme.less`
- Use Ant Design color system
- Implement responsive layout with `LayoutDefaultComponent`
- Customize menu items and navigation

**Layout Components**:
- `LayoutDefaultComponent`: Default admin layout with sidebar
- `LayoutFullScreenComponent`: Full-screen layout
- `LayoutBlankComponent`: Minimal layout for authentication pages

## @delon/util - Utility Functions

Common utility functions and helpers.

**Key Utilities**:
- `deepCopy()`: Deep clone objects
- `deepMerge()`: Merge objects deeply
- `format()`: String formatting
- `yuan()`: Currency formatting for CNY
- `ArrayService`: Array manipulation utilities

## @delon/mock - Mock Data

Mock HTTP requests for development and testing.

**Mock Configuration**:
```typescript
import { MockRequest } from '@delon/mock';

export const USERS = {
  '/api/users': (req: MockRequest) => {
    return {
      users: [
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' }
      ],
      total: 2
    };
  }
};
```

## Integration Patterns

### ng-alain + ng-zorro-antd

ng-alain builds upon ng-zorro-antd. Use both libraries together:

```typescript
import { Component } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card>
      <st [data]="data" [columns]="columns" />
    </nz-card>
  `
})
export class DataTableComponent {
  constructor(
    private message: NzMessageService,
    private modal: NzModalService
  ) {}
  
  columns: STColumn[] = [
    {
      title: 'Actions',
      buttons: [
        {
          text: 'Delete',
          click: (record) => this.confirmDelete(record)
        }
      ]
    }
  ];
  
  confirmDelete(record: any): void {
    this.modal.confirm({
      nzTitle: 'Confirm Delete',
      nzContent: 'Are you sure?',
      nzOnOk: () => this.delete(record)
    });
  }
  
  delete(record: any): void {
    // Delete logic
    this.message.success('Deleted successfully');
  }
}
```

### ng-alain + Firebase/Firestore

Integrate ng-alain components with Firebase/Firestore backend:

```typescript
import { Component, inject, signal } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { Firebase/FirestoreService } from '@core/services/firebase.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <st 
      [data]="projects()" 
      [columns]="columns"
      [loading]="loading()"
    />
  `
})
export class ProjectsComponent {
  private firebase = inject(Firebase/FirestoreService);
  
  loading = signal(false);
  projects = signal<any[]>([]);
  
  columns: STColumn[] = [
    { title: 'Name', index: 'name' },
    { title: 'Status', index: 'status' }
  ];
  
  ngOnInit(): void {
    this.loadProjects();
  }
  
  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.firebase.client
        .from('projects')
        .select('*');
      
      if (error) throw error;
      this.projects.set(data || []);
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Project Structure for ng-alain

```
src/app/
├── core/                    # Core services and infrastructure
│   ├── startup/            # Startup service for app initialization
│   ├── guards/             # Route guards
│   └── interceptors/       # HTTP interceptors
├── layout/                 # Layout components
│   ├── default/           # Default layout with sidebar
│   ├── fullscreen/        # Fullscreen layout
│   └── passport/          # Authentication layout
├── routes/                # Feature modules
│   ├── dashboard/         # Dashboard feature
│   ├── users/            # User management
│   └── settings/         # Settings
└── shared/               # Shared components and utilities
    ├── components/       # Reusable components
    ├── pipes/           # Custom pipes
    └── shared-imports.ts # Common imports
```

## Enterprise Standards

### Code Organization
- Group related components in feature modules
- Use barrel exports (index.ts) for clean imports
- Separate business logic into services
- Keep components focused on presentation

### Naming Conventions
- Components: `[feature]-[type].component.ts` (e.g., `user-list.component.ts`)
- Services: `[feature].service.ts` (e.g., `user.service.ts`)
- Guards: `[feature].guard.ts` (e.g., `auth.guard.ts`)
- Interceptors: `[feature].interceptor.ts` (e.g., `token.interceptor.ts`)

### State Management
- Use Signals for component state
- Implement service-based state for shared data
- Consider @delon/cache for persistent state
- Use RxJS for async operations

### Testing
- Write unit tests for services (80%+ coverage)
- Test component rendering and interactions (60%+ coverage)
- Mock external dependencies (HTTP, Firebase/Firestore)
- Test ACL permissions and authentication flows

### Performance
- Use OnPush change detection strategy
- Implement virtual scrolling for large lists (ST component)
- Lazy load feature modules
- Optimize bundle size with proper imports

### Security
- Use @delon/auth for token management
- Implement @delon/acl for access control
- Validate all user inputs
- Sanitize data before rendering
- Follow Angular security best practices

## Documentation
- Document component APIs with JSDoc
- Maintain README files for feature modules
- Document configuration options
- Keep examples up-to-date

## Additional Resources
- ng-alain Documentation: https://ng-alain.com
- Delon Components: https://ng-alain.com/components
- ng-zorro-antd: https://ng.ant.design
- Angular Style Guide: https://angular.dev/style-guide
```
