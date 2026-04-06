// src/components/invoices/InvoiceModal.tsx  — REPLACE ENTIRE FILE
import { useEffect, useRef } from 'react';
import { X, Printer, Download, CheckCircle2, Clock, FileText, AlertCircle, Building2 } from 'lucide-react';
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
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600', icon: FileText, dot: 'bg-slate-400' },
  sent: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, dot: 'bg-blue-500' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-500' },
};

export function InvoiceModal({ orderId, orderStatus, userRole, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: invoiceQuery, isLoading } = useQuery({
    queryKey: ['invoice', orderId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invoices/order/${orderId}`);
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/invoices/generate', { orderId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['invoice', orderId], data);
      toast.success('Invoice generated successfully');
    },
    onError: () => toast.error('Failed to generate invoice'),
  });

  const markSentMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/invoices/generate', { orderId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['invoice', orderId], data);
    },
  });

  const invoice = invoiceQuery || generateMutation.data || markSentMutation.data;
  const sc = invoice
    ? (STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft)
    : null;

  const handlePrint = () => window.print();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-root,
          #invoice-print-root * { visibility: visible; }
          #invoice-print-root {
            position: fixed; inset: 0;
            background: white !important;
            overflow: visible !important;
            max-height: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            z-index: 9999;
          }
          .no-print { display: none !important; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      {/* Backdrop — owns the scroll so the modal never clips upward */}
      <div
        className="fixed inset-0 z-50 bg-white/40 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          id="invoice-print-root"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto flex flex-col"
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="no-print shrink-0 border-b border-slate-100">

            {/* Top bar: branding left, actions right */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/60">

              {/* Left: VendorHub brand + invoice identity */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-slate-800 tracking-tight">VendorHub</span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {invoice ? invoice.invoiceNumber : 'Invoice'}
                  </span>
                  {sc && (
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ml-1',
                      sc.bg, sc.text
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                      {sc.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: action buttons + close */}
              <div className="flex items-center gap-2">
                {invoice && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[12px] font-semibold transition-all"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold shadow-sm transition-all"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </>
                )}
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sub-bar: PO reference + due date — only when invoice exists */}
            {invoice && (
              <div className="flex items-center gap-6 px-6 py-2 border-t border-slate-100 bg-white">
                {[
                  { label: 'PO Reference', value: invoice.poNumber },
                  { label: 'Issued', value: new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  ...(invoice.dueDate ? [{ label: 'Due Date', value: new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }] : []),
                  { label: 'Amount', value: `$${Number(invoice.totalAmount || invoice.subtotal || 0).toLocaleString()}` },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{d.label}:</span>
                    <span className="text-[12px] font-bold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div ref={printRef}>

            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">Loading invoice…</p>
                </div>
              </div>
            )}

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

            {!isLoading && !invoice && orderStatus === 'cancelled' && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <AlertCircle className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">No invoice — order was cancelled</p>
              </div>
            )}

            {invoice && (
              <div className="p-8 space-y-8">

                {/* Invoice document header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                        <span className="text-white text-sm font-black">VH</span>
                      </div>
                      <div>
                        <p className="text-[16px] font-black text-slate-900 leading-none">VendorHub</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Procurement Platform</p>
                      </div>
                    </div>
                    <h1 className="text-[36px] font-black text-slate-900 leading-none tracking-tight">INVOICE</h1>
                  </div>
                  <div className="text-right space-y-1.5">
                    <p className="text-[15px] font-bold text-slate-900">{invoice.invoiceNumber}</p>
                    {sc && (
                      <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold', sc.bg, sc.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} /> {sc.label}
                      </div>
                    )}
                    <p className="text-[12px] text-slate-400">
                      Issued: {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-[12px] text-slate-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <p className="text-[12px] font-medium text-slate-500">PO Ref: {invoice.poNumber}</p>
                  </div>
                </div>

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

                {/* Line Items */}
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-l-xl">Description</th>
                        <th className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Qty</th>
                        <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Unit Price</th>
                        <th className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-r-xl">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems?.map((item: any, idx: number) => (
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
                      <span className="font-medium">${Number(invoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-[13px] text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">−${Number(invoice.discount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] text-slate-600">
                      <span>VAT ({invoice.taxRate || 0}%)</span>
                      <span className="font-medium">${Number(invoice.taxAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] font-bold text-slate-900">Total Due</span>
                      <span className="text-[22px] font-black text-blue-600">${Number(invoice.totalAmount || invoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-[13px] text-slate-600">{invoice.notes}</p>
                  </div>
                )}

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