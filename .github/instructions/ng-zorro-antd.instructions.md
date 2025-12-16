```instructions
---
description: 'ng-zorro-antd (Ant Design for Angular) component library guidelines'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css, **/*.less'
---

# ng-zorro-antd Development

Instructions for using ng-zorro-antd (Ant Design for Angular) component library in the GigHub project.

## Overview

ng-zorro-antd is an enterprise-class UI design language and Angular implementation. It provides a rich set of high-quality components for building modern web applications.

## Core Principles

- **Consistency**: Follow Ant Design specifications for visual and interaction design
- **Standalone Components**: All ng-zorro components support standalone mode
- **Type Safety**: Use TypeScript interfaces for all component configurations
- **Accessibility**: Ensure ARIA attributes and keyboard navigation support
- **Responsive**: Implement mobile-first responsive designs

## Common Components

### Button Component

```typescript
import { Component } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NzButtonModule],
  template: `
    <button nz-button nzType="primary">Primary Button</button>
    <button nz-button nzType="default">Default Button</button>
    <button nz-button nzType="dashed">Dashed Button</button>
    <button nz-button nzType="link">Link Button</button>
    <button nz-button nzType="text">Text Button</button>
    
    <!-- With icon -->
    <button nz-button nzType="primary">
      <span nz-icon nzType="search"></span>
      Search
    </button>
    
    <!-- Loading state -->
    <button nz-button nzType="primary" [nzLoading]="loading()">
      Submit
    </button>
    
    <!-- Danger button -->
    <button nz-button nzType="primary" nzDanger>Delete</button>
  `
})
export class ExampleComponent {
  loading = signal(false);
}
```

### Form Components

```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule
  ],
  template: `
    <form nz-form [formGroup]="userForm" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Username</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="Please input username">
          <input nz-input formControlName="username" placeholder="Username" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Email</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="Please input valid email">
          <input nz-input formControlName="email" placeholder="Email" type="email" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Role</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="role" nzPlaceHolder="Select role">
            <nz-option nzValue="admin" nzLabel="Administrator"></nz-option>
            <nz-option nzValue="user" nzLabel="User"></nz-option>
            <nz-option nzValue="viewer" nzLabel="Viewer"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="14">
          <button nz-button nzType="primary" [disabled]="!userForm.valid">
            Submit
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  
  userForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required]
  });
  
  submit(): void {
    if (this.userForm.valid) {
      console.log('Form values:', this.userForm.value);
    }
  }
}
```

### Table Component

```typescript
import { Component, signal } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';

interface User {
  id: number;
  name: string;
  age: number;
  address: string;
}

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [NzTableModule, NzButtonModule, NzSpaceModule],
  template: `
    <nz-table 
      #basicTable 
      [nzData]="users()" 
      [nzLoading]="loading()"
      [nzPageSize]="10"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Address</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        @for (user of basicTable.data; track user.id) {
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.age }}</td>
            <td>{{ user.address }}</td>
            <td>
              <nz-space>
                <button *nzSpaceItem nz-button nzType="link" nzSize="small">
                  Edit
                </button>
                <button *nzSpaceItem nz-button nzType="link" nzDanger nzSize="small">
                  Delete
                </button>
              </nz-space>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class UserTableComponent {
  loading = signal(false);
  users = signal<User[]>([
    { id: 1, name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
    { id: 2, name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
    { id: 3, name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' }
  ]);
}
```

### Modal Component

```typescript
import { Component, inject, signal } from '@angular/core';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-modal-example',
  standalone: true,
  imports: [NzModalModule, NzButtonModule],
  template: `
    <button nz-button nzType="primary" (click)="showModal()">
      Open Modal
    </button>
    
    <nz-modal
      [(nzVisible)]="isVisible"
      nzTitle="Modal Title"
      (nzOnCancel)="handleCancel()"
      (nzOnOk)="handleOk()"
    >
      <ng-container *nzModalContent>
        <p>Modal content goes here...</p>
      </ng-container>
    </nz-modal>
    
    <!-- Or use service-based modal -->
    <button nz-button nzType="default" (click)="showConfirm()">
      Confirm
    </button>
  `
})
export class ModalExampleComponent {
  private modal = inject(NzModalService);
  isVisible = false;
  
  showModal(): void {
    this.isVisible = true;
  }
  
  handleOk(): void {
    console.log('OK clicked');
    this.isVisible = false;
  }
  
  handleCancel(): void {
    console.log('Cancel clicked');
    this.isVisible = false;
  }
  
  showConfirm(): void {
    this.modal.confirm({
      nzTitle: 'Are you sure?',
      nzContent: 'This action cannot be undone.',
      nzOnOk: () => console.log('Confirmed'),
      nzOnCancel: () => console.log('Cancelled')
    });
  }
}
```

### Message & Notification

```typescript
import { Component, inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [NzButtonModule],
  template: `
    <button nz-button (click)="showMessage()">Show Message</button>
    <button nz-button (click)="showNotification()">Show Notification</button>
  `
})
export class FeedbackComponent {
  private message = inject(NzMessageService);
  private notification = inject(NzNotificationService);
  
