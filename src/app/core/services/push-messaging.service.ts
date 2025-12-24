import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PushMessagingService {
  async init(_userId: string): Promise<void> {
    return;
  }
}
