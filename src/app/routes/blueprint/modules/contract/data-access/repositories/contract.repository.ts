import { Injectable } from '@angular/core';
import { query, where, orderBy, DocumentData, Timestamp } from '@angular/fire/firestore';
import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { ContractModel } from '../models/contract.model';
import {
  ApprovalRecord,
  ContractAttachment,
  ContractParty,
  ContractStatus,
  ContractType,
  ParsedContractData
} from '../../shared/types/contract.types';

@Injectable({ providedIn: 'root' })
export class ContractRepository extends FirestoreBaseRepository<ContractModel> {
  protected collectionName = 'contracts';

  async findByBlueprintId(blueprintId: string): Promise<ContractModel[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        orderBy('effective_date', 'desc')
      );
      return this.queryDocuments(q);
    });
  }

  protected toEntity(data: DocumentData, id: string): ContractModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? data['blueprintId'] ?? '',
      title: data['title'] ?? '',
      contractNumber: data['contract_number'] ?? '',
      contractType: (data['contract_type'] ?? 'other') as ContractType,
      description: data['description'],
      partyA: this.toParty(data['party_a']),
      partyB: this.toParty(data['party_b']),
      partyC: this.toParty(data['party_c']),
      totalAmount: data['total_amount'] ?? 0,
      paidAmount: data['paid_amount'] ?? 0,
      currency: data['currency'] ?? 'TWD',
      paymentTerms: data['payment_terms'],
      startDate: this.toDate(data['start_date']) ?? new Date(),
      endDate: this.toDate(data['end_date']) ?? new Date(),
      effectiveDate: this.toDate(data['effective_date']),
      signedDate: this.toDate(data['signed_date']),
      status: (data['status'] ?? 'draft') as ContractStatus,
      version: data['version'] ?? 1,
      previousVersionId: data['previous_version_id'],
      attachments: this.toAttachments(data['attachments']),
      originalFileUrl: data['original_file_url'],
      parsedData: this.toParsedData(data['parsed_data']),
      approvalStatus: data['approval_status'],
      approvalHistory: this.toApprovalHistory(data['approval_history']),
      createdAt: this.toDate(data['created_at']) ?? new Date(),
      createdBy: data['created_by'] ?? '',
      updatedAt: this.toDate(data['updated_at']) ?? new Date(),
      updatedBy: data['updated_by'] ?? '',
      deletedAt: this.toDate(data['deleted_at']) ?? null,
      tags: data['tags'] ?? [],
      notes: data['notes'],
      metadata: data['metadata'] ?? {}
    };
  }

  protected override toDocument(entity: Partial<ContractModel>): DocumentData {
    const doc: DocumentData = {};

    if (entity.blueprintId !== undefined) doc['blueprint_id'] = entity.blueprintId;
    if (entity.title !== undefined) doc['title'] = entity.title;
    if (entity.contractNumber !== undefined) doc['contract_number'] = entity.contractNumber;
    if (entity.contractType !== undefined) doc['contract_type'] = entity.contractType;
    if (entity.description !== undefined) doc['description'] = entity.description;
    if (entity.partyA !== undefined) doc['party_a'] = entity.partyA;
    if (entity.partyB !== undefined) doc['party_b'] = entity.partyB;
    if (entity.partyC !== undefined) doc['party_c'] = entity.partyC;
    if (entity.totalAmount !== undefined) doc['total_amount'] = entity.totalAmount;
    if (entity.paidAmount !== undefined) doc['paid_amount'] = entity.paidAmount;
    if (entity.currency !== undefined) doc['currency'] = entity.currency;
    if (entity.paymentTerms !== undefined) doc['payment_terms'] = entity.paymentTerms;
    if (entity.startDate !== undefined) doc['start_date'] = this.toTimestamp(entity.startDate);
    if (entity.endDate !== undefined) doc['end_date'] = this.toTimestamp(entity.endDate);
    if (entity.effectiveDate !== undefined) doc['effective_date'] = this.toTimestamp(entity.effectiveDate);
    if (entity.signedDate !== undefined) doc['signed_date'] = this.toTimestamp(entity.signedDate);
    if (entity.status !== undefined) doc['status'] = entity.status;
    if (entity.version !== undefined) doc['version'] = entity.version;
    if (entity.previousVersionId !== undefined) doc['previous_version_id'] = entity.previousVersionId;
    if (entity.attachments !== undefined) doc['attachments'] = entity.attachments;
    if (entity.originalFileUrl !== undefined) doc['original_file_url'] = entity.originalFileUrl;
    if (entity.parsedData !== undefined) doc['parsed_data'] = entity.parsedData;
    if (entity.approvalStatus !== undefined) doc['approval_status'] = entity.approvalStatus;
    if (entity.approvalHistory !== undefined) doc['approval_history'] = entity.approvalHistory;
    if (entity.createdAt !== undefined) doc['created_at'] = this.toTimestamp(entity.createdAt);
    if (entity.createdBy !== undefined) doc['created_by'] = entity.createdBy;
    if (entity.updatedAt !== undefined) doc['updated_at'] = this.toTimestamp(entity.updatedAt);
    if (entity.updatedBy !== undefined) doc['updated_by'] = entity.updatedBy;
    if (entity.deletedAt !== undefined) doc['deleted_at'] = entity.deletedAt ? this.toTimestamp(entity.deletedAt) : null;
    if (entity.tags !== undefined) doc['tags'] = entity.tags;
    if (entity.notes !== undefined) doc['notes'] = entity.notes;
    if (entity.metadata !== undefined) doc['metadata'] = entity.metadata;

    return doc;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }

  private toTimestamp(value: Date | undefined): Timestamp | undefined {
    return value ? Timestamp.fromDate(value) : undefined;
  }

  private toParty(value: any): ContractParty {
    if (!value) {
      return { id: '', name: '', type: 'organization' };
    }
    return {
      id: value['id'] ?? '',
      name: value['name'] ?? '',
      type: value['type'] ?? 'organization',
      contactPerson: value['contactPerson'] ?? value['contact_person'],
      phone: value['phone'],
      email: value['email'],
      address: value['address']
    };
  }

  private toAttachments(value: any): ContractAttachment[] {
    if (!Array.isArray(value)) return [];
    return value.map(item => ({
      id: item['id'] ?? '',
      fileName: item['fileName'] ?? item['file_name'] ?? '',
      fileType: item['fileType'] ?? item['file_type'] ?? '',
      fileSize: item['fileSize'] ?? item['file_size'] ?? 0,
      storagePath: item['storagePath'] ?? item['storage_path'] ?? '',
      downloadUrl: item['downloadUrl'] ?? item['download_url'],
      uploadedAt: this.toDate(item['uploadedAt'] ?? item['uploaded_at']) ?? new Date(),
      uploadedBy: item['uploadedBy'] ?? item['uploaded_by'] ?? ''
    }));
  }

  private toParsedData(value: any): ParsedContractData | undefined {
    if (!value) return undefined;
    return {
      extractedFields: value['extractedFields'] ?? value['extracted_fields'] ?? {},
      workItems: Array.isArray(value['workItems'] ?? value['work_items'])
        ? (value['workItems'] ?? value['work_items']).map((item: any) => ({
            id: item['id'] ?? '',
            name: item['name'] ?? '',
            quantity: item['quantity'] ?? 0,
            unit: item['unit'] ?? '',
            unitPrice: item['unitPrice'] ?? item['unit_price'] ?? 0,
            totalPrice: item['totalPrice'] ?? item['total_price'] ?? 0,
            description: item['description']
          }))
        : [],
      keyTerms: value['keyTerms'] ?? value['key_terms'] ?? [],
      confidence: value['confidence'] ?? 0,
      parsedAt: this.toDate(value['parsedAt'] ?? value['parsed_at']) ?? new Date(),
      parserVersion: value['parserVersion'] ?? value['parser_version'] ?? ''
    };
  }

  private toApprovalHistory(value: any): ApprovalRecord[] {
    if (!Array.isArray(value)) return [];
    return value.map(item => ({
      id: item['id'] ?? '',
      approverUserId: item['approverUserId'] ?? item['approver_user_id'] ?? '',
      approverName: item['approverName'] ?? item['approver_name'] ?? '',
      action: item['action'],
      comment: item['comment'],
      timestamp: this.toDate(item['timestamp']) ?? new Date(),
      level: item['level'] ?? 0
    }));
  }
}
