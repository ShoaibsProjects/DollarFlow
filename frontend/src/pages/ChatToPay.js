import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, DollarSign, MessageSquare, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const suggestions = [
  "Send $50 to Mom",
  "How much did I spend this week?",
  "Split $120 between Alex and Sarah",
  "Check my balance",
];

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <DollarSign className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({ action, onConfirm, onCancel }) {
  if (!action) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 mb-3 rounded-2xl border border-[#0052FF]/30 bg-[#0052FF]/5 p-4"
      data-testid="chat-action-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-[#0052FF]" />
        <span className="text-sm font-semibold text-foreground">
          {action.type === "send" ? "Send Payment" : action.type === "split" ? "Split Payment" : "Action"}
        </span>
      </div>

      {action.type === "send" && (
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="text-foreground font-medium">{action.recipient}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-foreground font-medium">${action.amount?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {action.type === "split" && (
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-foreground font-medium">${action.total?.toFixed(2)}</span>
          </div>
          {action.recipients?.map((r, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">{r}</span>
              <span className="text-foreground font-medium">${action.amounts?.[i]?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onConfirm} size="sm" className="flex-1 bg-[#00D395] hover:bg-[#00B880] text-white rounded-full" data-testid="confirm-action-btn">
          <Check className="w-4 h-4 mr-1" /> Confirm
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="flex-1 rounded-full" data-testid="cancel-action-btn">
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
      </div>
    </motion.div>
  );
}

export default function ChatToPay() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/chat/history`, { withCredentials: true });
        if (res.data.length > 0) {
          setMessages(res.data);
        } else {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hey! I'm Flow, your payment buddy. I can help you send money, check spending, or split bills. Just tell me what you need!",
            timestamp: new Date().toISOString()
          }]);
        }
      } catch {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hey! I'm Flow, your payment buddy. I can help you send money, check spending, or split bills. Just tell me what you need!",
          timestamp: new Date().toISOString()
        }]);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAction]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: `user_${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await axios.post(`${API}/chat`, { message: text }, { withCredentials: true });
      const assistantMsg = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (res.data.action) {
        setPendingAction(res.data.action);
      }
    } catch {
      const errorMsg = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "Oops, something went wrong. Could you try again?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "send") {
        await axios.post(`${API}/transactions`, {
          type: "send",
          amount: pendingAction.amount,
          recipient_name: pendingAction.recipient,
          category: "chat-payment"
        }, { withCredentials: true });
        toast.success(`Sent $${pendingAction.amount} to ${pendingAction.recipient}!`);
      } else if (pendingAction.type === "split") {
        for (let i = 0; i < pendingAction.recipients.length; i++) {
          await axios.post(`${API}/transactions`, {
            type: "send",
            amount: pendingAction.amounts[i],
            recipient_name: pendingAction.recipients[i],
            category: "split-payment"
          }, { withCredentials: true });
        }
        toast.success("Split payment sent!");
      }
      setMessages(prev => [...prev, {
        id: `confirm_${Date.now()}`,
        role: 'assistant',
        content: "Done! Payment sent successfully. Anything else I can help with?",
        timestamp: new Date().toISOString()
      }]);
    } catch {
      toast.error("Payment failed");
    }
    setPendingAction(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen max-w-2xl mx-auto" data-testid="chat-to-pay-page">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0052FF] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">Flow</h1>
            <p className="text-xs text-[#00D395]">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="chat-messages">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {pendingAction && (
          <ActionCard action={pendingAction} onConfirm={confirmAction} onCancel={() => setPendingAction(null)} />
        )}
        {sending && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              data-testid={`suggestion-${i}`}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:border-[#0052FF]/30 hover:bg-[#0052FF]/5 text-muted-foreground hover:text-foreground transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message... e.g. 'Send $50 to Mom'"
            data-testid="chat-input"
            className="flex-1 rounded-full px-5"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!input.trim() || sending}
            data-testid="chat-send-btn"
            className="rounded-full w-10 h-10 p-0 bg-[#0052FF] hover:bg-[#0040CC] text-white"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
