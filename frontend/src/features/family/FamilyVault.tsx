import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, DollarSign, ChevronRight, Settings, Eye, EyeOff, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card } from '@/shared/ui/card';
import { formatCurrency } from '@/shared/lib/utils';
import { familyVaultApi } from '@/shared/services/api';
import { toast } from '@/shared/ui/sonner';

const avatarColors = ["#FF6B9D", "#4ECDC4", "#FFE66D", "#A8E6CF", "#DDA0DD", "#87CEEB", "#FFA07A", "#98D8C8"];

function MemberCard({ member, onUpdate, onSend }: { 
  member: any; 
  onUpdate: (id: string, updates: any) => void; 
  onSend: (member: any) => void;
}) {
  const spent = member.monthly_allocation - member.current_balance;
  const percentage = member.monthly_allocation > 0
    ? Math.min((member.current_balance / member.monthly_allocation) * 100, 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-border bg-surface p-5"
      data-testid={`member-card-${member.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: member.avatar_color }}>
            {member.name[0]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{member.name}</h3>
            <p className="text-xs text-muted-foreground">{member.relationship}</p>
          </div>
        </div>
        <button
          onClick={() => onUpdate(member.id, { visibility_enabled: !member.visibility_enabled })}
          className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          data-testid={`toggle-visibility-${member.id}`}
        >
          {member.visibility_enabled ?
            <Eye className="w-4 h-4 text-muted-foreground" /> :
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          }
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-2xl font-display font-bold text-foreground">
            {formatCurrency(member.current_balance)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {formatCurrency(member.monthly_allocation)}/mo
          </span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(0)}% funded this month
        </p>
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={() => onSend(member)} data-testid={`send-to-${member.id}`} className="flex-1 rounded-full text-xs h-8 bg-primary hover:bg-primary-hover text-white">
          <ArrowUpRight className="w-3 h-3 mr-1" /> Send
        </Button>
        <Button size="sm" variant="secondary" className="rounded-full text-xs h-8 px-3">
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

interface VaultData {
  vault: { name: string } | null;
  members: Array<{ id: string; name: string; relationship: string; monthly_allocation: number; current_balance: number; avatar_color: string; visibility_enabled: boolean }>;
}

export function FamilyVault() {
  const [vaultData, setVaultData] = useState<VaultData>({ vault: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relationship: '', monthly_allocation: 100 });

  const fetchVault = useCallback(async () => {
    try {
      const res = await familyVaultApi.get();
      setVaultData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

  const addMember = async () => {
    try {
      await familyVaultApi.addMember({
        ...newMember,
        avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)]
      });
      toast.success(`${newMember.name} added to your Family Vault!`);
      setAddDialogOpen(false);
      setNewMember({ name: '', relationship: '', monthly_allocation: 100 });
      fetchVault();
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const updateMember = async (memberId: string, updates: any) => {
    try {
      await familyVaultApi.updateMember(memberId, updates);
      fetchVault();
    } catch (err) {
      toast.error('Failed to update member');
    }
  };

  const openSendDialog = (member: any) => {
    setSelectedMember(member);
    setSendAmount('');
    setSendDialogOpen(true);
  };

  const handleSendToMember = async () => {
    if (!selectedMember || !sendAmount || parseFloat(sendAmount) <= 0) return;
    setSending(true);
    try {
      await familyVaultApi.sendToMember(selectedMember.id, parseFloat(sendAmount));
      toast.success(`Sent ${formatCurrency(parseFloat(sendAmount))} to ${selectedMember.name}!`);
      setSendDialogOpen(false);
      setSendAmount('');
      setSelectedMember(null);
      fetchVault();
    } catch (err) {
      toast.error('Failed to send funds');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-32 rounded-2xl bg-surface-elevated animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-surface-elevated animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totalAllocation = vaultData.members.reduce((sum, m) => sum + m.monthly_allocation, 0);
  const totalBalance = vaultData.members.reduce((sum, m) => sum + m.current_balance, 0);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6" data-testid="family-vault-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Family Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your family's finances together</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover text-white rounded-full" data-testid="add-member-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl" data-testid="add-member-dialog">
            <DialogHeader>
              <DialogTitle className="font-display">Add Family Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Maria"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="new-member-name"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input
                  placeholder="e.g., Mom, Brother, Sister"
                  value={newMember.relationship}
                  onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                  data-testid="new-member-relationship"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>Monthly Allocation ($)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newMember.monthly_allocation}
                  onChange={(e) => setNewMember(prev => ({ ...prev, monthly_allocation: parseFloat(e.target.value) || 0 }))}
                  data-testid="new-member-allocation"
                  className="mt-1 rounded-xl"
                />
              </div>
              <Button
                onClick={addMember}
                disabled={!newMember.name}
                data-testid="confirm-add-member"
                className="w-full bg-primary hover:bg-primary-hover text-white rounded-full"
              >
                Add to Vault
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Send to Member Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="send-to-member-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Send to {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: selectedMember.avatar_color }}>
                  {selectedMember.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedMember.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Balance: ${selectedMember.current_balance.toFixed(2)} / ${selectedMember.monthly_allocation}/mo
                  </p>
                </div>
              </div>
              <div>
                <Label>Amount ($)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    data-testid="send-member-amount"
                    className="pl-7 rounded-xl text-lg font-semibold"
                    autoFocus
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between px-1">
                <span>Fee: ${formatCurrency(0.03)}</span>
                <span>Arrives instantly</span>
              </div>
              <Button
                onClick={handleSendToMember}
                disabled={!sendAmount || parseFloat(sendAmount) <= 0 || sending}
                data-testid="confirm-send-to-member"
                className="w-full bg-primary hover:bg-primary-hover text-white rounded-full py-5"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                )}
                {sending ? "Sending..." : `Send ${formatCurrency(parseFloat(sendAmount) || 0)} to ${selectedMember.name}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vault Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-surface p-6"
        data-testid="vault-summary"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {vaultData.vault?.name || "Your Family Vault"}
            </h3>
            <p className="text-xs text-muted-foreground">{vaultData.members.length} members</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card variant="default" className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Total Balance</div>
            <div className="text-xl font-display font-bold text-foreground" data-testid="vault-total-balance">
              {formatCurrency(totalBalance)}
            </div>
          </Card>
          <Card variant="default" className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Monthly Total</div>
            <div className="text-xl font-display font-bold text-foreground">${formatCurrency(totalAllocation)}/mo</div>
          </Card>
        </div>
      </motion.div>

      {/* Members Grid */}
      {vaultData.members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vaultData.members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <MemberCard
                member={member}
                onUpdate={updateMember}
                onSend={openSendDialog}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">No family members yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your family members to start managing their finances</p>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-primary hover:bg-primary-hover text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Member
          </Button>
        </div>
      )}
    </div>
  );
}