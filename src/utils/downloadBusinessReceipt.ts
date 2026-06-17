import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';
import { downloadTransactionReceiptPDF } from '@/utils/pdfUtils';
import {
  getBusinessReceiptScheduleProps,
  mapBusinessTransactionToReceipt,
} from '@/utils/mapBusinessTransactionToReceipt';

export async function downloadBusinessReceipt(
  transaction: BusinessTransactionDetail,
): Promise<boolean> {
  const receiptData = mapBusinessTransactionToReceipt(transaction);
  const schedule = getBusinessReceiptScheduleProps(transaction);
  return downloadTransactionReceiptPDF(
    receiptData,
    schedule.isScheduled,
    schedule.frequency,
    schedule.nextPurchaseDate,
  );
}
