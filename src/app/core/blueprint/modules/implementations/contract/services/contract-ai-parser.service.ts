/**
 * Contract AI Parser Service
 *
 * Integrates with functions-ai-document to extract structured data
 * from contract documents using Google Cloud Document AI
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallable, HttpsCallableResult } from '@angular/fire/functions';

import type {
  ParsedContractData,
  ParseContractRequest,
  ParseContractResult,
  ExtractedPartyInfo,
  ExtractedFinancialInfo,
  ExtractedDateInfo,
  ExtractedLineItem,
  ExtractedTextSection,
  ConfidenceLevel
} from '../models/parsed-contract-data.model';

/**
 * Document AI response from functions-ai-document
 */
interface DocumentAIResponse {
  /** Extracted text */
  text: string;
  /** Page count */
  pageCount: number;
  /** Detected entities */
  entities?: Array<{
    type: string;
    mentionText: string;
    confidence: number;
  }>;
  /** Form fields */
  formFields?: Array<{
    fieldName: string;
    fieldValue: string;
    confidence: number;
  }>;
  /** Processing time */
  processingTime: number;
}

@Injectable({ providedIn: 'root' })
export class ContractAIParserService {
  private readonly functions = inject(Functions);

  // State signals
  private readonly _parsing = signal(false);
  readonly parsing = this._parsing.asReadonly();

  private readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  /**
   * Parse contract document from storage
   *
   * Calls functions-ai-document processDocumentFromStorage
   */
  async parseContractFromStorage(request: ParseContractRequest): Promise<ParseContractResult> {
    this._parsing.set(true);
    this._error.set(null);

    try {
      // Call Cloud Function
      const processDocument = httpsCallable<{ storagePath: string; fileName: string }, DocumentAIResponse>(
        this.functions,
        'processDocumentFromStorage'
      );

      const result: HttpsCallableResult<DocumentAIResponse> = await processDocument({
        storagePath: request.storagePath,
        fileName: request.fileName
      });

      const docAIData = result.data;

      // Transform Document AI response to ParsedContractData
      const parsedData = this.transformToContractData(request, docAIData);

      return {
        parseId: parsedData.id,
        data: parsedData,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during parsing';
      this._error.set(errorMessage);

      // Return failed result
      const failedData: ParsedContractData = {
        id: this.generateParseId(),
        sourceFileId: request.fileId,
        parsedAt: new Date(),
        status: 'failed',
        confidenceScore: 0,
        isReviewed: false,
        errorMessage
      };

      return {
        parseId: failedData.id,
        data: failedData,
        success: false,
        error: errorMessage
      };
    } finally {
      this._parsing.set(false);
    }
  }

  /**
   * Transform Document AI response to structured contract data
   */
  private transformToContractData(request: ParseContractRequest, docAIData: DocumentAIResponse): ParsedContractData {
    const parseId = this.generateParseId();
    const fullText = docAIData.text;

    // Extract structured data from text and entities
    const contractNumber = this.extractContractNumber(fullText, docAIData.entities);
    const title = this.extractTitle(fullText);
    const owner = this.extractPartyInfo(fullText, 'owner', docAIData.entities);
    const contractor = this.extractPartyInfo(fullText, 'contractor', docAIData.entities);
    const financial = this.extractFinancialInfo(fullText, docAIData.entities, docAIData.formFields);
    const dates = this.extractDateInfo(fullText, docAIData.entities);
    const lineItems = this.extractLineItems(fullText, docAIData.formFields);
    const textSections = this.extractTextSections(fullText);

    // Calculate overall confidence
    const confidenceScores = [
      owner?.confidence === 'high' ? 100 : owner?.confidence === 'medium' ? 70 : 40,
      contractor?.confidence === 'high' ? 100 : contractor?.confidence === 'medium' ? 70 : 40,
      financial?.confidence === 'high' ? 100 : financial?.confidence === 'medium' ? 70 : 40,
      dates?.confidence === 'high' ? 100 : dates?.confidence === 'medium' ? 70 : 40
    ].filter(score => score > 0);

    const confidenceScore =
      confidenceScores.length > 0 ? Math.round(confidenceScores.reduce((sum, s) => sum + s, 0) / confidenceScores.length) : 50;

    return {
      id: parseId,
      sourceFileId: request.fileId,
      parsedAt: new Date(),
      status: 'completed',
      confidenceScore,
      contractNumber,
      title,
      owner,
      contractor,
      financial,
      dates,
      lineItems,
      textSections,
      fullText,
      pageCount: docAIData.pageCount,
      processingTime: docAIData.processingTime,
      isReviewed: false,
      warnings: this.generateWarnings(confidenceScore)
    };
  }

  /**
   * Extract contract number from text
   */
  private extractContractNumber(
    text: string,
    entities?: Array<{ type: string; mentionText: string; confidence: number }>
  ): string | undefined {
    // Look for patterns like "合約編號", "Contract No.", etc.
    const patterns = [/合約編號[：:]\s*([A-Z0-9-]+)/i, /契約編號[：:]\s*([A-Z0-9-]+)/i, /Contract\s+No\.?\s*[：:]?\s*([A-Z0-9-]+)/i];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: check entities
    if (entities) {
      const contractEntity = entities.find(e => e.type.toLowerCase().includes('contract') && e.confidence > 0.7);
      if (contractEntity) {
        return contractEntity.mentionText;
      }
    }

    return undefined;
  }

  /**
   * Extract title from text
   */
  private extractTitle(text: string): string | undefined {
    // Look for title patterns
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Typically title is in first few lines and contains keywords
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      if (
        (line.includes('合約') ||
          line.includes('契約') ||
          line.includes('協議') ||
          line.includes('Contract') ||
          line.includes('Agreement')) &&
        line.length < 100
      ) {
        return line;
      }
    }

    return undefined;
  }

