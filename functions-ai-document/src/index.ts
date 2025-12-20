import { DocumentProcessorServiceClient, protos } from '@google-cloud/documentai';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10
});

if (!admin.apps.length) {
  admin.initializeApp();
}

type ProcessRequest = {
  gcsUri: string;
  mimeType: string;
  skipHumanReview?: boolean;
  fieldMask?: string;
};

type DocumentProcessingResult = {
  text: string;
  pages?: Array<{
    pageNumber: number;
    width: number;
    height: number;
    paragraphs?: string[];
  }>;
  entities?: Array<{
    type: string;
    mentionText: string;
    confidence?: number;
    normalizedValue?: string;
  }>;
  formFields?: Array<{
    fieldName: string;
    fieldValue: string;
    confidence?: number;
  }>;
  metadata: {
    processorVersion: string;
    processingTime: number;
    pageCount: number;
    mimeType: string;
  };
  outputUri: string;
};

type TextAnchor = protos.google.cloud.documentai.v1.Document.ITextAnchor;

type Paragraph = protos.google.cloud.documentai.v1.Document.Page.IParagraph;

type Entity = protos.google.cloud.documentai.v1.Document.IEntity;

type FormField = protos.google.cloud.documentai.v1.Document.Page.IFormField;

function parseGcsUri(uri: string): { bucket: string; path: string } {
  const match = uri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    throw new HttpsError('invalid-argument', 'Invalid GCS URI. Expected gs://bucket/path');
  }
  return { bucket: match[1], path: match[2] };
}

function extractText(anchor: TextAnchor | null | undefined, fullText: string | undefined): string {
  if (!anchor?.textSegments?.length || !fullText) return '';
  const [segment] = anchor.textSegments;
  const start = Number(segment.startIndex ?? 0);
  const end = Number(segment.endIndex ?? fullText.length);
  return fullText.substring(start, end).trim();
}

function toResult(document: protos.google.cloud.documentai.v1.IDocument, mimeType: string, durationMs: number, outputUri: string): DocumentProcessingResult {
  const text = document.text ?? '';
  const pages = (document.pages ?? []).map((page, index) => ({
    pageNumber: Number(page.pageNumber ?? index + 1),
    width: Number(page.dimension?.width ?? 0),
    height: Number(page.dimension?.height ?? 0),
    paragraphs: (page.paragraphs ?? [])
      .map((p: Paragraph) => extractText(p.layout?.textAnchor, text))
      .filter(Boolean)
  }));

  const entities = (document.entities ?? []).map((entity: Entity) => ({
    type: entity.type ?? '',
    mentionText: entity.mentionText ?? extractText(entity.textAnchor, text),
    confidence: entity.confidence ?? undefined,
    normalizedValue: entity.normalizedValue?.text ?? undefined
  }));

  const formFields = (document.pages ?? [])
    .flatMap(page => page.formFields ?? [])
    .map((field: FormField) => ({
      fieldName: extractText(field.fieldName?.textAnchor, text),
      fieldValue: extractText(field.fieldValue?.textAnchor, text),
    }))
    .filter(field => field.fieldName || field.fieldValue);

  return {
    text,
    pages,
    entities,
    formFields,
    metadata: {
      processorVersion: (document as { processorVersion?: string }).processorVersion ?? '',
      processingTime: durationMs,
      pageCount: pages.length,
      mimeType
    },
    outputUri
  };
}

export const processDocumentFromStorage = onCall<ProcessRequest>(async request => {
  const { gcsUri, mimeType, skipHumanReview = true, fieldMask } = request.data;

  if (!gcsUri || !mimeType) {
    throw new HttpsError('invalid-argument', 'gcsUri and mimeType are required');
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  const location = process.env.DOCUMENTAI_LOCATION;
  const processorId = process.env.DOCUMENTAI_PROCESSOR_ID;

  if (!projectId || !location || !processorId) {
    throw new HttpsError('failed-precondition', 'Missing DOCUMENTAI_LOCATION or DOCUMENTAI_PROCESSOR_ID configuration');
  }

  const apiEndpoint = process.env.DOCUMENTAI_API_ENDPOINT || `${location}-documentai.googleapis.com`;
  const client = new DocumentProcessorServiceClient({ apiEndpoint });
  const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const start = Date.now();
  const [response] = await client.processDocument({
    name: processorName,
    gcsDocument: { gcsUri, mimeType },
    skipHumanReview,
    fieldMask: fieldMask ? { paths: [fieldMask] } : undefined
  });

  if (!response.document) {
    throw new HttpsError('internal', 'No document returned from Document AI');
  }

  const { bucket, path } = parseGcsUri(gcsUri);
  const outputPath = `${path}.json`;
  const outputUri = `gs://${bucket}/${outputPath}`;

  const result = toResult(response.document, mimeType, Date.now() - start, outputUri);

  await admin
    .storage()
    .bucket(bucket)
    .file(outputPath)
    .save(JSON.stringify(result, null, 2), { contentType: 'application/json' });

  return {
    success: true,
    result
  };
});
