/* eslint-disable @next/next/no-img-element */
import React from 'react';
import styles from './ReceiptHTML.module.css';
import { getProviderLogo } from '@/utils/transactionIcons';
import { formatReceiptDateTime } from '@/utils/formatReceiptDateTime';

export type ReceiptTransaction = {
  id?: string | number;
  date?: string | Date;
  type?: string;
  service?: string;
  provider?: string;
  transactionRef?: string;
  reference?: string;
  orderId?: string;
  order_id?: string;
  receiptNumber?: string;
  receipt_number?: string;
  phoneNumber?: string;
  phone_number?: string;
  meterNumber?: string;
  meter_number?: string;
  smartCardNumber?: string;
  smartcard_number?: string;
  bundleSize?: string;
  data_plan?: string;
  token?: string;
  units?: string | number;
  packageName?: string;
  amount?: number;
  amount_paid?: number;
  paymentType?: string;
  payment_type?: string;
  depositType?: string;
  payment_method?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  address?: string;
  customerName?: string;
  fullName?: string;
  customerEmail?: string;
  customerPhone?: string;
  payer?: string;
  vatAmount?: number;
  serviceCharge?: number;
  service_charge?: number;
  discount?: number;
  totalAmount?: number;
  total_amount?: number;
  amountGenerated?: number;
  paymentMethodLabel?: string;
  statusLabel?: string;
  statusClass?: 'success' | 'pending' | 'failed';
  metadata?: { dataBundle?: string };
};

type ReceiptHTMLProps = {
  transaction: ReceiptTransaction;
  isScheduled?: boolean;
  frequency?: string;
  nextPurchaseDate?: string | Date;
};