  /**
   * Extract party information (owner or contractor)
   */
  private extractPartyInfo(
    text: string,
    partyType: 'owner' | 'contractor',
    entities?: Array<{ type: string; mentionText: string; confidence: number }>
  ): ExtractedPartyInfo | undefined {
    const keywords = partyType === 'owner' ? ['甲方', '業主', 'Owner', 'Party A'] : ['乙方', '承商', 'Contractor', 'Party B'];

    // Find section with party keyword
    const lines = text.split('\n');
    let partySection = '';
    let capturing = false;

    for (const line of lines) {
      if (keywords.some(k => line.includes(k))) {
        capturing = true;
        partySection = `${line}\n`;
      } else if (capturing) {
        if (line.trim().length === 0 || keywords.some(k => line.includes(k))) {
          break;
        }
        partySection += `${line}\n`;
        if (partySection.length > 500) break; // Limit section size
      }
    }

    if (!partySection) return undefined;

    // Extract information
    const name = this.extractPartyName(partySection, entities);
    const taxId = this.extractTaxId(partySection);
    const phone = this.extractPhone(partySection);
    const address = this.extractAddress(partySection);

    const hasData = name || taxId || phone || address;
    if (!hasData) return undefined;

    // Determine confidence based on extracted fields
    const fieldCount = [name, taxId, phone, address].filter(Boolean).length;
    const confidence: ConfidenceLevel = fieldCount >= 3 ? 'high' : fieldCount >= 2 ? 'medium' : 'low';

    return {
      name,
      taxId,
      phone,
      address,
      confidence
    };
  }

