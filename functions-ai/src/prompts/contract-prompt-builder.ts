/**
 * Contract Prompt Builder
 * 
 * Modular prompt construction for AI contract parsing with JSON schema validation.
 * Follows KISS principle and奧卡姆剃刀 (Occam's Razor) - simple, effective, maintainable.
 * 
 * @module prompts/contract-prompt-builder
 */

/**
 * JSON Schema for Contract Parsing Output
 * Defines the exact structure expected from AI response
 */
export const CONTRACT_PARSING_SCHEMA = {
  type: 'object',
  properties: {
    contractNumber: {
      type: 'string',
      description: '合約編號'
    },
    title: {
      type: 'string',
      description: '合約名稱或專案標題'
    },
    description: {
      type: 'string',
      description: '合約描述或摘要'
    },
    totalAmount: {
      type: 'number',
      description: '合約總金額'
    },
    currency: {
      type: 'string',
      enum: ['TWD', 'USD', 'CNY', 'EUR', 'JPY'],
      description: '貨幣幣別'
    },
    startDate: {
      type: 'string',
      format: 'date',
      description: '合約開始日期 (YYYY-MM-DD)'
    },
    endDate: {
      type: 'string',
      format: 'date',
      description: '合約結束日期 (YYYY-MM-DD)'
    },
    signedDate: {
      type: 'string',
      format: 'date',
      description: '簽約日期 (YYYY-MM-DD)'
    },
    owner: {
      type: 'object',
      description: '業主資訊',
      properties: {
        name: { type: 'string', description: '公司名稱' },
        contactPerson: { type: 'string', description: '聯絡人姓名' },
        contactPhone: { type: 'string', description: '聯絡電話' },
        contactEmail: { type: 'string', description: '聯絡信箱' },
        address: { type: 'string', description: '地址' },
        taxId: { type: 'string', description: '統一編號' }
      },
      required: ['name', 'contactPerson']
    },
    contractor: {
      type: 'object',
      description: '承商資訊',
      properties: {
        name: { type: 'string', description: '公司名稱' },
        contactPerson: { type: 'string', description: '聯絡人姓名' },
        contactPhone: { type: 'string', description: '聯絡電話' },
        contactEmail: { type: 'string', description: '聯絡信箱' },
        address: { type: 'string', description: '地址' },
        taxId: { type: 'string', description: '統一編號' }
      },
      required: ['name', 'contactPerson']
    },
    workItems: {
      type: 'array',
      description: '工項清單',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '工項代碼' },
          title: { type: 'string', description: '工項名稱' },
          description: { type: 'string', description: '工項描述' },
          quantity: { type: 'number', description: '數量' },
          unit: { type: 'string', description: '單位 (如: 式, 個, m², 公尺)' },
          unitPrice: { type: 'number', description: '單價' },
          totalPrice: { type: 'number', description: '總價' }
        },
        required: ['title', 'quantity', 'unit', 'unitPrice']
      }
    },
    confidenceScores: {
      type: 'object',
      description: '各欄位信心分數 (0-1)',
      properties: {
        contractNumber: { type: 'number' },
        title: { type: 'number' },
        totalAmount: { type: 'number' },
        dates: { type: 'number' },
        parties: { type: 'number' },
        workItems: { type: 'number' }
      }
    }
  },
  required: ['title', 'totalAmount', 'currency']
};

/**
 * Contract Prompt Builder
 * Generates optimized prompts for Gemini AI contract parsing
 */
export class ContractPromptBuilder {
  private static readonly SYSTEM_INSTRUCTION = `你是一位專業的合約文件解析專家，專精於台灣工程合約的分析與資料提取。
你的任務是從合約文件中準確提取結構化資訊，並遵循以下原則：

1. 準確性優先：確保提取的資料與原文件完全一致
2. 完整性：盡可能提取所有相關資訊
3. 信心評分：為每個提取的欄位提供信心分數 (0-1)
4. 台灣慣用格式：理解台灣工程合約的常見格式與術語
5. 數字精確：正確識別金額、數量、日期等數值資訊`;

