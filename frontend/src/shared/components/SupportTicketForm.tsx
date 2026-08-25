import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, FileText, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Card, CardContent } from '@/shared/ui/card';
import { toast } from '@/shared/ui/sonner';

const TYPE_OPTIONS = [
  { value: 'support', label: 'Support Request', icon: Send },
  { value: 'complaint', label: 'Complaint', icon: FileText },
  { value: 'suspicious_activity_report', label: 'Suspicious Activity Report', icon: Flag },
];

const CATEGORY_OPTIONS = [
  { value: 'transfer_issue', label: 'Transfer Issue' },
  { value: 'wallet_verification', label: 'Wallet Verification' },
  { value: 'account_access', label: 'Account Access' },
  { value: 'fee_question', label: 'Fee Question' },
  { value: 'compliance', label: 'Compliance/Regulatory' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

interface SupportTicketFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function SupportTicketForm({ onClose, onSubmit }: SupportTicketFormProps) {
  const [type, setType] = useState('support');
  const [category, setCategory] = useState('transfer_issue');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [transactionIntentId, setTransactionIntentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your issue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        type,
        category,
        priority,
        description,
        transaction_intent_id: transactionIntentId || undefined,
      });
      toast.success('Support case created successfully');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create case';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground">Create Support Case</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`p-3 rounded-xl text-center text-sm font-medium transition-all ${
                  type === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
                }`}
              >
                <opt.icon className="w-4 h-4 mx-auto mb-1" />
                <span className="block">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Select category"
          options={CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))}
        />

        {/* Priority */}
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          placeholder="Select priority"
          options={PRIORITY_OPTIONS.map(p => ({ value: p.value, label: p.label }))}
        />

        {/* Transaction ID (optional) */}
        <Input
          placeholder="Transaction Intent ID (optional)"
          value={transactionIntentId}
          onChange={(e) => setTransactionIntentId(e.target.value)}
          className="font-mono text-sm"
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe your issue in detail..."
            className="w-full px-4 py-3 text-sm bg-surface border border-border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 rounded-full"
            disabled={submitting}
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !description.trim()}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-full"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
            {submitting ? 'Submitting...' : 'Submit Case'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}