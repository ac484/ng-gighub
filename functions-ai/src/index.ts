/**
 * Firebase Cloud Functions - AI Module
 *
 * Contains AI-powered functions including:
 * - Contract document parsing (OCR/AI)
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { setGlobalOptions } from 'firebase-functions';

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Export contract parsing function
export { parseContractDocument } from './contract-parsing';
