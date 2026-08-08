import jsPDF from 'jspdf';
import { PaymentItem } from '../app/App';

export function generateInvoicePDF(p: PaymentItem): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  
  // Header Banner
  doc.setFillColor(255, 107, 0); // Orange #FF6B00
  doc.rect(0, 0, 595, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Champions Gym Manager', 40, 48);
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('PAYMENT INVOICE RECEIPT', 360, 48);

  // Metadata Card
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${p.invoice}`, 40, 115);
  doc.text(`Date Issued: ${p.date}`, 380, 115);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Member Name: ${p.member}`, 40, 135);
  doc.text(`Payment Mode: ${p.mode}`, 380, 135);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 155, 555, 155);

  // Table Headers
  doc.setFillColor(248, 250, 252);
  doc.rect(40, 170, 515, 28, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.text('DESCRIPTION', 50, 188);
  doc.text('AMOUNT (INR)', 450, 188);

  // Table Item Row
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('Gym Membership Subscription', 50, 220);
  doc.text(`Rs. ${p.amount.toLocaleString()}`, 450, 220);

  doc.line(40, 240, 555, 240);

  // Breakdown Totals Section
  let startY = 265;
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 340, startY);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${p.amount.toLocaleString()}`, 450, startY);

  startY += 20;
  doc.setTextColor(100, 116, 139);
  doc.text('GST (18%):', 340, startY);
  doc.setTextColor(15, 23, 42);
  doc.text(`+ Rs. ${p.tax.toLocaleString()}`, 450, startY);

  if (p.discount > 0) {
    startY += 20;
    doc.setTextColor(34, 197, 94);
    doc.text('Discount:', 340, startY);
    doc.text(`- Rs. ${p.discount.toLocaleString()}`, 450, startY);
  }

  startY += 25;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 107, 0);
  doc.setFontSize(13);
  doc.text('Total Paid:', 340, startY);
  doc.text(`Rs. ${p.paid.toLocaleString()}`, 450, startY);

  startY += 20;
  doc.setFontSize(11);
  doc.setTextColor(239, 68, 68);
  doc.text('Balance Due:', 340, startY);
  doc.text(`Rs. ${p.balance.toLocaleString()}`, 450, startY);

  // Decorative Border
  doc.setDrawColor(255, 107, 0);
  doc.setLineWidth(2);
  doc.rect(20, 20, 555, 780);

  // Footer Note
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for training with Champions Gym! For queries, contact gym administration.', 110, 760);

  return doc;
}

export async function shareInvoicePDFOnWhatsApp(p: PaymentItem, memberPhone?: string) {
  const doc = generateInvoicePDF(p);
  const pdfBlob = doc.output('blob');
  const pdfFileName = `Champions_Gym_Invoice_${p.invoice}.pdf`;
  const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

  let cleanPhone = memberPhone ? memberPhone.replace(/[^0-9]/g, '') : '';
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  const messageText = `🧾 *Champions Gym Payment Invoice (${p.invoice})*\nMember: ${p.member}\nTotal Paid: ₹${p.paid.toLocaleString()}\nBalance: ₹${p.balance.toLocaleString()}\n\n📄 *Official PDF Invoice attached below!*`;

  // 1. Mobile Web Share API (Android Chrome, iOS Safari, etc.)
  // @ts-ignore
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Invoice ${p.invoice}`,
        text: messageText,
      });
      return;
    } catch (err) {
      console.log('Native PDF Web Share cancelled or skipped:', err);
    }
  }

  // 2. Desktop Fallback: Download PDF file & launch WhatsApp with prefilled message
  doc.save(pdfFileName);

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText + '\n\n(Invoice PDF downloaded to your device — attach it here in WhatsApp!)')}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText + '\n\n(Invoice PDF downloaded to your device — attach it here in WhatsApp!)')}`;

  window.open(whatsappUrl, '_blank');
}
