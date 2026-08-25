import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Loader2, Send, MessageSquare, FileText, Flag, ExternalLink, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '@/shared/services/api';
import { SupportTicketForm } from '@/shared/components/SupportTicketForm';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/shared/config/blockchain';
import { toast } from '@/shared/ui/sonner';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

const TYPE_LABELS = {
  support: 'Support',
  complaint: 'Complaint',
  suspicious_activity_report: 'Suspicious Activity',
};

const TYPE_ICONS = {
  support: MessageSquare,
  complaint: FileText,
  suspicious_activity_report: Flag,
};

const STATUS_COLORS = {
  open: 'bg-primary/10 text-primary border-primary/20',
  in_review: 'bg-warning/10 text-warning border-warning/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted/10 text-muted-foreground border-muted/20',
};

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

function CaseTypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || MessageSquare;
  return <Icon className="w-5 h-5 text-primary" />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      {status.replace('_', ' ')}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variant = priority === 'high' ? 'danger' : priority === 'normal' ? 'warning' : 'muted';
  return (
    <Badge variant={variant} className="text-xs">
      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority}
    </Badge>
  );
}

const formatDate = (ts: number) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

export function Support() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const res = await supportApi.listCases(50, 0);
      setCases(res.data.cases || []);
    } catch (err) {
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (caseData: any) => {
    setShowForm(false);
    await loadCases();
  };

  const handleOpenDetail = (caseData: any) => {
    setSelectedCase(caseData);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Support Center</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground">Get help with transfers, report issues, or file complaints</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary-hover text-white rounded-full flex items-center gap-2">
          <Send className="w-4 h-4" />
          New Case
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 mb-6">
        <div className="flex items-center gap-2 text-warning mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Demo Support Channel</span>
        </div>
        <p className="text-sm text-muted-foreground">
          This demo support channel does not provide financial, legal, or account-recovery services. 
          No real funds are at risk — this is a testnet prototype.
        </p>
      </div>

      {/* Cases List */}
      <Card variant="default">
        <CardContent className="p-0">
          {cases.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No support cases yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a new case if you need help with a transfer or want to report an issue
              </p>
              <Button onClick={() => setShowForm(true)} className="mx-auto bg-primary hover:bg-primary-hover text-white rounded-full flex items-center gap-2">
                <Send className="w-4 h-4" />
                Create Case
              </Button>
            </div>
          ) : (
            <div className="divide-y border-border">
              {cases.map((caseData) => (
                <motion.button
                  key={caseData.id}
                  onClick={() => handleOpenDetail(caseData)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="w-full p-4 hover:bg-surface-elevated transition-colors text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CaseTypeIcon type={caseData.type} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[300px]">
                        {caseData.description.slice(0, 80)}{caseData.description.length > 80 ? '...' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(caseData.created_at)} • {TYPE_LABELS[caseData.type as keyof typeof TYPE_LABELS]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={caseData.status} />
                    <PriorityBadge priority={caseData.priority} />
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Case Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-lg font-bold text-foreground">Create Support Case</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SupportTicketForm onClose={() => setShowForm(false)} onSubmit={handleSubmit} />
          </motion.div>
        </motion.div>
      )}

      {/* Case Detail Modal */}
      {showDetail && selectedCase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display text-lg font-bold text-foreground">Case Details</h2>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg hover:bg-surface-elevated transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CaseTypeIcon type={selectedCase.type} />
                </div>
                <div>
                  <StatusBadge status={selectedCase.status} />
                  <PriorityBadge priority={selectedCase.priority} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-surface-elevated border border-border p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedCase.description}</p>
                </div>

                <dl className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">Case ID</dt>
                    <dd className="font-mono text-foreground">{selectedCase.id}</dd>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="text-foreground">{TYPE_LABELS[selectedCase.type as keyof typeof TYPE_LABELS]}</dd>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="text-foreground">{selectedCase.category.replace('_', ' ')}</dd>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="text-foreground">{formatDate(selectedCase.created_at)}</dd>
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="text-foreground">{formatDate(selectedCase.updated_at)}</dd>
                    {selectedCase.resolved_at && (
                      <>
                        <dt className="text-muted-foreground">Resolved</dt>
                        <dd className="text-foreground">{formatDate(selectedCase.resolved_at)}</dd>
                      </>
                    )}
                    {selectedCase.resolution_note && (
                      <>
                        <dt className="text-muted-foreground">Resolution</dt>
                        <dd className="text-foreground">{selectedCase.resolution_note}</dd>
                      </>
                    )}
                  </div>
                </dl>

                {selectedCase.transaction_intent_id && (
                  <div className="border-t border-border pt-4 space-y-2">
                    <h4 className="font-medium text-foreground">Linked Transaction</h4>
                    <Button
                      variant="secondary"
                      className="w-full justify-start gap-2"
                      onClick={() => navigate(`/transaction-detail/${selectedCase.transaction_intent_id}`)}
                    >
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm text-foreground">{selectedCase.transaction_intent_id}</span>
                      <span className="text-xs text-muted-foreground">View transaction details</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}