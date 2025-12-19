/**
 * AI Generator Component
 *
 * Calls functions-ai Firebase Functions for AI generation
 * - generateContent: Generate AI content with Gemini
 * - generateText: Simple text generation
 *
 * @module ContractModule
 * @see functions-ai README for API documentation
 */

import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

import {
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateTextRequest,
  GenerateTextResponse
} from './types/firebase-functions.types';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-generator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="AI 生成器">
      <nz-tabset>
        <!-- Simple Text Generation -->
        <nz-tab nzTitle="文字生成">
          <div class="p-md">
            <nz-form-item>
              <nz-form-label>提示詞 (Prompt)</nz-form-label>
              <nz-form-control>
                <nz-textarea-count [nzMaxCharacterCount]="2000">
                  <textarea
                    rows="6"
                    nz-input
                    [(ngModel)]="prompt"
                    placeholder="輸入提示詞，例如：&#10;幫我撰寫一份施工安全注意事項..."
                  ></textarea>
                </nz-textarea-count>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>AI 模型</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="selectedModel" style="width: 200px;">
                  <nz-option nzValue="gemini-2.5-flash" nzLabel="Gemini 2.5 Flash (快速)" />
                  <nz-option nzValue="gemini-2.5-pro" nzLabel="Gemini 2.5 Pro (準確)" />
                  <nz-option nzValue="gemini-2.0-flash" nzLabel="Gemini 2.0 Flash" />
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>設定</nz-form-label>
              <nz-form-control>
                <nz-space>
                  <nz-space-item>
                    <span>最大輸出 Token:</span>
                    <nz-input-number [(ngModel)]="maxTokens" [nzMin]="100" [nzMax]="8000" [nzStep]="100" />
                  </nz-space-item>
                  <nz-space-item>
                    <span>Temperature:</span>
                    <nz-input-number [(ngModel)]="temperature" [nzMin]="0" [nzMax]="2" [nzStep]="0.1" />
                  </nz-space-item>
                </nz-space>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control>
                <button nz-button nzType="primary" [nzLoading]="generateLoading()" [disabled]="!prompt" (click)="generateText()">
                  <span nz-icon nzType="thunderbolt"></span>
                  生成
                </button>
                <button nz-button class="ml-sm" (click)="clearResult()">清除</button>
              </nz-form-control>
            </nz-form-item>

            @if (generatedText()) {
              <nz-divider />
              <h4>生成結果</h4>
              <div class="generated-text">
                <pre>{{ generatedText() }}</pre>
              </div>

              @if (usageMetadata()) {
                <nz-descriptions nzBordered nzSize="small" [nzColumn]="3" class="mt-md">
                  <nz-descriptions-item nzTitle="Prompt Tokens">
                    {{ usageMetadata()!.promptTokenCount }}
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="Generated Tokens">
                    {{ usageMetadata()!.candidatesTokenCount }}
                  </nz-descriptions-item>
                  <nz-descriptions-item nzTitle="Total Tokens">
                    {{ usageMetadata()!.totalTokenCount }}
                  </nz-descriptions-item>
                </nz-descriptions>
              }
            }
          </div>
        </nz-tab>

        <!-- Advanced Content Generation -->
        <nz-tab nzTitle="進階生成">
          <div class="p-md">
            <nz-alert nzType="info" nzMessage="進階生成模式" nzDescription="支援更多自訂參數和複雜的生成請求" nzShowIcon class="mb-md" />

            <nz-form-item>
              <nz-form-label>提示詞</nz-form-label>
              <nz-form-control>
                <textarea rows="8" nz-input [(ngModel)]="advancedPrompt" placeholder="輸入提示詞..."></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>設定參數 (JSON)</nz-form-label>
              <nz-form-control>
                <textarea
                  rows="4"
                  nz-input
                  [(ngModel)]="advancedConfigJson"
                  placeholder='{&#10;  "maxOutputTokens": 2000,&#10;  "temperature": 0.9,&#10;  "topP": 0.95&#10;}'
                ></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-control>
                <button
                  nz-button
                  nzType="primary"
                  [nzLoading]="advancedLoading()"
                  [disabled]="!advancedPrompt"
                  (click)="generateAdvanced()"
                >
                  <span nz-icon nzType="experiment"></span>
                  進階生成
                </button>
              </nz-form-control>
            </nz-form-item>

            @if (advancedResult()) {
              <nz-divider />
              <h4>生成結果</h4>

              @if (advancedResult()!.success && advancedResult()!.data) {
                <div class="generated-text">
                  <pre>{{ advancedResult()!.data!.text }}</pre>
                </div>

                @if (advancedResult()!.data!.usageMetadata) {
                  <nz-descriptions nzBordered nzSize="small" [nzColumn]="3" class="mt-md">
                    <nz-descriptions-item nzTitle="Prompt Tokens">
                      {{ advancedResult()!.data!.usageMetadata!.promptTokenCount }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Generated Tokens">
                      {{ advancedResult()!.data!.usageMetadata!.candidatesTokenCount }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Total Tokens">
                      {{ advancedResult()!.data!.usageMetadata!.totalTokenCount }}
                    </nz-descriptions-item>
                  </nz-descriptions>
                }

                @if (advancedResult()!.data!.finishReason) {
                  <nz-tag class="mt-sm" nzColor="blue"> 完成原因: {{ advancedResult()!.data!.finishReason }} </nz-tag>
                }
              } @else if (advancedResult()!.error) {
                <nz-alert
                  nzType="error"
                  [nzMessage]="advancedResult()!.error!.message"
                  [nzDescription]="
                    advancedResult()!.error!.type + (advancedResult()!.error!.code ? ' (' + advancedResult()!.error!.code + ')' : '')
                  "
                  nzShowIcon
                />
              }
            }
          </div>
        </nz-tab>

        <!-- Chat History -->
        <nz-tab nzTitle="對話歷史">
          <div class="p-md">
            <div class="chat-history">
              @for (msg of chatHistory(); track $index) {
                <div [class.user-message]="msg.role === 'user'" [class.model-message]="msg.role === 'model'">
                  <div class="message-header">
                    <strong>{{ msg.role === 'user' ? '使用者' : 'AI' }}</strong>
                    <span class="message-time">{{ msg.timestamp | date: 'short' }}</span>
                  </div>
                  <div class="message-content">{{ msg.content }}</div>
                </div>
              } @empty {
                <nz-empty nzNotFoundContent="尚無對話記錄" />
              }
            </div>

            <div class="mt-md">
              <button nz-button nzDanger (click)="clearHistory()">
                <span nz-icon nzType="delete"></span>
                清除歷史
              </button>
            </div>
          </div>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [
    `
      .generated-text {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        max-height: 500px;
        overflow-y: auto;
      }

      .generated-text pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
      }

      .chat-history {
        max-height: 400px;
        overflow-y: auto;
        padding: 16px;
        background: #fafafa;
        border-radius: 4px;
      }

      .user-message,
      .model-message {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 8px;
      }

      .user-message {
        background: #e6f7ff;
        border-left: 3px solid #1890ff;
      }

      .model-message {
        background: #f6ffed;
        border-left: 3px solid #52c41a;
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;
      }

      .message-time {
        color: #8c8c8c;
      }

      .message-content {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `
  ]
})
export class AiGeneratorComponent {
  private functions = inject(Functions);
  private message = inject(NzMessageService);

