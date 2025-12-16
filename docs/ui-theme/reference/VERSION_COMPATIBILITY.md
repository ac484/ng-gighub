# Black Tortoise Theme - Version Compatibility Guide
# 玄武主題 - 版本兼容性指南

## 📦 Current Project Versions

### Core Framework Versions (當前版本)
- **Angular**: 20.3.0 (Latest: 21.0.3)
- **ng-zorro-antd**: 20.3.1 (Latest: 20.4.3)
- **ng-alain (@delon)**: 20.1.0 (Latest: 20.1.0)
- **TypeScript**: 5.9.2 (Latest: 5.9.x)
- **RxJS**: 7.8.0 (Latest: 7.8.x)

### Theme Version
- **Black Tortoise Theme**: 1.1.0
- **Last Updated**: 2025-12-09
- **Status**: ✅ Production Ready

## 🔄 Version Compatibility Matrix

### Black Tortoise Theme 1.1.0

| Package | Minimum Version | Tested With | Latest Available | Status |
|---------|----------------|-------------|------------------|---------|
| Angular | 20.0.0 | 20.3.0 | 21.0.3 | ✅ Compatible |
| ng-zorro-antd | 20.0.0 | 20.3.1 | 20.4.3 | ✅ Compatible |
| ng-alain | 20.0.0 | 20.1.0 | 20.1.0 | ✅ Up-to-date |
| TypeScript | 5.9.0 | 5.9.2 | 5.9.x | ✅ Up-to-date |
| RxJS | 7.8.0 | 7.8.0 | 7.8.x | ✅ Up-to-date |

## 📊 Upgrade Recommendations

### 🟢 Optional Upgrades (Non-Breaking)

#### ng-zorro-antd: 20.3.1 → 20.4.3

**Benefits**:
- Performance improvements
- Bug fixes
- New component features
- Better TypeScript type definitions

**Migration Steps**:
```bash
# Update package.json
yarn add ng-zorro-antd@20.4.3

# Or using npm
npm install ng-zorro-antd@20.4.3

# Run linting
yarn lint

# Test the application
yarn start
```

**Breaking Changes**: None identified for Black Tortoise Theme

**Estimated Effort**: Low (< 1 hour)

**Recommendation**: ✅ Recommended - Safe upgrade with no breaking changes

#### Angular: 20.3.0 → 21.0.3

**Benefits**:
- Latest Angular features
- Performance improvements
- Security updates
- Modern JavaScript support

**Migration Steps**:
```bash
# Use Angular CLI to update
ng update @angular/core@21 @angular/cli@21

# Update ng-zorro-antd if needed
ng update ng-zorro-antd

# Run linting
yarn lint

# Test thoroughly
yarn test
```

**Breaking Changes**: 
- Some deprecated APIs removed
- Component API changes (check Angular migration guide)
- Possible changes in change detection strategy

**Estimated Effort**: Medium-High (4-8 hours)

**Recommendation**: ⚠️  Consider - Test thoroughly in development environment first

**Note**: Wait for ng-alain and ng-zorro-antd to officially support Angular 21 before upgrading in production.

## 🎨 Theme API Changes

### ng-zorro-antd 20.3.1 → 20.4.3

**No Breaking Changes for Black Tortoise Theme**

The following APIs used in Black Tortoise Theme remain stable:
- ✅ `NzConfig.theme.primaryColor`
- ✅ `NzConfigService.set('theme', {...})`
- ✅ Component theming via Less variables
- ✅ CSS custom properties support
- ✅ Dynamic theme switching

### ng-alain 20.1.0 (Current)

**Stable APIs**:
- ✅ Layout customization variables
- ✅ Header/sidebar theming
- ✅ Content area styling
- ✅ @delon/theme integration

## 📝 Configuration Best Practices

### Current Implementation (Verified ✅)

#### 1. app.config.ts - Runtime Theme Configuration
```typescript
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';

const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E293B',  // Black Tortoise Blue
    successColor: '#14B8A6',   // Jade Green
    warningColor: '#F59E0B',   // Amber
    errorColor: '#EF4444',     // Red
    infoColor: '#06B6D4'       // Cyan
  }
};

export const appConfig: ApplicationConfig = {
  providers: [provideNzConfig(ngZorroConfig)]
};
```

#### 2. theme.less - Compile-Time Variable Override
```less
// Define BEFORE importing @delon/theme
@primary-color: #1E293B;
@success-color: #14B8A6;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #06B6D4;

// Then import theme
@import '@delon/theme/theme-default.less';
```

