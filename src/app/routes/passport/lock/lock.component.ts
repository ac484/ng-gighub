import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '@core';
import { I18nPipe, SettingsService, User } from '@delon/theme';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'passport-lock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lock.component.html',
  styleUrls: ['./lock.component.less'],
  imports: [ReactiveFormsModule, I18nPipe, NzAvatarModule, NzFormModule, NzGridModule, NzButtonModule, NzInputModule]
})
export class UserLockComponent {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  f = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  get user(): User {
    return this.settings.user;
  }

  async submit(): Promise<void> {
    this.f.controls.password.markAsDirty();
    this.f.controls.password.updateValueAndValidity();

    if (!this.f.valid) {
      return;
    }

    try {
      // Re-authenticate with Firebase Auth
      const currentUser = this.firebaseAuth.currentUser;
      if (!currentUser?.email) {
        this.msg.error('No user email found');
        return;
      }

      await this.firebaseAuth.signInWithEmailAndPassword(currentUser.email, this.f.value.password!);

      this.router.navigate(['dashboard']);
    } catch (error: any) {
      this.msg.error(error.message || 'Authentication failed');
    }
  }
}
