import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Flag,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supportApi, transactionsApi } from "@/services/walletAuthApi";
import SupportTicketForm from '../components/SupportTicketForm.jsx';
import { BASE_SEPOLIA_EXPLORER_URL } from '@/config/blockchain';
import { toast } from "sonner";

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
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_review: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

export default function Support() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [linkTransaction, setLinkTransaction] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.listCases(50, 0);
      setCases(data.cases || []);
    } catch (err) {
      toast.error("Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (caseData) => {
    setShowForm(false);
    await loadCases();
  };

  const handleOpenDetail = (caseData) => {
    setSelectedCase(caseData);
    setShowDetail(true);
  };

  const formatDate = (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'N/A';

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Support Center</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052FF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-foreground">Support Center</h1>
          <p className="text-sm text-muted-foreground">Get help with transfers, report issues, or file complaints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0052FF] hover:bg-[#0040CC] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
        <div className="flex items-center gap-2 text-amber-800 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Demo Support Channel</span>
        </div>
        <p className="text-sm text-amber-700">
          This demo support channel does not provide financial, legal, or account-recovery services. 
          No real funds are at risk — this is a testnet prototype.
        </p>
      </div>

      {/* Cases List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {cases.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No support cases yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create a new case if you need help with a transfer or want to report an issue
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#0052FF] hover:bg-[#0040CC] text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Send className="w-4 h-4" />
              Create Case
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map((caseData) => (
              <motion.button
                key={caseData.id}
                onClick={() => handleOpenDetail(caseData)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="w-full px-4 py-4 hover:bg-secondary/50 transition-colors text-left flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
                    {(() => {
                      const IconComponent = TYPE_ICONS[caseData.type];
                      return <IconComponent className="w-5 h-5 text-[#0052FF]" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground truncate max-w-[300px]">
                      {caseData.description.slice(0, 80)}{caseData.description.length > 80 ? '...' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(caseData.created_at)} • {TYPE_LABELS[caseData.type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    STATUS_COLORS[caseData.status] || STATUS_COLORS.open
                  }`}>
                    {caseData.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    caseData.priority === 'high' ? 'bg-red-100 text-red-800' :
                    caseData.priority === 'normal' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {PRIORITY_LABELS[caseData.priority] || caseData.priority}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

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
            className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-foreground">Create Support Case</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SupportTicketForm
              onClose={() => setShowForm(false)}
              onSubmit={handleSubmit}
            />
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
            className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading text-lg font-bold text-foreground">Case Details</h2>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
<div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
                    {(() => {
                      const IconComponent = TYPE_ICONS[selectedCase.type];
                      return <IconComponent className="w-5 h-5 text-[#0052FF]" />;
                    })()}
                  </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    STATUS_COLORS[selectedCase.status] || STATUS_COLORS.open
                  }`}>
                    {selectedCase.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedCase.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedCase.priority === 'normal' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {PRIORITY_LABELS[selectedCase.priority] || selectedCase.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-background p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedCase.description}</p>
                </div>

                <dl className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">Case ID</dt>
                    <dd className="font-mono text-foreground">{selectedCase.id}</dd>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="text-foreground">{TYPE_LABELS[selectedCase.type]}</dd>
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
                    <button
                      onClick={() => navigate(`/transaction-detail/${selectedCase.transaction_intent_id}`)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left w-full"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0052FF]" />
                      <span className="font-mono text-sm text-foreground">{selectedCase.transaction_intent_id}</span>
                      <span className="text-xs text-muted-foreground">View transaction details</span>
                    </button>
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