#### 3. Dynamic Theme Switching (Runtime)
```typescript
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { inject } from '@angular/core';

export class ThemeService {
  private nzConfigService = inject(NzConfigService);
  
  changeTheme(primaryColor: string) {
    this.nzConfigService.set('theme', { primaryColor });
  }
}
```

## 🔍 Testing Checklist

Before upgrading any dependency, verify:

- [ ] **Build Process**
  - [ ] `yarn build` succeeds without errors
  - [ ] `yarn build --configuration production` works
  - [ ] Bundle size is acceptable

- [ ] **Linting**
  - [ ] `yarn lint:ts` passes
  - [ ] `yarn lint:style` passes
  - [ ] No new TypeScript errors

- [ ] **Visual Testing**
  - [ ] Primary color (Azure Blue) displays correctly
  - [ ] Success color (Jade Green) displays correctly
  - [ ] All gradients render properly
  - [ ] Hover states work as expected
  - [ ] Transitions are smooth

- [ ] **Component Testing**
  - [ ] Buttons styled correctly
  - [ ] Forms display proper validation colors
  - [ ] Tables have correct hover states
  - [ ] Modals and drawers themed properly
  - [ ] Navigation highlights active items

- [ ] **Browser Compatibility**
  - [ ] Chrome 120+
  - [ ] Firefox 120+
  - [ ] Safari 17+
  - [ ] Edge 120+

## 🚨 Known Issues

### Current Project (as of 2025-12-09)

✅ **No known issues with current versions**

The Black Tortoise Theme is fully compatible with:
- Angular 20.3.0
- ng-zorro-antd 20.3.1
- ng-alain 20.1.0

## 📚 References

### Official Documentation
- **ng-zorro-antd Theming**: https://ng.ant.design/docs/customize-theme/en
- **ng-alain Documentation**: https://ng-alain.com/theme/getting-started/en
- **Angular Update Guide**: https://update.angular.io/

### Black Tortoise Theme Documentation
- **Main Theme Guide**: [azure-dragon-theme.md](./azure-dragon-theme.md)
- **Integration Guide**: [AZURE_DRAGON_INTEGRATION.md](./AZURE_DRAGON_INTEGRATION.md)
- **Visual Reference**: [AZURE_DRAGON_VISUAL_REFERENCE.md](./AZURE_DRAGON_VISUAL_REFERENCE.md)
- **Hover States**: [HOVER_STATES_IMPROVEMENTS.md](./HOVER_STATES_IMPROVEMENTS.md)

### Package Registries
- **Angular**: https://www.npmjs.com/package/@angular/core
- **ng-zorro-antd**: https://www.npmjs.com/package/ng-zorro-antd
- **ng-alain**: https://www.npmjs.com/package/ng-alain

## 🔄 Update Strategy

### Recommended Approach

1. **Monthly Review** (低風險)
   - Check for minor version updates
   - Review changelogs
   - Test in development environment

2. **Quarterly Major Updates** (中風險)
   - Plan major version upgrades
   - Allocate testing time
   - Update documentation

3. **Security Patches** (立即)
   - Apply security updates immediately
   - Test critical paths
   - Deploy as soon as verified

### Upgrade Priority

1. **🔴 Critical**: Security vulnerabilities
2. **🟡 High**: Bug fixes affecting functionality
3. **🟢 Medium**: Performance improvements
4. **🔵 Low**: New features, minor improvements

## 💡 Best Practices

### Theme Maintenance

1. **Version Pinning**
   - Use exact versions in `package.json` for production
   - Use caret (^) for development dependencies

2. **Testing**
   - Always test theme changes in development first
   - Use visual regression testing tools
   - Verify accessibility after updates

3. **Documentation**
   - Keep version compatibility docs updated
   - Document any custom overrides
   - Note breaking changes immediately

4. **Rollback Plan**
   - Keep previous `yarn.lock`/`package-lock.json`
   - Tag releases in git
   - Document rollback procedures

## 📞 Support

### Questions?
- Check official documentation first
- Review Black Tortoise Theme docs
- Search existing issues on GitHub

### Found a Compatibility Issue?
1. Document the issue with:
   - Package versions
   - Error messages
   - Steps to reproduce
2. Check if it's a known issue
3. Report to appropriate repository

---

**Maintained by**: GitHub Copilot  
**Last Updated**: 2025-12-09  
**Theme Version**: 1.1.0  
**Status**: ✅ Production Ready
