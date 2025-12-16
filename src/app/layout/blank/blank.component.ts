import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout-blank',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
  host: {
    '[class.alain-blank]': 'true'
  },
  imports: [RouterOutlet]
})
export class LayoutBlankComponent {}
