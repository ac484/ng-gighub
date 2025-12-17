# Firebase Authentication Integration with @delon/auth

## Overview

This document describes the integration of Firebase Authentication with the GigHub application's existing @delon/auth system (DA_SERVICE_TOKEN). The integration provides email/password authentication via Firebase while maintaining compatibility with the existing ng-alain authentication patterns.

**Note**: Firebase is simplified to only handle statistics and non-sensitive data. All authentication is handled by Firebase.

## Architecture

### Components

1. **Firebase Configuration** (`src/app/app.config.ts`)
   - Configures Firebase services (Auth, Firestore, Analytics, etc.)
   - Integrates reCAPTCHA Enterprise for bot protection
   - Provides Firebase services to the Angular application

2. **FirebaseAuthService** (`src/app/core/services/firebase-auth.service.ts`)
   - **Primary authentication service** for the application
   - Bridges Firebase Auth with @delon/auth's DA_SERVICE_TOKEN
   - Provides authentication methods (sign in, sign up, sign out)
   - Syncs Firebase user state with Delon token service
   - Handles error messages and i18n integration

3. **FirebaseService** (`src/app/core/services/firebase.service.ts`)
   - **Simplified service for statistics only**
   - No authentication methods - Firebase handles all auth
   - Hardcoded credentials (safe for public statistics data)
   - Provides basic client access for database queries and storage

4. **Login Component** (`src/app/routes/passport/login/`)
   - Updated to use FirebaseAuthService instead of mock HTTP calls
   - Email/password form validation
   - Integrates with StartupService for application initialization

### Data Flow

```
User Input → Login Component → FirebaseAuthService → Firebase Auth
                    ↓                    ↓
              Form Validation    Sync to DA_SERVICE_TOKEN
                    ↓                    ↓
              Error Handling        StartupService Load
                    ↓                    ↓
              UI Feedback          Navigate to Dashboard
```

#

## Configuration

### Firebase Configuration

The Firebase configuration in `src/app/app.config.ts` includes:

```typescript
const firebaseProviders: Array<Provider | EnvironmentProviders> = [
  provideFirebaseApp(() => initializeApp({
    apiKey: "AIzaSyCJ-eayGjJwBKsNIh3oEAG2GjbfTrvAMEI",
    authDomain: "elite-chiller-455712-c4.firebaseapp.com",
    projectId: "elite-chiller-455712-c4",
    storageBucket: "elite-chiller-455712-c4.firebasestorage.app",
    messagingSenderId: "7807661688",
    appId: "1:7807661688:web:5f96a5fe30b799f31d1f8d",
    measurementId: "G-5KJJ3DD2G7"
  })),
  provideAuth_alias(() => getAuth()),
  provideAnalytics(() => getAnalytics()),
  // ... other Firebase services
  provideAppCheck(() => {
    const provider = new ReCaptchaEnterpriseProvider('6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc');
    return initializeAppCheck(undefined, { provider, isTokenAutoRefreshEnabled: true });
  }),
];
```

### reCAPTCHA Configuration

- **Site Key**: `6LcGnSUsAAAAAMIm1aYeWqoYNEmLphGIbwEfWJlc`
- **Provider**: ReCaptchaEnterpriseProvider
- **Auto Refresh**: Enabled

## Usage

### Sign In with Email/Password

```typescript
import { FirebaseAuthService } from '@core';

export class LoginComponent {
  private readonly firebaseAuth = inject(FirebaseAuthService);

  async signIn(email: string, password: string) {
    try {
      const user = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      // User is authenticated and token is set
      this.router.navigateByUrl('/dashboard');
    } catch (error) {
      // Handle error with i18n message
      this.error = error.message;
    }
  }
}
```

### Sign Up with Email/Password

```typescript
async signUp(email: string, password: string) {
  try {
    const user = await this.firebaseAuth.signUpWithEmailAndPassword(email, password);
    // User is created and authenticated
  } catch (error) {
    this.error = error.message;
  }
}
```

### Sign Out

```typescript
async signOut() {
  await this.firebaseAuth.signOut();
  // Token is cleared and redirected to login
}
```

### Check Authentication State

```typescript
// Observable
this.firebaseAuth.isAuthenticated$.subscribe(isAuth => {
  console.log('User authenticated:', isAuth);
});

// Synchronous
const user = this.firebaseAuth.currentUser;
if (user) {
  console.log('User email:', user.email);
}
```

## Token Synchronization

The `FirebaseAuthService` automatically syncs Firebase authentication state with the @delon/auth token service:

1. When a user signs in, the service:
   - Gets the Firebase ID token
   - Creates a token object matching @delon/auth's ITokenModel interface
   - Sets the token in DA_SERVICE_TOKEN

2. Token structure:
```typescript
{
  token: string;      // Firebase ID token
  email: string;      // User email
  uid: string;        // Firebase user ID
  name: string;       // Display name or email
  expired: number;    // Token expiration timestamp (1 hour)
}
```

3. When a user signs out:
   - Clears the token from DA_SERVICE_TOKEN
   - Redirects to login page

### Configuration

