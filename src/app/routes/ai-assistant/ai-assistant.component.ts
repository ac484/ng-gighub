import { Component, inject, signal, computed, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { AIStore } from '@core/facades/ai';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';

/**
 * AI Assistant Component
 *
 * Provides an AI-powered chat assistant interface integrated with the GigHub system.
 * Supports context-aware conversations based on user/organization/team/blueprint context.
 *
 * @architecture
 * - Uses AIStore for state management (Signals)
 * - Integrates with existing AI Service/Repository layers
 * - Supports multi-turn conversations with context
 *
 * @features
 * - Real-time chat with Google Gemini AI
 * - Context-aware responses
 * - Conversation history
 * - Token usage tracking
 * - Error handling with user-friendly messages
 */
@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzPageHeaderModule, NzEmptyModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.less'
})
export class AIAssistantComponent {
  private aiStore = inject(AIStore);

  @ViewChild('chatMessages', { read: ElementRef })
  private chatMessages?: ElementRef;

  // State signals from store
  loading = this.aiStore.loading;
  error = this.aiStore.error;
  chatHistory = this.aiStore.chatHistory;
  totalTokensUsed = this.aiStore.totalTokensUsed;
  hasHistory = this.aiStore.hasHistory;

  // Local UI state
  userMessage = signal('');
  isComposing = signal(false);

  // Computed signals
  canSend = computed(() => this.userMessage().trim().length > 0 && !this.loading() && !this.isComposing());

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(): Promise<void> {
    const message = this.userMessage().trim();
    if (!message || this.loading()) {
      return;
    }

    try {
      // Clear input immediately for better UX
      this.userMessage.set('');

      // Send message through store
      await this.aiStore.sendChatMessage(message);

      // Scroll to bottom after message is sent
      this.scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Handle Enter key press in input
   */
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !this.isComposing()) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Handle composition events for IME input
   */
  onCompositionStart(): void {
    this.isComposing.set(true);
  }

  onCompositionEnd(): void {
    this.isComposing.set(false);
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.aiStore.clearChatHistory();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.aiStore.clearError();
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      if (this.chatMessages?.nativeElement) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    });
  }
}
