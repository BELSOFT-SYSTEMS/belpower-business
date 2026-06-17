import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { ReceiptTransaction } from '@/components/receipt/ReceiptHTML';

export async function downloadTransactionReceiptPDF(
  transactionData: ReceiptTransaction,
  isScheduled = false,
  frequency = '',
  nextPurchaseDate = ''
): Promise<boolean> {
  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '0';
    container.style.background = '#fff';
    container.id = 'receipt-container-root';
    document.body.appendChild(container);

    const { default: ReceiptHTML } = await import('@/components/receipt/ReceiptHTML');
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');

    const root = createRoot(container);
    root.render(
      React.createElement(ReceiptHTML, {
        transaction: transactionData,
        isScheduled,
        frequency,
        nextPurchaseDate,
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    const oklchToRgb = (oklchStr: string): string => {
      if (!oklchStr || !oklchStr.includes('oklch')) return oklchStr;
      try {
        const match = oklchStr.match(
          /oklch\(\s*([0-9.%]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i
        );
        if (!match) {
          if (oklchStr.includes('1 0 0') || oklchStr.includes('100% 0 0')) return '#ffffff';
          if (oklchStr.includes('0 0 0')) return '#000000';
          return '#ffffff';
        }

        let l = parseFloat(match[1]);
        if (match[1].includes('%')) l /= 100;
        const c = parseFloat(match[2]);
        const h = parseFloat(match[3]);
        let alpha = match[4] ? parseFloat(match[4]) : 1;
        if (match[4] && match[4].includes('%')) alpha /= 100;

        if (c < 0.01) {
          const val = Math.round(l * 255);
          return alpha < 1
            ? `rgba(${val}, ${val}, ${val}, ${alpha})`
            : `rgb(${val}, ${val}, ${val})`;
        }

        const hRad = (h * Math.PI) / 180;
        const a = c * Math.cos(hRad);
        const b = c * Math.sin(hRad);
        const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = l - 0.0894841775 * a - 1.291485548 * b;
        const l3 = l_ * l_ * l_;
        const m3 = m_ * m_ * m_;
        const s3 = s_ * s_ * s_;
        const x = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
        const y = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
        const z = -0.0041960863 * l3 - 0.7034186145 * m3 + 1.707614701 * s3;
        const r = +3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
        const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
        const blue = +0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
        const f = (val: number) => {
          const clamped = Math.max(0, Math.min(1, val));
          return clamped <= 0.0031308
            ? 12.92 * clamped
            : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };
        const r255 = Math.round(f(r) * 255);
        const g255 = Math.round(f(g) * 255);
        const b255 = Math.round(f(blue) * 255);
        return alpha < 1
          ? `rgba(${r255}, ${g255}, ${b255}, ${alpha})`
          : `rgb(${r255}, ${g255}, ${b255})`;
      } catch {
        return '#ffffff';
      }
    };

    const convertColor = (color: string): string => {
      if (!color || !color.includes('oklch')) return color;
      return color.replace(/oklch\([^)]+\)/gi, (match) => oklchToRgb(match));
    };

    const allElements = Array.from(container.querySelectorAll<HTMLElement>('*'));
    allElements.push(container);
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const stylesToFix = [
        'color',
        'background-color',
        'border-color',
        'border-top-color',
        'border-right-color',
        'border-bottom-color',
        'border-left-color',
        'outline-color',
        'stop-color',
        'fill',
        'stroke',
      ];
      stylesToFix.forEach((prop) => {
        const value = style.getPropertyValue(prop);
        if (value && value.includes('oklch')) {
          el.style.setProperty(prop, convertColor(value), 'important');
        }
      });
    });

    const footerWrapper = container.querySelector('[class*="footerWrapper"]') as HTMLElement;
    const receiptContainer = container.querySelector('[class*="receiptContainer"]') as HTMLElement;

    if (!footerWrapper || !receiptContainer) {
      throw new Error('Could not find receipt components');
    }

    const originalBodyBg = document.body.style.backgroundColor;
    const originalBodyColor = document.body.style.color;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalHtmlColor = document.documentElement.style.color;

    let footerImgData = '';
    let contentImgData = '';

    try {
      const bodyComputed = window.getComputedStyle(document.body);
      const htmlComputed = window.getComputedStyle(document.documentElement);

      if (bodyComputed.backgroundColor.includes('oklch')) {
        document.body.style.setProperty(
          'background-color',
          convertColor(bodyComputed.backgroundColor),
          'important'
        );
      }
      if (bodyComputed.color.includes('oklch')) {
        document.body.style.setProperty('color', convertColor(bodyComputed.color), 'important');
      }
      if (htmlComputed.backgroundColor.includes('oklch')) {
        document.documentElement.style.setProperty(
          'background-color',
          convertColor(htmlComputed.backgroundColor),
          'important'
        );
      }
      if (htmlComputed.color.includes('oklch')) {
        document.documentElement.style.setProperty(
          'color',
          convertColor(htmlComputed.color),
          'important'
        );
      }

      const canvasOptions = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      } as const;
      const footerCanvas = await html2canvas(
        footerWrapper,
        canvasOptions as Parameters<typeof html2canvas>[1]
      );
      footerImgData = footerCanvas.toDataURL('image/png');

      footerWrapper.style.display = 'none';

      const contentCanvas = await html2canvas(receiptContainer, {
        ...canvasOptions,
        logging: false,
      } as Parameters<typeof html2canvas>[1]);
      contentImgData = contentCanvas.toDataURL('image/png');
    } finally {
      document.body.style.backgroundColor = originalBodyBg;
      document.body.style.color = originalBodyColor;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.documentElement.style.color = originalHtmlColor;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const footerProps = pdf.getImageProperties(footerImgData);
    const footerWidthMm = pageWidth;
    const footerHeightMm = (footerProps.height * footerWidthMm) / footerProps.width;
    const contentProps = pdf.getImageProperties(contentImgData);
    const contentWidthMm = pageWidth;
    const totalContentHeightMm = (contentProps.height * contentWidthMm) / contentProps.width;
    const paddingMm = 2.64;
    let gapMm = 5.3;
    let availablePageHeightMm = pageHeight - footerHeightMm - gapMm;
    let heightLeft = totalContentHeightMm;
    let position = 0;
    let pageNumber = 1;

    while (heightLeft > 1) {
      if (pageNumber > 1) {
        pdf.addPage();
        gapMm = paddingMm;
        availablePageHeightMm = pageHeight - footerHeightMm - gapMm;
        position -= paddingMm;
      }

      const contentThisPageHeightMm = Math.min(heightLeft, availablePageHeightMm);

      pdf.addImage(
        contentImgData,
        'PNG',
        0,
        -position + (pageNumber > 1 ? paddingMm : 0),
        contentWidthMm,
        totalContentHeightMm
      );

      pdf.setFillColor(255, 255, 255);
      pdf.rect(
        0,
        availablePageHeightMm + (pageNumber > 1 ? paddingMm : 0),
        pageWidth,
        pageHeight,
        'F'
      );

      if (pageNumber > 1) {
        pdf.rect(0, 0, pageWidth, paddingMm, 'F');
      }

      pdf.addImage(
        footerImgData,
        'PNG',
        0,
        pageHeight - footerHeightMm,
        footerWidthMm,
        footerHeightMm
      );

      heightLeft -= contentThisPageHeightMm;
      position += contentThisPageHeightMm;
      pageNumber++;
    }

    const ref = transactionData.reference || transactionData.id || Date.now();
    pdf.save(`BelPower_Receipt_${ref}.pdf`);

    const cleanup = () => {
      try {
        root.unmount?.();
        if (container?.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch {
        // ignore cleanup errors
      }
    };
    setTimeout(cleanup, 0);

    return true;
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return false;
  }
}