  /**
   * Build prompt for contract parsing
   * 
   * @param fileUri - URI of the contract file (image/PDF)
   * @param additionalContext - Optional additional context or requirements
   * @returns Structured prompt for AI model
   */
  static buildParsingPrompt(
    fileUri: string,
    additionalContext?: string
  ): {
    systemInstruction: string;
    contents: string;
    jsonSchema: typeof CONTRACT_PARSING_SCHEMA;
  } {
    const basePrompt = `請仔細分析以下工程合約文件，並提取所有相關資訊。

**文件來源**: ${fileUri}

**提取要求**:
1. **合約基本資訊**: 合約編號、標題、描述、總金額、幣別
2. **日期資訊**: 開始日期、結束日期、簽約日期 (格式: YYYY-MM-DD)
3. **業主資訊**: 公司名稱、聯絡人、電話、信箱、地址、統編
4. **承商資訊**: 公司名稱、聯絡人、電話、信箱、地址、統編
5. **工項清單**: 代碼、名稱、描述、數量、單位、單價、總價
6. **信心分數**: 為每個類別的資料提取提供信心分數 (0-1)

**輸出格式**: 
嚴格遵循 JSON Schema 結構，確保所有欄位類型正確。
日期必須使用 YYYY-MM-DD 格式。
金額必須為純數字，不含貨幣符號或千分位。

${additionalContext ? `\n**額外要求**: ${additionalContext}` : ''}`;

    return {
      systemInstruction: this.SYSTEM_INSTRUCTION,
      contents: basePrompt,
      jsonSchema: CONTRACT_PARSING_SCHEMA
    };
  }

  /**
   * Build validation prompt for parsed data
   * Used to verify and enhance AI-generated results
   * 
   * @param parsedData - Initially parsed contract data
   * @returns Validation prompt
   */
  static buildValidationPrompt(parsedData: any): string {
    return `請驗證以下合約解析結果的準確性和完整性：

${JSON.stringify(parsedData, null, 2)}

**驗證項目**:
1. 所有必填欄位是否完整
2. 日期格式是否正確 (YYYY-MM-DD)
3. 金額計算是否一致 (工項總價 vs 合約總金額)
4. 聯絡資訊格式是否合理
5. 信心分數是否與資料品質相符

**輸出**:
- 若發現錯誤，請提供修正建議
- 若資料完整且正確，確認通過驗證`;
  }

  /**
   * Build enhancement prompt for low-confidence fields
   * Used to improve specific fields with low confidence scores
   * 
   * @param fieldName - Name of the field to enhance
   * @param currentValue - Current value of the field
   * @param context - Additional context from the document
   * @returns Enhancement prompt
   */
  static buildEnhancementPrompt(
    fieldName: string,
    currentValue: any,
    context?: string
  ): string {
    return `請針對以下合約欄位進行深度分析和改進：

**欄位名稱**: ${fieldName}
**當前值**: ${JSON.stringify(currentValue, null, 2)}
**文件脈絡**: ${context || '未提供額外脈絡'}

**改進要求**:
1. 重新檢視原始文件，確認資料準確性
2. 若當前值不正確或不完整，提供修正後的值
3. 提供新的信心分數 (0-1)
4. 說明修正依據

**輸出格式**:
{
  "value": <修正後的值>,
  "confidence": <新的信心分數>,
  "reasoning": "<修正依據>"
}`;
  }
}

/**
 * Prompt configuration presets for different scenarios
 */
export const PROMPT_PRESETS = {
  /**
   * Standard contract parsing (default)
   */
  STANDARD: {
    temperature: 0.2,
    maxOutputTokens: 8192,
    topP: 0.95,
    topK: 40
  },

  /**
   * High-accuracy parsing (lower temperature, more deterministic)
   */
  HIGH_ACCURACY: {
    temperature: 0.1,
    maxOutputTokens: 8192,
    topP: 0.9,
    topK: 20
  },

  /**
   * Complex document parsing (higher tokens for detailed output)
   */
  COMPLEX_DOCUMENT: {
    temperature: 0.2,
    maxOutputTokens: 16384,
    topP: 0.95,
    topK: 40
  }
};