  // Simple generation state
  prompt = '';
  selectedModel = 'gemini-2.5-flash';
  maxTokens = 2000;
  temperature = 0.9;
  generateLoading = signal(false);
  generatedText = signal<string | null>(null);
  usageMetadata = signal<{
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  } | null>(null);

  // Advanced generation state
  advancedPrompt = '';
  advancedConfigJson = '';
  advancedLoading = signal(false);
  advancedResult = signal<GenerateContentResponse | null>(null);

  // Chat history
  chatHistory = signal<ChatMessage[]>([]);

  /**
   * Simple text generation
   */
  async generateText(): Promise<void> {
    if (!this.prompt) {
      this.message.warning('請輸入提示詞');
      return;
    }

    this.generateLoading.set(true);
    this.generatedText.set(null);
    this.usageMetadata.set(null);

    try {
      const callable = httpsCallable<GenerateTextRequest, GenerateTextResponse>(this.functions, 'genai-generateText');

      const response = await callable({
        prompt: this.prompt,
        model: this.selectedModel,
        config: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature
        }
      });

      this.generatedText.set(response.data.text);

      if (response.data.usage) {
        this.usageMetadata.set({
          promptTokenCount: response.data.usage.promptTokens,
          candidatesTokenCount: response.data.usage.completionTokens,
          totalTokenCount: response.data.usage.totalTokens
        });
      }

      // Add to chat history
      this.addToChatHistory('user', this.prompt);
      this.addToChatHistory('model', response.data.text);

      this.message.success('生成完成!');
    } catch (error: any) {
      console.error('generateText error:', error);
      this.message.error(error.message || '生成失敗');
    } finally {
      this.generateLoading.set(false);
    }
  }

  /**
   * Advanced content generation
   */
  async generateAdvanced(): Promise<void> {
    if (!this.advancedPrompt) {
      this.message.warning('請輸入提示詞');
      return;
    }

    this.advancedLoading.set(true);
    this.advancedResult.set(null);

    try {
      // Parse config JSON
      let config: any = {};
      if (this.advancedConfigJson) {
        try {
          config = JSON.parse(this.advancedConfigJson);
        } catch (e) {
          this.message.error('設定參數 JSON 格式錯誤');
          this.advancedLoading.set(false);
          return;
        }
      }

      const callable = httpsCallable<GenerateContentRequest, GenerateContentResponse>(this.functions, 'genai-generateContent');

      const response = await callable({
        prompt: this.advancedPrompt,
        model: this.selectedModel,
        config
      });

      this.advancedResult.set(response.data);

      if (response.data.success && response.data.data?.text) {
        this.message.success('生成完成!');
        // Add to chat history
        this.addToChatHistory('user', this.advancedPrompt);
        this.addToChatHistory('model', response.data.data.text);
      } else {
        this.message.error(response.data.error?.message || '生成失敗');
      }
    } catch (error: any) {
      console.error('generateAdvanced error:', error);
      this.message.error(error.message || '生成失敗');
      this.advancedResult.set({
        success: false,
        error: {
          type: 'unknown',
          message: error.message || '未知錯誤'
        }
      });
    } finally {
      this.advancedLoading.set(false);
    }
  }

  /**
   * Add message to chat history
   */
  private addToChatHistory(role: 'user' | 'model', content: string): void {
    this.chatHistory.update(history => [
      ...history,
      {
        role,
        content,
        timestamp: new Date()
      }
    ]);
  }

  /**
   * Clear result
   */
  clearResult(): void {
    this.generatedText.set(null);
    this.usageMetadata.set(null);
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.chatHistory.set([]);
    this.message.info('對話歷史已清除');
  }
}
