import { Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/services/logger';

import { CreateIssueData, Issue, UpdateIssueData } from './issues.model';
import { IssuesRepository } from './issues.repository';

@Injectable({ providedIn: 'root' })
export class IssueManagementService {
  private readonly repository = inject(IssuesRepository);
  private readonly logger = inject(LoggerService);

  async listIssues(blueprintId: string): Promise<Issue[]> {
    return this.repository.listIssues(blueprintId);
  }

  async createIssue(payload: CreateIssueData): Promise<Issue> {
    try {
      return await this.repository.createIssue(payload);
    } catch (error) {
      this.logger.error('[IssueManagementService]', 'createIssue failed', error as Error);
      throw error;
    }
  }

  async updateIssue(id: string, payload: UpdateIssueData): Promise<Issue> {
    try {
      return await this.repository.updateIssue(id, payload);
    } catch (error) {
      this.logger.error('[IssueManagementService]', 'updateIssue failed', error as Error);
      throw error;
    }
  }

  async deleteIssue(id: string): Promise<void> {
    try {
      await this.repository.deleteIssue(id);
    } catch (error) {
      this.logger.error('[IssueManagementService]', 'deleteIssue failed', error as Error);
      throw error;
    }
  }
}