  showMessage(): void {
    this.message.success('Operation successful!');
    // this.message.info('Information message');
    // this.message.warning('Warning message');
    // this.message.error('Error message');
  }
  
  showNotification(): void {
    this.notification.success(
      'Notification Title',
      'This is the content of the notification.'
    );
  }
}
```

### Spin (Loading Indicator)

```typescript
import { Component, signal } from '@angular/core';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [NzSpinModule, NzCardModule],
  template: `
    <!-- Simple spin -->
    <nz-spin [nzSpinning]="loading()">
      <nz-card>
        <p>Card content</p>
        <p>Card content</p>
        <p>Card content</p>
      </nz-card>
    </nz-spin>
    
    <!-- Custom tip -->
    <nz-spin [nzSpinning]="loading()" nzTip="Loading...">
      <div>Content</div>
    </nz-spin>
    
    <!-- Simple indicator -->
    @if (loading()) {
      <nz-spin nzSimple />
    }
  `
})
export class LoadingComponent {
  loading = signal(true);
}
```

### Layout Components

```typescript
import { Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NzLayoutModule, NzMenuModule, NzIconModule],
  template: `
    <nz-layout class="layout">
      <nz-header>
        <div class="logo"></div>
        <ul nz-menu nzTheme="dark" nzMode="horizontal">
          <li nz-menu-item>nav 1</li>
          <li nz-menu-item>nav 2</li>
          <li nz-menu-item>nav 3</li>
        </ul>
      </nz-header>
      
      <nz-layout>
        <nz-sider nzWidth="200px">
          <ul nz-menu nzMode="inline" class="sider-menu">
            <li nz-submenu nzTitle="Dashboard" nzIcon="dashboard">
              <ul>
                <li nz-menu-item>Overview</li>
                <li nz-menu-item>Analytics</li>
              </ul>
            </li>
            <li nz-menu-item nzIcon="user">
              <span>Users</span>
            </li>
            <li nz-menu-item nzIcon="setting">
              <span>Settings</span>
            </li>
          </ul>
        </nz-sider>
        
        <nz-layout class="inner-layout">
          <nz-content>
            <div class="content">
              <router-outlet></router-outlet>
            </div>
          </nz-content>
        </nz-layout>
      </nz-layout>
      
      <nz-footer>Footer content</nz-footer>
    </nz-layout>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
    }
    .logo {
      width: 120px;
      height: 31px;
      background: rgba(255, 255, 255, 0.2);
      margin: 16px 28px 16px 0;
      float: left;
    }
    .sider-menu {
      height: 100%;
      border-right: 0;
    }
    .inner-layout {
      padding: 0 24px 24px;
    }
    .content {
      background: #fff;
      padding: 24px;
      margin: 0;
      min-height: 280px;
    }
  `]
})
export class LayoutComponent {}
```

### Grid System

```typescript
import { Component } from '@angular/core';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [NzGridModule],
  template: `
    <div nz-row>
      <div nz-col nzSpan="24">col</div>
    </div>
    
    <div nz-row>
      <div nz-col nzSpan="12">col-12</div>
      <div nz-col nzSpan="12">col-12</div>
    </div>
    
    <div nz-row>
      <div nz-col nzSpan="8">col-8</div>
      <div nz-col nzSpan="8">col-8</div>
      <div nz-col nzSpan="8">col-8</div>
    </div>
    
    <!-- With gutter -->
    <div nz-row [nzGutter]="16">
      <div nz-col nzSpan="6">col-6</div>
      <div nz-col nzSpan="6">col-6</div>
      <div nz-col nzSpan="6">col-6</div>
      <div nz-col nzSpan="6">col-6</div>
    </div>
    
    <!-- Responsive -->
    <div nz-row>
      <div nz-col nzXs="24" nzSm="12" nzMd="8" nzLg="6">
        Responsive col
      </div>
    </div>
  `
})
export class GridComponent {}
```

## Best Practices

### Import Strategy

```typescript
// ✅ Correct: Import specific modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

