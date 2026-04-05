import { useEffect, useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface InvoiceModalProps {
  orderId: number;
  orderStatus: string;
  userRole: string;
  onClose: () => void;
}

const STATUS_CONFIG = {
  draft: { label: 'Draft',  bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText    },
  sent:  { label: 'Sent',   bg: 'bg-blue-50',   text: 'text-blue-700',  icon: Clock       },
  paid:  { label: 'Paid',   bg: 'bg-emerald-50',text: 'text-emerald-700',icon: CheckCircle2},
};

export function InvoiceModal({ orderId, orderStatus, userRole, onClose }: InvoiceModalProps) {
  const printRef  = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Try to fetch existing invoice
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', orderId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invoices/order/${orderId}`);
        return data;
      } catch {
        return null; // Not generated yet
      }
    },
    retry: false,
  });

  // Generate invoice mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/invoices/generate', { orderId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', orderId] });
      toast.success('Invoice generated successfully');
    },
    onError: () => toast.error('Failed to generate invoice'),
  });

  // Mark as sent (vendor action)
  const markSentMutation = useMutation({
    mutationFn: async () => {
      // Update status via generate endpoint (idempotent, just updates status)
      const { data } = await api.post('/invoices/generate', { orderId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', orderId] });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const sc = invoice ? (STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft) : STATUS_CONFIG.draft;
  const StatusIcon = sc.icon;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Print-only styles injected into head */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { margin: 20mm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div
          id="invoice-print-root"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header (no-print) */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">
                  {invoice ? invoice.invoiceNumber : 'Invoice'}
                </h2>
                {invoice && (
                  <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5', sc.bg, sc.text)}>
                    <StatusIcon className="h-3 w-3" /> {sc.label}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {invoice && (
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Download PDF
                </button>
              )}
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" ref={printRef}>

            {/* Loading */}
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">Loading invoice…</p>
                </div>
              </div>
            )}

            {/* Not generated yet */}
            {!isLoading && !invoice && orderStatus !== 'cancelled' && (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-700">No invoice generated yet</p>
                  <p className="text-[13px] text-slate-400 mt-1">Generate a professional invoice for this order.</p>
                </div>
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {generateMutation.isPending
                    ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                    : <><FileText className="h-4 w-4" /> Generate Invoice</>
                  }
                </button>
              </div>
            )}

            {/* Cancelled order */}
            {!isLoading && !invoice && orderStatus === 'cancelled' && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <AlertCircle className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">No invoice — order was cancelled</p>
              </div>
            )}

            {/* ── INVOICE DOCUMENT ─────────────────────────────────────────── */}
            {invoice && (
              <div className="p-8 space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    {/* Logo / Brand */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                        <span className="text-white text-sm font-black">VH</span>
                      </div>
                      <div>
                        <p className="text-[16px] font-black text-slate-900 leading-none">VendorHub</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Procurement Platform</p>
                      </div>
                    </div>
                    <h1 className="text-[32px] font-black text-slate-900 leading-none">INVOICE</h1>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-[13px] font-bold text-slate-900">{invoice.invoiceNumber}</p>
                    <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold', sc.bg, sc.text)}>
                      <StatusIcon className="h-3 w-3" /> {sc.label}
                    </div>
                    <p className="text-[12px] text-slate-400">
                      Issued: {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-[12px] text-slate-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })}
                      </p>
                    )}
                    <p className="text-[12px] text-slate-500 font-medium">PO Ref: {invoice.poNumber}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Bill To / From */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                    <p className="text-[15px] font-bold text-slate-900">{invoice.client.company || invoice.client.name}</p>
                    <p className="text-[13px] text-slate-600 mt-0.5">{invoice.client.name}</p>
                    <p className="text-[13px] text-slate-500">{invoice.client.email}</p>
                    {invoice.client.phone && <p className="text-[13px] text-slate-500">{invoice.client.phone}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">From</p>
                    <p className="text-[15px] font-bold text-slate-900">{invoice.vendor.company || invoice.vendor.name}</p>
                    <p className="text-[13px] text-slate-600 mt-0.5">{invoice.vendor.name}</p>
                    <p className="text-[13px] text-slate-500">{invoice.vendor.email}</p>
                    {invoice.vendor.phone && <p className="text-[13px] text-slate-500">{invoice.vendor.phone}</p>}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 rounded-xl overflow-hidden">
                        <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-l-xl">Description</th>
                        <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Qty</th>
                        <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Unit Price</th>
                        <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-r-xl">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="px-4 py-4">
                            <p className="text-[14px] font-semibold text-slate-800">{item.description}</p>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-slate-600">{item.quantity}</td>
                          <td className="px-4 py-4 text-right text-[13px] text-slate-600">${Number(item.unitPrice).toLocaleString()}</td>
                          <td className="px-4 py-4 text-right text-[14px] font-semibold text-slate-900">${Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between text-[13px] text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium">${Number(invoice.subtotal).toLocaleString()}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-[13px] text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">−${Number(invoice.discount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] text-slate-600">
                      <span>VAT ({invoice.taxRate}%)</span>
                      <span className="font-medium">${Number(invoice.taxAmount).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] font-bold text-slate-900">Total Due</span>
                      <span className="text-[22px] font-black text-blue-600">${Number(invoice.totalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-[13px] text-slate-600">{invoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400">
                    Generated by VendorHub · {invoice.invoiceNumber} · Thank you for your business
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
