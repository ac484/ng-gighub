import { Injectable, inject } from '@angular/core';
import { LogFirestoreRepository } from '@core/data-access/repositories/log-firestore.repository';
import { LoggerService } from '@core/services/logger';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/domain/types/log/log.types';

import { CreateDiaryRequest, Diary, DiaryPhoto, UpdateDiaryRequest } from './diary.model';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly logRepo = inject(LogFirestoreRepository);
  private readonly logger = inject(LoggerService);

  async findByBlueprint(blueprintId: string): Promise<Diary[]> {
    return this.logRepo.findByBlueprint(blueprintId);
  }

  async findById(id: string): Promise<Diary | null> {
    return this.logRepo.findById(id);
  }

  async create(request: CreateDiaryRequest): Promise<Diary> {
    return this.logRepo.create(request as CreateLogRequest);
  }

  async update(id: string, request: UpdateDiaryRequest): Promise<void> {
    return this.logRepo.update(id, request as UpdateLogRequest);
  }

  async delete(id: string): Promise<void> {
    return this.logRepo.delete(id);
  }

  async uploadPhoto(logId: string, file: File, caption?: string): Promise<DiaryPhoto> {
    return this.logRepo.uploadPhoto(logId, file, caption);
  }

  async deletePhoto(logId: string, photoId: string): Promise<void> {
    return this.logRepo.deletePhoto(logId, photoId);
  }

  logError(context: string, error: unknown, extra?: Record<string, unknown>): void {
    this.logger.error('[DiaryRepository]', context, error as Error, extra);
  }
}
