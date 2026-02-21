import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Plus, DollarSign, ChevronRight, Settings, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const avatarColors = ["#FF6B9D", "#4ECDC4", "#FFE66D", "#A8E6CF", "#DDA0DD", "#87CEEB", "#FFA07A", "#98D8C8"];

function MemberCard({ member, onUpdate }) {
  const spent = member.monthly_allocation - member.current_balance;
  const percentage = member.monthly_allocation > 0 ? (spent / member.monthly_allocation) * 100 : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-border bg-card p-5 family-card"
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
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
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
          <span className="text-2xl font-heading font-bold text-foreground">
            ${member.current_balance.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            of ${member.monthly_allocation}/mo
          </span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(0)}% used this month
        </p>
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="outline" className="flex-1 rounded-full text-xs h-8">
          <ArrowUpRight className="w-3 h-3 mr-1" /> Send
        </Button>
        <Button size="sm" variant="outline" className="rounded-full text-xs h-8 px-3">
          <Settings className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function FamilyVault() {
  const [vaultData, setVaultData] = useState({ vault: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relationship: "", monthly_allocation: 100 });

  const fetchVault = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/family-vault`, { withCredentials: true });
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
      await axios.post(`${API}/family-vault/member`, {
        ...newMember,
        avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)]
      }, { withCredentials: true });
      toast.success(`${newMember.name} added to your Family Vault!`);
      setAddDialogOpen(false);
      setNewMember({ name: "", relationship: "", monthly_allocation: 100 });
      fetchVault();
    } catch (err) {
      toast.error("Failed to add member");
    }
  };

  const updateMember = async (memberId, updates) => {
    try {
      await axios.put(`${API}/family-vault/member/${memberId}`, updates, { withCredentials: true });
      fetchVault();
    } catch (err) {
      toast.error("Failed to update member");
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-32 rounded-2xl bg-secondary/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse" />)}
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Family Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your family's finances together</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full" data-testid="add-member-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl" data-testid="add-member-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Family Member</DialogTitle>
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
                className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full"
              >
                Add to Vault
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vault Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
        data-testid="vault-summary"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0052FF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {vaultData.vault?.name || "Your Family Vault"}
            </h3>
            <p className="text-xs text-muted-foreground">{vaultData.members.length} members</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-secondary/30">
            <div className="text-xs text-muted-foreground mb-1">Total Balance</div>
            <div className="text-xl font-heading font-bold text-foreground">${totalBalance.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30">
            <div className="text-xs text-muted-foreground mb-1">Monthly Total</div>
            <div className="text-xl font-heading font-bold text-foreground">${totalAllocation}/mo</div>
          </div>
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
              <MemberCard member={member} onUpdate={updateMember} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No family members yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your family members to start managing their finances</p>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-[#0052FF] hover:bg-[#0040CC] text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Member
          </Button>
        </div>
      )}
    </div>
  );
}
