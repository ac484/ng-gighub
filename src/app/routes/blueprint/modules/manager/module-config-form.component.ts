/**
 * Module Config Form Component
 * Dynamic form for editing module configuration using ng-alain SF.
 */

import { Component, OnInit, inject, input, signal } from '@angular/core';
import { BlueprintModuleDocument } from '@core/blueprint/domain/models';
import { SFSchema, SFButton } from '@delon/form';
import { SHARED_IMPORTS } from '@shared';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-module-config-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: ` <sf [schema]="schema" [formData]="formData()" [button]="button" [loading]="loading()" (formSubmit)="submit($event)"> </sf> `
})
export class ModuleConfigFormComponent implements OnInit {
  private modal = inject(NzModalRef);

  module = input.required<BlueprintModuleDocument>();
  loading = signal(false);
  formData = signal<any>({});

  schema: SFSchema = {
    properties: {
      enabled: {
        type: 'boolean',
        title: 'Enable Module',
        default: true,
        ui: {
          widget: 'checkbox'
        }
      },
      config: {
        type: 'object',
        title: 'Configuration',
        properties: {
          // Dynamic based on module metadata
        }
      }
    }
  };

  button: SFButton = {
    submit: 'Save',
    reset: 'Cancel'
  };

  ngOnInit(): void {
    const mod = this.module();
    this.formData.set({
      enabled: mod.enabled,
      config: mod.config || {}
    });

    // TODO: Generate schema from module metadata
  }

  submit(value: any): void {
    this.modal.close(value.config);
  }
}