const getFrequencyDisplay = (freq: string): string => {
  const freqMap: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return freqMap[freq.toLowerCase()] || freq;
};

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return '₦0.00';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function ReceiptHTML({
  transaction,
  isScheduled = false,
  frequency = '',
  nextPurchaseDate = '',
}: ReceiptHTMLProps) {
  const providerLogo = getProviderLogo(transaction.provider || '', transaction.type || '');
  const isElectricity =
    transaction.type === 'electricity' || transaction.service?.toLowerCase() === 'electricity';
  const isAirtime =
    transaction.type === 'airtime' || transaction.service?.toLowerCase() === 'airtime';
  const isData = transaction.type === 'data' || transaction.service?.toLowerCase() === 'data';
  const isCable =
    transaction.type === 'cable' || transaction.service?.toLowerCase().includes('cable');
  const isDeposit = transaction.type === 'deposit';

  const vatAmount =
    transaction.vatAmount !== undefined && transaction.vatAmount !== null
      ? transaction.vatAmount
      : 0;
  const serviceCharge =
    transaction.serviceCharge !== undefined
      ? transaction.serviceCharge
      : transaction.service_charge !== undefined
        ? transaction.service_charge
        : 0;
  const discount = transaction.discount || 0;
  const amountPaid = transaction.amount_paid ?? 0;
  const totalAmount =
    transaction.totalAmount !== undefined
      ? transaction.totalAmount
      : transaction.total_amount !== undefined
        ? transaction.total_amount
        : amountPaid + serviceCharge + vatAmount - discount;

  const statusLabel = transaction.statusLabel || 'Success';
  const statusClass = transaction.statusClass || 'success';

  return (
    <div className={styles.receiptContainer}>
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <img src="/belpower_full.png" alt="BelPower Logo" className={styles.logo} />
          {providerLogo && (
            <img
              src={providerLogo}
              alt={`${transaction.provider} Logo`}
              className={styles.providerLogo}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/electricity.png';
              }}
            />
          )}
        </div>
        <h1 className={styles.title}>Transaction Receipt</h1>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>Transaction Summary</div>

          <div className={styles.row}>
            <span className={styles.label}>Transaction Status:</span>
            <span className={`${styles.value} ${styles.status} ${styles[statusClass]}`}>
              {statusLabel}
            </span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Date & Time:</span>
            <span className={styles.value}>{formatReceiptDateTime(transaction.date)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Reference:</span>
            <span className={styles.value}>
              {transaction.reference || transaction.transactionRef || 'N/A'}
            </span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Receipt Number:</span>
            <span className={styles.value}>
              {transaction.receipt_number || transaction.receiptNumber || 'N/A'}
            </span>
          </div>

          {(transaction.depositType ||
            transaction.paymentMethodLabel ||
            transaction.payment_method ||
            transaction.paymentType === 'buypower-dva' ||
            transaction.paymentType === 'dva') && (
            <div className={styles.row}>
              <span className={styles.label}>Payment method:</span>
              <span className={styles.value}>
                {transaction.paymentMethodLabel ||
                  (transaction.payment_method === 'buypower-dva' ||
                  transaction.paymentType === 'buypower-dva'
                    ? 'Bank transfer (BuyPower)'
                    : transaction.payment_method === 'dva' || transaction.paymentType === 'dva'
                      ? 'Bank transfer (Paystack)'
                      : transaction.payment_method === 'wallet'
                        ? 'Wallet'
                        : transaction.payment_method === 'card'
                          ? 'Card'
                          : transaction.payment_method ||
                            (transaction.depositType === 'BANK_TRANSFER'
                              ? 'Bank Transfer'
                              : transaction.depositType) ||
                            'N/A')}
              </span>
            </div>
          )}

          <div className={styles.sectionDivider} />
          <div className={styles.sectionHeader}>
            {isElectricity
              ? 'Electricity Purchase Details'
              : isAirtime
                ? 'Airtime Purchase Details'
                : isData
                  ? 'Data Purchase Details'
                  : isCable
                    ? 'Cable TV Subscription'
                    : isDeposit
                      ? 'Deposit Details'
                      : 'Service Details'}
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Service Type:</span>
            <span className={styles.value}>
              {transaction.type
                ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)
                : 'N/A'}
              {isElectricity && ' - Prepaid'}
            </span>
          </div>

          {transaction.provider && (
            <div className={styles.row}>
              <span className={styles.label}>Provider:</span>
              <span className={styles.value}>{transaction.provider}</span>
            </div>
          )}

          {isElectricity && (
            <div className={styles.row}>
              <span className={styles.label}>Payer:</span>
              <span className={styles.value}>
                {transaction.payer || transaction.fullName || 'N/A'}
              </span>
            </div>
          )}

          {transaction.customerName && (
            <div className={styles.row}>
              <span className={styles.label}>Customer Name:</span>
              <span className={styles.value}>{transaction.customerName}</span>
            </div>
          )}

          {!isElectricity && (transaction.phoneNumber || transaction.phone_number) && (
            <div className={styles.row}>
              <span className={styles.label}>Customer Number:</span>
              <span className={styles.value}>
                {transaction.phoneNumber || transaction.phone_number}
              </span>
            </div>
          )}

          {isElectricity && (transaction.meterNumber || transaction.meter_number) && (
            <div className={styles.row}>
              <span className={styles.label}>Meter Number:</span>
              <span className={styles.value}>
                {transaction.meterNumber || transaction.meter_number}
              </span>
            </div>
          )}

          {isElectricity && transaction.address && (
            <div className={styles.row}>
              <span className={styles.label}>Address:</span>
              <div className={styles.value} style={{ textAlign: 'right' }}>
                {transaction.address.split(',').map((line, i) => (
                  <div key={i}>{line.trim()}</div>
                ))}
              </div>
            </div>
          )}

          {isElectricity && transaction.customerEmail && (
            <div className={styles.row}>
              <span className={styles.label}>Customer Email:</span>
              <span className={styles.value}>{transaction.customerEmail}</span>
            </div>
          )}

          {isElectricity && transaction.customerPhone && (
            <div className={styles.row}>
              <span className={styles.label}>Customer Phone:</span>
              <span className={styles.value}>{transaction.customerPhone}</span>
            </div>
          )}

          {isCable && (transaction.smartCardNumber || transaction.smartcard_number) && (
            <div className={styles.row}>
              <span className={styles.label}>Smart Card Number:</span>
              <span className={styles.value}>
                {transaction.smartCardNumber || transaction.smartcard_number}
              </span>
            </div>
          )}

          {!isAirtime &&
            !isElectricity &&
            (transaction.packageName ||
              transaction.bundleSize ||
              transaction.metadata?.dataBundle) && (
              <div className={styles.row}>
                <span className={styles.label}>
                  {isData ? 'Data Plan' : isCable ? 'Bouquet' : 'Package'}:
                </span>
                <span className={styles.value}>
                  {transaction.packageName ||
                    transaction.bundleSize ||
                    transaction.metadata?.dataBundle}
                </span>
              </div>
            )}

          {isElectricity && transaction.token && (
            <div className={styles.row}>
              <span className={styles.label}>Meter Token:</span>
              <div className={styles.tokenContainer}>
                <span className={styles.token}>{transaction.token}</span>
                <p className={styles.note}>
                  Please enter this token into your prepaid meter to load your units.
                </p>
              </div>
            </div>
          )}

          {isElectricity && transaction.units != null && transaction.units !== '' && (
            <div className={styles.row}>
              <span className={styles.label}>Units:</span>
              <span className={styles.value}>{transaction.units} kWh</span>
            </div>
          )}

          <div className={styles.sectionDivider} />
          <div className={styles.sectionHeader}>Amount Breakdown</div>

          {(isData || isAirtime) && (
            <>
              <div className={styles.row}>
                <span className={styles.label}>
                  {isData ? 'Data Bundle Cost' : 'Airtime Amount'}:
                </span>
                <span className={styles.value}>{formatCurrency(transaction.amount_paid || 0)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Service Charge:</span>
                <span className={styles.value}>{formatCurrency(serviceCharge)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Discount:</span>
                <span className={styles.value} style={{ color: '#10b981' }}>
                  {discount > 0 ? `-${formatCurrency(discount)}` : formatCurrency(0)}
                </span>
              </div>
            </>
          )}

          {isElectricity && (
            <>
              <div className={styles.row}>
                <span className={styles.label}>Amount Paid:</span>
                <span className={styles.value}>{formatCurrency(amountPaid)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Service Charge:</span>
                <span className={styles.value}>{formatCurrency(serviceCharge)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Amount Purchased:</span>
                <span className={styles.value}>
                  {formatCurrency(transaction.amountGenerated ?? 0)}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>VAT:</span>
                <span className={styles.value}>{formatCurrency(vatAmount)}</span>
              </div>
            </>
          )}

          {isCable && (
            <>
              <div className={styles.row}>
                <span className={styles.label}>Package Amount:</span>
                <span className={styles.value}>{formatCurrency(amountPaid)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Service Charge:</span>
                <span className={styles.value}>{formatCurrency(serviceCharge)}</span>
              </div>
            </>
          )}

          {isDeposit && (
            <div className={styles.row}>
              <span className={styles.label}>Amount Credited:</span>
              <span className={styles.value}>{formatCurrency(totalAmount)}</span>
            </div>
          )}

          <div className={`${styles.row} ${styles.total}`}>
            <span className={styles.label}>Total Amount:</span>
            <span className={styles.amount}>{formatCurrency(totalAmount)}</span>
          </div>

          {transaction.bankName && transaction.accountNumber && (
            <>
              <div className={styles.sectionDivider} />
              <div className={styles.sectionHeader}>Bank Transfer Details</div>
              <div className={styles.row}>
                <span className={styles.label}>Bank Name:</span>
                <span className={styles.value}>{transaction.bankName}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>Account Number:</span>
                <span className={styles.value}>{transaction.accountNumber}</span>
              </div>
              {transaction.accountName && (
                <div className={styles.row}>
                  <span className={styles.label}>Account Name:</span>
                  <span className={styles.value}>{transaction.accountName}</span>
                </div>
              )}
            </>
          )}

          {isScheduled && (
            <>
              <div className={styles.sectionDivider} />
              <div className={styles.sectionHeader}>Scheduled Purchase</div>
              <div className={styles.row}>
                <span className={styles.label}>Frequency:</span>
                <span className={styles.value}>{getFrequencyDisplay(frequency)}</span>
              </div>
              {nextPurchaseDate && (
                <div className={styles.row}>
                  <span className={styles.label}>Next Purchase:</span>
                  <span className={styles.value}>{formatReceiptDateTime(nextPurchaseDate)}</span>
                </div>
              )}
              <div className={styles.sectionDivider} />
              <div className={styles.noteBox}>
                <p>
                  Please ensure you have sufficient funds in your wallet before the scheduled date.
                </p>
                <p>Scheduled purchases cannot be canceled once confirmed.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.footerWrapper}>
        <div className={styles.footer}>
          <div className={styles.footerRectangles}>
            <div className={styles.firstRectangle} />
            <div className={styles.secondRectangle}>
              <div className={styles.footerSection}>
                <div className={styles.badgeContainer}>
                  <h4>Office Address</h4>
                </div>
                <p>
                  Ridds Plaza, Plot 740, Aguwan Anaekwe Street, Wuye, Suite 046/047, Abuja, Nigeria
                </p>
              </div>
              <div className={styles.footerSection}>
                <div className={styles.badgeContainer}>
                  <h4>Email/Website</h4>
                </div>
                <p className={styles.linkList}>
                  <a href="mailto:enquiry@belpower.com">enquiry@belpower.com</a>
                  <a href="https://www.belpower.ng" target="_blank" rel="noopener noreferrer">
                    www.belpower.ng
                  </a>
                </p>
              </div>
              <div className={styles.footerSection}>
                <div className={styles.badgeContainer}>
                  <h4>Contact Numbers</h4>
                </div>
                <p className={styles.linkList}>
                  <a href="tel:+2348068817499">08068817499</a>
                  <a href="tel:+2348037537986">08037537986</a>
                </p>
              </div>
            </div>
          </div>
          <div className={styles.copyright}>
            <p>© {new Date().getFullYear()} BelPower Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