// ❌ Avoid: Importing the entire library
import { NgZorroAntdModule } from 'ng-zorro-antd';
```

### Theme Customization

Use LESS variables in `src/styles.less`:

```less
// Override Ant Design variables
@primary-color: #1890ff;
@link-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #f5222d;
@font-size-base: 14px;
@heading-color: rgba(0, 0, 0, 0.85);
@text-color: rgba(0, 0, 0, 0.65);
@text-color-secondary: rgba(0, 0, 0, 0.45);
@disabled-color: rgba(0, 0, 0, 0.25);
@border-radius-base: 2px;
@border-color-base: #d9d9d9;
```

### Icon Usage

```typescript
import { NzIconModule } from 'ng-zorro-antd/icon';
import { UserOutline, SettingOutline } from '@ant-design/icons-angular/icons';

// In component
@Component({
  imports: [NzIconModule],
  template: `
    <!-- Using icon type -->
    <span nz-icon nzType="user"></span>
    
    <!-- Using custom icon -->
    <span nz-icon [nzType]="'setting'" nzTheme="outline"></span>
    
    <!-- With rotation/spin -->
    <span nz-icon nzType="loading" nzSpin></span>
    <span nz-icon nzType="sync" [nzRotate]="180"></span>
  `
})
```

### Form Validation

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-validated-form',
  standalone: true,
  imports: [NzFormModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>
          Username
        </nz-form-label>
        <nz-form-control 
          [nzSpan]="14" 
          [nzErrorTip]="errorTpl"
        >
          <input nz-input formControlName="username" />
          <ng-template #errorTpl let-control>
            @if (control.hasError('required')) {
              <span>Username is required</span>
            }
            @if (control.hasError('minlength')) {
              <span>Username must be at least 3 characters</span>
            }
          </ng-template>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class ValidatedFormComponent {
  private fb = inject(FormBuilder);
  
  form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]]
  });
  
  submit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
```

### Responsive Design

```typescript
// Use nz-grid responsive breakpoints
// xs: <576px
// sm: ≥576px
// md: ≥768px
// lg: ≥992px
// xl: ≥1200px
// xxl: ≥1600px

@Component({
  template: `
    <div nz-row [nzGutter]="{ xs: 8, sm: 16, md: 24, lg: 32 }">
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
        Content
      </div>
    </div>
  `
})
```

## Integration with ng-alain

When using ng-zorro-antd with ng-alain, prefer @delon/abc components for common business scenarios:

```typescript
// Use ng-alain's ST (Simple Table) instead of nz-table for data tables
import { STModule } from '@delon/abc/st';

// Use ng-alain's SF (Schema Form) instead of manual form building
import { SFModule } from '@delon/form';
```

## Common Pitfalls

### ❌ Avoid

```typescript
// Don't use OnPush without proper change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ data }}` // Won't update if data changes imperatively
})

// Don't forget to import required modules
@Component({
  template: `<button nz-button>Click</button>` // Error: no NzButtonModule
})

// Don't use deprecated APIs
nzBackdrop  // Deprecated, use nzMaskClosable instead
```

### ✅ Correct

```typescript
// Use signals for reactive state management
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ data() }}` // Automatically updates
})
export class MyComponent {
  data = signal('initial');
}

// Always import required modules
@Component({
  standalone: true,
  imports: [NzButtonModule],
  template: `<button nz-button>Click</button>`
})

// Use current APIs
@Component({
  template: `
    <nz-modal [nzMaskClosable]="false">
      Content
    </nz-modal>
  `
})
```

## Accessibility

Always ensure proper accessibility attributes:

```html
<!-- Add labels for form inputs -->
<nz-form-item>
  <nz-form-label nzFor="username">Username</nz-form-label>
  <nz-form-control>
    <input nz-input id="username" />
  </nz-form-control>
</nz-form-item>

<!-- Add aria-label for icon buttons -->
<button nz-button aria-label="Close">
  <span nz-icon nzType="close"></span>
</button>

<!-- Use semantic HTML -->
<nav>
  <ul nz-menu>
    <li nz-menu-item>Home</li>
    <li nz-menu-item>About</li>
  </ul>
</nav>
```

## References

- **Official Documentation**: https://ng.ant.design/docs/introduce/en
- **Component Demos**: https://ng.ant.design/components
- **Ant Design Guidelines**: https://ant.design/docs/spec/introduce
- **GitHub Repository**: https://github.com/NG-ZORRO/ng-zorro-antd
- **ng-alain Integration**: `.github/instructions/ng-alain-delon.instructions.md`

---

**Version**: 2025-12-16  
**Compatible with**: ng-zorro-antd 20.3.x, Angular 20.3.x
```
