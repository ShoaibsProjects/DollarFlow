import { AlertTriangle, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { supportApi } from '@/services/walletAuthApi';
import { transactionsApi } from '@/services/walletAuthApi';

const CATEGORIES = [
  { value: 'transfer_pending', label: 'Transfer Pending / Not Confirmed' },
  { value: 'wrong_recipient', label: 'Sent to Wrong Recipient' },
  { value: 'wallet_issue', label: 'Wallet Connection / Verification Issue' },
  { value: 'bug', label: 'Bug / Technical Issue' },
  { value: 'safety', label: 'Safety / Suspicious Activity' },
  { value: 'other', label: 'Other' },
];

const TYPES = [
  { value: 'support', label: 'Support Request' },
  { value: 'complaint', label: 'Formal Complaint' },
  { value: 'suspicious_activity_report', label: 'Suspicious Activity Report' },
];

export default function SupportTicketForm({ 
  onClose, 
  preselectedTransactionId,
  onSubmit: handleExternalSubmit 
}) {
  const [type, setType] = useState('support');
  const [category, setCategory] = useState('transfer_pending');
  const [transactionId, setTransactionId] = useState(preselectedTransactionId || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await supportApi.createCase({
        transaction_intent_id: transactionId || undefined,
        type,
        category,
        description: description.trim(),
      });
      
      setSuccess(true);
      handleExternalSubmit?.(result);
      
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit case');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Case Submitted</h3>
        <p className="text-sm text-green-700">
          Your {type === 'complaint' ? 'complaint' : 'support request'} has been received. 
          You can view it in the Support page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-800 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Demo Support Channel</span>
        </div>
        <p className="text-sm text-amber-700">
          This demo support channel does not provide financial, legal, or account-recovery services. 
          No real funds are at risk — this is a testnet prototype.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <label key={t.value} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={type === t.value}
                onChange={(e) => setType(e.target.value)}
                className="text-[#0052FF] focus:ring-[#0052FF]"
              />
              <span className="text-sm text-foreground">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Related Transaction (Optional)
        </label>
        <div className="relative">
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Transaction Intent ID (e.g., intent_abc123)"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Link a transaction to help us investigate faster
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe your issue in detail..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0052FF] resize-y"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">Maximum 5000 characters</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !description.trim()}
          className="flex-1 px-4 py-3 rounded-xl bg-[#0052FF] text-white font-medium hover:bg-[#0040CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>Submitting... <Loader2 className="w-4 h-4 animate-spin" /></>
          ) : (
            <>Submit <Send className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </form>
  );
}