  private extractPartyName(text: string, entities?: Array<{ type: string; mentionText: string; confidence: number }>): string | undefined {
    // Check entities first
    if (entities) {
      const orgEntity = entities.find(e => e.type.toLowerCase().includes('organization') && e.confidence > 0.7);
      if (orgEntity) return orgEntity.mentionText;
    }

    // Pattern matching
    const patterns = [/公司名稱[：:]\s*(.+)/i, /名稱[：:]\s*(.+)/i, /Company[：:]\s*(.+)/i];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().split('\n')[0];
      }
    }

    return undefined;
  }

  private extractTaxId(text: string): string | undefined {
    const patterns = [/統一編號[：:]\s*([0-9]{8})/i, /稅號[：:]\s*([0-9]{8})/i, /Tax\s+ID[：:]\s*([0-9]{8})/i];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private extractPhone(text: string): string | undefined {
    const patterns = [
      /電話[：:]\s*([\d\-\(\)\s]+)/i,
      /Tel[：:]\s*([\d\-\(\)\s]+)/i,
      /聯絡電話[：:]\s*([\d\-\(\)\s]+)/i,
      /手機[：:]\s*([\d\-\(\)\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().split('\n')[0];
      }
    }

    return undefined;
  }

  private extractAddress(text: string): string | undefined {
    const patterns = [/地址[：:]\s*(.+)/i, /Address[：:]\s*(.+)/i, /住址[：:]\s*(.+)/i];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().split('\n')[0];
      }
    }

    return undefined;
  }

  /**
   * Extract financial information
   */
  private extractFinancialInfo(
    text: string,
    entities?: Array<{ type: string; mentionText: string; confidence: number }>,
    formFields?: Array<{ fieldName: string; fieldValue: string; confidence: number }>
  ): ExtractedFinancialInfo | undefined {
    // Extract total amount
    const totalAmount = this.extractTotalAmount(text, formFields);
    const currency = this.extractCurrency(text) || 'TWD';

    if (!totalAmount) return undefined;

    return {
      totalAmount,
      currency,
      confidence: totalAmount > 0 ? 'high' : 'low'
    };
  }

  private extractTotalAmount(
    text: string,
    formFields?: Array<{ fieldName: string; fieldValue: string; confidence: number }>
  ): number | undefined {
    // Check form fields first
    if (formFields) {
      const amountField = formFields.find(f => f.fieldName.toLowerCase().includes('amount') || f.fieldName.includes('金額'));
      if (amountField && amountField.confidence > 0.7) {
        const amount = parseFloat(amountField.fieldValue.replace(/[^\d.]/g, ''));
        if (!isNaN(amount)) return amount;
      }
    }

    // Pattern matching
    const patterns = [
      /總金額[：:]\s*[NT\$]?\s*([\d,]+)/i,
      /合約金額[：:]\s*[NT\$]?\s*([\d,]+)/i,
      /Total\s+Amount[：:]\s*[NT\$]?\s*([\d,]+)/i,
      /總價[：:]\s*[NT\$]?\s*([\d,]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount)) return amount;
      }
    }

    return undefined;
  }

  private extractCurrency(text: string): string | undefined {
    if (text.includes('NT$') || text.includes('TWD') || text.includes('新台幣')) return 'TWD';
    if (text.includes('USD') || text.includes('US$')) return 'USD';
    if (text.includes('CNY') || text.includes('RMB')) return 'CNY';
    return undefined;
  }

  /**
   * Extract date information
   */
  private extractDateInfo(
    text: string,
    entities?: Array<{ type: string; mentionText: string; confidence: number }>
  ): ExtractedDateInfo | undefined {
    const startDate = this.extractDate(text, ['開始日期', 'Start Date', '施工日期']);
    const endDate = this.extractDate(text, ['完工日期', 'End Date', '結束日期', '竣工日期']);
    const signingDate = this.extractDate(text, ['簽訂日期', 'Signing Date', '立約日期']);

    if (!startDate && !endDate && !signingDate) return undefined;

    const hasData = [startDate, endDate, signingDate].filter(Boolean).length;
    const confidence: ConfidenceLevel = hasData >= 2 ? 'high' : hasData >= 1 ? 'medium' : 'low';

    return {
      startDate,
      endDate,
      signingDate,
      confidence
    };
  }

  private extractDate(text: string, keywords: string[]): Date | undefined {
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[：:]\\s*(\\d{4}[-/年]\\d{1,2}[-/月]\\d{1,2}[日]?)`, 'i');
      const match = text.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].replace(/[年月日]/g, '-').replace(/\s/g, '');
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return undefined;
  }

  /**
   * Extract line items from text
   */
  private extractLineItems(
    text: string,
    formFields?: Array<{ fieldName: string; fieldValue: string; confidence: number }>
  ): ExtractedLineItem[] | undefined {
    // This is a simplified implementation
    // In real scenario, would need more sophisticated parsing

    const lines = text.split('\n');
    const items: ExtractedLineItem[] = [];
    let inItemSection = false;

    for (const line of lines) {
      // Detect start of item list
      if (line.includes('項次') || line.includes('Item') || line.includes('細項')) {
        inItemSection = true;
        continue;
      }

      // Detect end of item list
      if (inItemSection && (line.includes('總計') || line.includes('Total') || line.trim().length === 0)) {
        break;
      }

      // Parse item line (simplified)
      if (inItemSection) {
        const itemMatch = line.match(/(\d+)\s+(.+?)\s+([\d,]+)\s+(\S+)\s+([\d,]+)/);
        if (itemMatch) {
          items.push({
            itemNumber: parseInt(itemMatch[1]),
            name: itemMatch[2].trim(),
            quantity: parseFloat(itemMatch[3].replace(/,/g, '')),
            unit: itemMatch[4],
            unitPrice: parseFloat(itemMatch[5].replace(/,/g, '')),
            amount: parseFloat(itemMatch[3].replace(/,/g, '')) * parseFloat(itemMatch[5].replace(/,/g, '')),
            confidence: 'medium'
          });
        }
      }
    }

    return items.length > 0 ? items : undefined;
  }

  /**
   * Extract text sections (terms, clauses)
   */
  private extractTextSections(text: string): ExtractedTextSection[] | undefined {
    // Simplified implementation - extract sections by headers
    const sections: ExtractedTextSection[] = [];
    const lines = text.split('\n');
    let currentSection: ExtractedTextSection | null = null;

    for (const line of lines) {
      // Detect section headers (e.g., "第一條", "Article 1", etc.)
      const headerMatch = line.match(/^(第[一二三四五六七八九十百]+條|Article\s+\d+|條款\s*\d+)[：:]/i);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.trim(),
          content: '',
          confidence: 'medium'
        };
      } else if (currentSection) {
        currentSection.content += `${line}\n`;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : undefined;
  }

  /**
   * Generate warnings based on confidence
   */
  private generateWarnings(confidenceScore: number): string[] {
    const warnings: string[] = [];

    if (confidenceScore < 70) {
      warnings.push('整體信心度偏低，建議手動檢查解析結果');
    }

    if (confidenceScore < 50) {
      warnings.push('解析信心度極低，可能需要重新上傳更清晰的文件');
    }

    return warnings;
  }

  /**
   * Generate unique parse ID
   */
  private generateParseId(): string {
    return `parse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