Credentials are hardcoded directly in the service (safe for public statistics):

```typescript
// src/app/core/services/firebase.service.ts
private readonly FIREBASE_URL = 'https://edfxrqgadtlnfhqqmgjw.firebase.co';
private readonly FIREBASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Usage Examples

**Query data from a table:**
```typescript
import { FirebaseService } from '@core';

export class StatisticsComponent {
  private readonly firebase = inject(FirebaseService);

  async getStatistics() {
    const { data, error } = await this.firebase
      .from('statistics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching statistics:', error);
      return;
    }
    
    console.log('Statistics:', data);
  }
}
```

**Use the client directly:**
```typescript
// For advanced queries
const client = this.firebase.client;
const { data } = await client.collection(\'table_name\').get('*');
```

**Access storage:**
```typescript
// Download a file
const storage = this.firebase.storage('statistics-files');
const { data } = await storage.download('file-path.csv');
```

### Important Notes

1. **No Authentication Methods**: The following methods have been removed:
   - `signIn()`, `signInWithPassword()`, `signOut()`
   - `authChanges()`, `session`
   - `profile()`, `updateProfile()`

2. **Firebase Handles Auth**: All user authentication is done through FirebaseAuthService

3. **Statistics Only**: Firebase is used for:
   - Non-sensitive data queries
   - Statistics aggregation
   - Public reports and analytics
   - File storage for non-sensitive data

4. **Security**: Since only public/statistics data is stored, hardcoded credentials are acceptable

## Error Handling

The service provides i18n-friendly error messages for Firebase Auth errors:

| Firebase Error Code | i18n Key | Description |
|-------------------|----------|-------------|
| `auth/invalid-email` | `validation.email.wrong-format` | Invalid email format |
| `auth/user-disabled` | `auth.user-disabled` | Account disabled |
| `auth/user-not-found` | `auth.invalid-credentials` | User not found |
| `auth/wrong-password` | `auth.invalid-credentials` | Wrong password |
| `auth/email-already-in-use` | `auth.email-already-exists` | Email already registered |
| `auth/weak-password` | `validation.password.strength.short` | Password too weak |
| `auth/too-many-requests` | `auth.too-many-requests` | Rate limit exceeded |

## Internationalization

Added i18n keys for Firebase authentication (in `src/assets/tmp/i18n/zh-TW.json`):

```json
{
  "app.login.email-placeholder": "電子郵件",
  "app.login.password-placeholder": "密碼",
  "auth.user-disabled": "此帳戶已被停用",
  "auth.invalid-credentials": "電子郵件或密碼無效",
  "auth.email-already-exists": "此電子郵件已被使用",
  "auth.operation-not-allowed": "此操作不允許",
  "auth.too-many-requests": "請求過多，請稍後再試",
  "auth.unknown-error": "發生未知錯誤，請稍後再試"
}
```

## Security Considerations

1. **reCAPTCHA Enterprise**: Protects against bots and automated attacks
2. **Password Requirements**: Minimum 6 characters (enforced by Firebase)
3. **Token Expiration**: ID tokens expire after 1 hour
4. **Auto Token Refresh**: Firebase automatically refreshes tokens
5. **HTTPS Only**: Firebase Auth requires HTTPS in production

## Migration from Mock Auth

The previous implementation used mock HTTP calls for authentication. The new implementation:

### Before (Mock HTTP)
```typescript
this.http.post('/login/account', { userName, password })
  .subscribe(res => {
    this.tokenService.set(res.user);
  });
```

### After (Firebase Auth)
```typescript
await this.firebaseAuth.signInWithEmailAndPassword(email, password);
// Token automatically set by FirebaseAuthService
```

## Testing

### Test User Creation

To create test users in Firebase:

1. Go to Firebase Console → Authentication
2. Add a user with email/password
3. Use those credentials in the login form

### Local Development

For local development with Firebase emulators:

```typescript
// In app.config.ts (development only)
provideAuth(() => {
  const auth = getAuth();
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  return auth;
})
```

## Troubleshooting

### Issue: "auth/operation-not-allowed"
**Solution**: Enable Email/Password authentication in Firebase Console → Authentication → Sign-in methods

### Issue: "auth/too-many-requests"
**Solution**: Wait a few minutes or reset password via Firebase Console

### Issue: Token not syncing
**Solution**: Check that FirebaseAuthService is injected and constructor is called

### Issue: reCAPTCHA not loading
**Solution**: Verify site key is correct and reCAPTCHA Enterprise is enabled in Firebase Console

## Future Enhancements

1. **Social Authentication**: Add Google, Facebook, GitHub login
2. **Phone Authentication**: Add SMS-based authentication
3. **Password Reset**: Implement forgot password flow
4. **Email Verification**: Require email verification for new users
5. **Multi-Factor Authentication**: Add 2FA support

## References

- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [@delon/auth Documentation](https://ng-alain.com/auth)
- [reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise/docs)

## Version Information

- **@angular/fire**: 20.0.1
- **Angular**: 20.3.0
- **ng-alain**: 20.1.0
- **Firebase SDK**: Included with @angular/fire
