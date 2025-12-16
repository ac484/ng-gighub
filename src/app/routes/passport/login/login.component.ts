import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirebaseAuthService, StartupService } from '@core';
import { ReuseTabService } from '@delon/abc/reuse-tab';
import { I18nPipe } from '@delon/theme';
import { environment } from '@env/environment';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { firstValueFrom } from 'rxjs';

/**
 * User Login Component
 * 使用者登入元件
 *
 * ✅ Modernized with:
 * - Signals for reactive state
 * - async/await for Firebase Auth
 * - Unified error handling
 */
@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    I18nPipe,
    NzCheckboxModule,
    NzAlertModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzToolTipModule,
    NzIconModule
  ]
})
export class UserLoginComponent {
  private readonly router = inject(Router);
  private readonly reuseTabService = inject(ReuseTabService, { optional: true });
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly startupSrv = inject(StartupService);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  // ✅ Modern Pattern: Use Signals for reactive state
  error = signal('');
  loading = signal(false);

  /**
   * Submit login form
   * ✅ Using async/await with proper error handling
   */
  async submit(): Promise<void> {
    this.error.set('');
    const { email, password } = this.form.controls;
    email.markAsDirty();
    email.updateValueAndValidity();
    password.markAsDirty();
    password.updateValueAndValidity();

    if (email.invalid || password.invalid) {
      return;
    }

    this.loading.set(true);

    try {
      // Sign in with Firebase Auth
      await this.firebaseAuth.signInWithEmailAndPassword(this.form.value.email!, this.form.value.password!);

      // Clear reuse tab info
      this.reuseTabService?.clear();

      // Reload startup service to refresh user permissions
      await firstValueFrom(this.startupSrv.load());

      // Navigate to home page
      await this.router.navigateByUrl('/');
    } catch (error: any) {
      this.error.set(error.message || '登入失敗，請檢查您的電子郵件和密碼');
    } finally {
      this.loading.set(false);
    }
  }
}
