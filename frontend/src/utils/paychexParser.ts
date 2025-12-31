/**
 * Paychex PDF Parser
 * Extracts payroll data from Paychex journal PDFs
 */

import * as pdfjsLib from 'pdfjs-dist';
import { parseDateString } from './payrollUtils';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Parsed payroll data from Paychex PDF
 */
export interface ParsedPayrollData {
  totalGross: number;
  totalNet: number;
  totalTaxes: number;
  totalDeductions: number;
  payPeriodStart: string; // yyyy-MM-dd
  payPeriodEnd: string;   // yyyy-MM-dd
  checkDate: string;      // yyyy-MM-dd
  rawText?: string;       // Full extracted text for debugging
}

/**
 * Parse a Paychex payroll journal PDF file
 *
 * @param file - PDF file to parse
 * @returns Parsed payroll data or null if parsing fails
 */
export async function parsePaychexPDF(file: File): Promise<ParsedPayrollData | null> {
  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Extract financial amounts using regex patterns
    const extractAmount = (patterns: RegExp[]): number => {
      for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
      }
      return 0;
    };

    // Extract date using regex patterns
    const extractDate = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
          return parseDateString(match[1]);
        }
      }
      return '';
    };

    // Gross pay patterns (most common variations)
    const totalGross = extractAmount([
      /Total Gross Pay[:\s]+\$?([\d,]+\.\d{2})/i,
      /Gross Pay[:\s]+\$?([\d,]+\.\d{2})/i,
      /Total Gross[:\s]+\$?([\d,]+\.\d{2})/i,
    ]);

    // Net pay patterns
    const totalNet = extractAmount([
      /Total Net Pay[:\s]+\$?([\d,]+\.\d{2})/i,
      /Net Pay[:\s]+\$?([\d,]+\.\d{2})/i,
      /Total Net[:\s]+\$?([\d,]+\.\d{2})/i,
    ]);

    // Tax patterns
    const totalTaxes = extractAmount([
      /Total Taxes[:\s]+\$?([\d,]+\.\d{2})/i,
      /Tax Liability[:\s]+\$?([\d,]+\.\d{2})/i,
      /Taxes[:\s]+\$?([\d,]+\.\d{2})/i,
      /Federal Tax[:\s]+\$?([\d,]+\.\d{2})/i,
    ]);

    // Deduction patterns
    const totalDeductions = extractAmount([
      /Total Deductions[:\s]+\$?([\d,]+\.\d{2})/i,
      /Deductions[:\s]+\$?([\d,]+\.\d{2})/i,
    ]);

    // Check date patterns
    const checkDate = extractDate([
      /Check Date[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
      /Date of Payment[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i,
    ]);

    // Pay period patterns - look for "Pay Period: MM/DD/YYYY - MM/DD/YYYY"
    const payPeriodMatch = fullText.match(
      /Pay Period[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})\s*-\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i
    );

    let payPeriodStart = '';
    let payPeriodEnd = '';

    if (payPeriodMatch) {
      payPeriodStart = parseDateString(payPeriodMatch[1]);
      payPeriodEnd = parseDateString(payPeriodMatch[2]);
    }

    // Validation: ensure we extracted meaningful data
    if (totalGross === 0 && totalNet === 0) {
      console.warn('Could not extract payroll amounts from PDF');
      return null;
    }

    const result: ParsedPayrollData = {
      totalGross,
      totalNet,
      totalTaxes,
      totalDeductions,
      payPeriodStart,
      payPeriodEnd,
      checkDate,
      rawText: fullText, // Include for debugging
    };

    return result;
  } catch (error) {
    console.error('PDF Parsing Error:', error);
    return null;
  }
}

/**
 * Validate parsed payroll data
 * Checks for required fields and logical consistency
 *
 * @param data - Parsed payroll data to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateParsedPayroll(data: ParsedPayrollData): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.totalGross || data.totalGross <= 0) {
    errors.push('Total Gross Pay is required and must be greater than zero');
  }

  if (!data.totalNet || data.totalNet <= 0) {
    errors.push('Total Net Pay is required and must be greater than zero');
  }

  if (!data.checkDate) {
    errors.push('Check Date is required');
  }

  if (!data.payPeriodStart || !data.payPeriodEnd) {
    errors.push('Pay Period Start and End dates are required');
  }

  // Logical consistency checks
  if (data.totalNet > data.totalGross) {
    errors.push('Net Pay cannot be greater than Gross Pay');
  }

  const calculatedNet = data.totalGross - data.totalTaxes - data.totalDeductions;
  const netDifference = Math.abs(calculatedNet - data.totalNet);

  // Allow small rounding differences (up to $1)
  if (netDifference > 1) {
    errors.push(
      `Net Pay calculation mismatch: Gross ($${data.totalGross.toFixed(2)}) - Taxes ($${data.totalTaxes.toFixed(2)}) - Deductions ($${data.totalDeductions.toFixed(2)}) = $${calculatedNet.toFixed(2)}, but Net Pay is $${data.totalNet.toFixed(2)}`
    );
  }

  // Date validation
  if (data.payPeriodStart && data.payPeriodEnd) {
    const start = new Date(data.payPeriodStart);
    const end = new Date(data.payPeriodEnd);

    if (end < start) {
      errors.push('Pay Period End date cannot be before Start date');
    }
  }

  return errors;
}

/**
 * Extract text from PDF file for preview/debugging
 * @param file - PDF file
 * @returns Extracted text or error message
 */
export async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    return `Error extracting text: ${error}`;
  }
}
