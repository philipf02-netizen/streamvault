"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Plus, Trash2, Edit, DollarSign, CreditCard, TrendingUp, Activity,
  Star, Check, Shield, BarChart3, Zap, Play, Tag, ChevronRight, Gift,
  Sparkles, TrendingDown, Ticket, Info, BookmarkPlus, BookmarkCheck, ArrowUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import {
  StreamingService, ServiceCategory, BillingCycle,
  SERVICE_PRESETS, CREDIT_CARDS, CreditCardReward,
  loadServices, saveServices,
  getDisplayName, getMonthlyEquivalent, getAnnualEquivalent,
  getPaymentCard, getMonthlyReward, getEffectiveMonthlyCost, getTotalMonthlyOffset,
  calcAnnualCashback, CATEGORY_LABELS, CATEGORY_COLORS,
} from "@/lib/streaming-data"

const MY_CARDS_KEY = "streamvault-mycards-v1"

function loadMyCards(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(MY_CARDS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function saveMyCards(ids: Set<string>) {
  if (typeof window === "undefined") return
  try { localStorage.setItem(MY_CARDS_KEY, JSON.stringify([...ids])) } catch {}
}

const blank = {
  presetName: "Netflix", customName: "", plan: "", cost: "",
  billingCycle: "monthly" as BillingCycle, billingDate: 1,
  category: "video" as ServiceCategory, isActive: true, sharedWith: 0,
  paymentCardId: "", paymentMethod: "", color: "#E50914",
  creditAmount: "", creditNote: "",
}

const CARDS_SORTED = [...CREDIT_CARDS].sort((a, b) => b.streamingRate - a.streamingRate)

function RatePill({ rate, tagColor }: { rate: number; tagColor: string }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ background: `${tagColor}22`, color: tagColor }}>{rate}%</span>
  )
}

// ──────────────────────────────────────────────────────────────────
// SERVICES SUMMARY BAR
// ──────────────────────────────────────────────────────────────────
function ServicesSummary({ gross, offsets, net }: { gross: number; offsets: number; net: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Gross */}
      <div className="bg-[#0c1120] border border-white/5 rounded-xl p-4 text-center">
        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Without Discounts</div>
        <div className="text-2xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
          ${gross.toFixed(2)}
        </div>
        <div className="text-slate-600 text-xs mt-1">${(gross * 12).toFixed(2)}/yr</div>
      </div>

      {/* Discounts */}
      <div className="bg-[#0c1120] border border-violet-500/20 rounded-xl p-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Total Discounts</div>
        <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: "Syne, sans-serif" }}>
          {offsets > 0 ? `−$${offsets.toFixed(2)}` : "$0.00"}
        </div>
        <div className="text-slate-600 text-xs mt-1">
          {offsets > 0 ? `$${(offsets * 12).toFixed(2)}/yr saved` : "no offsets set"}
        </div>
      </div>

      {/* Net */}
      <div className={cn(
        "bg-[#0c1120] border rounded-xl p-4 text-center relative overflow-hidden",
        net === 0 && gross > 0 ? "border-emerald-500/40" : "border-emerald-500/20"
      )}>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">You Actually Pay</div>
        <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "Syne, sans-serif" }}>
          ${net.toFixed(2)}
        </div>
        <div className="text-slate-600 text-xs mt-1">
          {net === 0 && gross > 0 ? "🎉 fully offset!" : `$${(net * 12).toFixed(2)}/yr`}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// ADD / EDIT MODAL
// ──────────────────────────────────────────────────────────────────
function ServiceModal({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void
  editing: StreamingService | null
  onSave: (data: Omit<StreamingService, "id"> & { id?: string }) => void
}) {
  const [f, setF] = useState(blank)

  useEffect(() => {
    if (open) {
      setF(editing ? {
        presetName: editing.presetName, customName: editing.customName,
        plan: editing.plan, cost: String(editing.cost),
        billingCycle: editing.billingCycle, billingDate: editing.billingDate,
        category: editing.category, isActive: editing.isActive,
        sharedWith: editing.sharedWith,
        paymentCardId: editing.paymentCardId ?? "",
        paymentMethod: editing.paymentMethod ?? "",
        color: editing.color,
        creditAmount: editing.creditAmount ? String(editing.creditAmount) : "",
        creditNote: editing.creditNote ?? "",
      } : blank)
    }
  }, [open, editing])

  const onPreset = (name: string) => {
    const p = SERVICE_PRESETS.find(x => x.name === name)
    setF(prev => ({ ...prev, presetName: name, color: p?.color ?? "#6B7280", category: p?.category ?? "other" }))
  }

  const onCardSelect = (cardId: string) => {
    if (cardId === "none") setF(p => ({ ...p, paymentCardId: "", paymentMethod: "" }))
    else if (cardId === "custom") setF(p => ({ ...p, paymentCardId: "custom", paymentMethod: "" }))
    else { const card = CREDIT_CARDS.find(c => c.id === cardId); setF(p => ({ ...p, paymentCardId: cardId, paymentMethod: card?.name ?? "" })) }
  }

  const selectedCard = CREDIT_CARDS.find(c => c.id === f.paymentCardId)
  const monthlyCost = parseFloat(f.cost) || 0
  const creditAmt = parseFloat(f.creditAmount) || 0
  const cardReward = selectedCard ? monthlyCost * selectedCard.streamingRate / 100 : 0
  const netCost = Math.max(0, monthlyCost - creditAmt - cardReward)
  const hasOffsets = creditAmt > 0 || cardReward > 0

  const submit = () => {
    const cost = parseFloat(f.cost)
    if (isNaN(cost) || cost < 0) return
    onSave({
      id: editing?.id, presetName: f.presetName, customName: f.customName, plan: f.plan,
      cost, billingCycle: f.billingCycle, billingDate: f.billingDate, category: f.category,
      isActive: f.isActive, sharedWith: f.sharedWith,
      paymentCardId: f.paymentCardId, paymentMethod: f.paymentMethod, color: f.color,
      creditAmount: parseFloat(f.creditAmount) || 0, creditNote: f.creditNote,
    })
    onClose()
  }

  const ic = "bg-[#0a1228] border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500/50"
  const cardSelectLabel = f.paymentCardId === "" ? "None — not tracking rewards"
    : f.paymentCardId === "custom" ? f.paymentMethod || "Other card (enter below)"
    : selectedCard ? `${selectedCard.name} (${selectedCard.streamingRate}%)` : "None"

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0c1120] border border-white/10 text-white max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
            {editing ? "Edit Service" : "Add Streaming Service"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Service</Label>
            <Select value={f.presetName} onValueChange={onPreset}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0c1120] border-white/10 text-white max-h-60">
                {SERVICE_PRESETS.map(p => (
                  <SelectItem key={p.name} value={p.name} className="focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {f.presetName === "Custom" && (
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Service Name</Label>
              <Input value={f.customName} onChange={e => setF(p => ({ ...p, customName: e.target.value }))} placeholder="e.g., Nebula, MUBI" className={ic} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-slate-400 text-xs uppercase tracking-wider">Plan / Tier</Label>
            <Input value={f.plan} onChange={e => setF(p => ({ ...p, plan: e.target.value }))} placeholder="e.g., Standard, Premium" className={ic} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Cost ($)</Label>
              <Input type="number" min="0" step="0.01" value={f.cost} onChange={e => setF(p => ({ ...p, cost: e.target.value }))} placeholder="0.00" className={ic} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Billing Cycle</Label>
              <Select value={f.billingCycle} onValueChange={v => setF(p => ({ ...p, billingCycle: v as BillingCycle }))}>
                <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0c1120] border-white/10 text-white">
                  <SelectItem value="monthly" className="focus:bg-white/10">Monthly</SelectItem>
                  <SelectItem value="annual" className="focus:bg-white/10">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Billing Day (1–28)</Label>
              <Input type="number" min="1" max="28" value={f.billingDate} onChange={e => setF(p => ({ ...p, billingDate: Math.min(28, Math.max(1, +e.target.value || 1)) }))} className={ic} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Shared With (# people)</Label>
              <Input type="number" min="0" max="20" value={f.sharedWith} onChange={e => setF(p => ({ ...p, sharedWith: Math.max(0, +e.target.value || 0) }))} className={ic} />
            </div>
          </div>

          <Separator className="bg-white/5" />

          {/* Credits & Rebates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-violet-400" />
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Credits & Rebates</Label>
              <div className="group relative">
                <Info className="w-3 h-3 text-slate-600 cursor-help" />
                <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block w-56 text-[11px] text-slate-300 bg-[#0a1228] border border-white/10 rounded-lg p-2.5 shadow-xl leading-relaxed">
                  Monthly-equivalent credits that offset cost — e.g. Amex Platinum $20/mo digital credit, employer benefits, family splits, promos.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Monthly Credit ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <Input type="number" min="0" step="0.01" value={f.creditAmount} onChange={e => setF(p => ({ ...p, creditAmount: e.target.value }))} placeholder="0.00" className={cn(ic, "pl-6")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Credit Label</Label>
                <Input value={f.creditNote} onChange={e => setF(p => ({ ...p, creditNote: e.target.value }))} placeholder="e.g., Amex Platinum" className={ic} />
              </div>
            </div>
            {creditAmt > 0 && monthlyCost > 0 && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                <div className="text-violet-300 text-xs font-semibold">{f.creditNote || "Credit"} — ${creditAmt.toFixed(2)}/mo offset</div>
                <div className="text-violet-400 font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>−${creditAmt.toFixed(2)}</div>
              </div>
            )}
          </div>

          <Separator className="bg-white/5" />

          {/* Card Rewards */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Credit Card Rewards</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Which card do you use for this service?</Label>
              <Select value={f.paymentCardId === "" ? "none" : f.paymentCardId} onValueChange={onCardSelect}>
                <SelectTrigger className={ic}><span className="truncate text-sm">{cardSelectLabel}</span></SelectTrigger>
                <SelectContent className="bg-[#0c1120] border-white/10 text-white max-h-72">
                  <SelectItem value="none" className="focus:bg-white/10 cursor-pointer">
                    <span className="text-slate-400">None — not tracking rewards</span>
                  </SelectItem>
                  <div className="px-2 pt-2 pb-1"><div className="text-[10px] text-slate-600 uppercase tracking-wider">Streaming Rewards Cards</div></div>
                  {CARDS_SORTED.filter(c => c.streamingRate > 1).map(card => (
                    <SelectItem key={card.id} value={card.id} className="focus:bg-white/10 cursor-pointer">
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{card.name}</span>
                          <span className="text-slate-500 text-xs shrink-0">{card.issuer}</span>
                        </div>
                        <RatePill rate={card.streamingRate} tagColor={card.tagColor} />
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 pt-2 pb-1"><div className="text-[10px] text-slate-600 uppercase tracking-wider">Other Cards (1%)</div></div>
                  {CARDS_SORTED.filter(c => c.streamingRate <= 1).map(card => (
                    <SelectItem key={card.id} value={card.id} className="focus:bg-white/10 cursor-pointer">
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{card.name}</span>
                          <span className="text-slate-500 text-xs shrink-0">{card.issuer}</span>
                        </div>
                        <RatePill rate={card.streamingRate} tagColor={card.tagColor} />
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 pt-2 pb-1"><div className="text-[10px] text-slate-600 uppercase tracking-wider">Other</div></div>
                  <SelectItem value="custom" className="focus:bg-white/10 cursor-pointer">
                    <span className="text-slate-300">Other card (enter manually)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {f.paymentCardId === "custom" && (
              <Input value={f.paymentMethod} onChange={e => setF(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="e.g., My Bank Rewards Visa" className={ic} />
            )}
            {selectedCard && monthlyCost > 0 && (
              <div className={cn("rounded-lg px-3 py-2.5 flex items-center justify-between", selectedCard.streamingRate >= 3 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5 border border-white/5")}>
                <div>
                  <div className={cn("text-xs font-semibold", selectedCard.streamingRate >= 3 ? "text-emerald-300" : "text-slate-400")}>{selectedCard.streamingRate}% back on this service</div>
                  {selectedCard.creditHighlight && <div className="text-[10px] text-amber-400 mt-0.5">+ {selectedCard.creditHighlight}</div>}
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-bold", selectedCard.streamingRate >= 3 ? "text-emerald-400" : "text-slate-400")} style={{ fontFamily: "Syne, sans-serif" }}>+${cardReward.toFixed(2)}/mo</div>
                  <div className="text-[10px] text-slate-600">${(cardReward * 12).toFixed(2)}/yr</div>
                </div>
              </div>
            )}
          </div>

          {/* Net breakdown */}
          {hasOffsets && monthlyCost > 0 && (
            <>
              <Separator className="bg-white/5" />
              <div className="bg-[#070f1e] rounded-xl p-4 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Monthly Cost Breakdown</div>
                <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Gross cost</span><span className="text-white">${monthlyCost.toFixed(2)}</span></div>
                {creditAmt > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5"><Ticket className="w-3 h-3 text-violet-400" /><span className="text-violet-300">{f.creditNote || "Credit"}</span></div>
                    <span className="text-violet-400 font-medium">−${creditAmt.toFixed(2)}</span>
                  </div>
                )}
                {cardReward > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-emerald-400" /><span className="text-emerald-300">Card rewards ({selectedCard?.streamingRate}%)</span></div>
                    <span className="text-emerald-400 font-medium">−${cardReward.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Net / month</span>
                  <span className="text-lg font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>${netCost.toFixed(2)}</span>
                </div>
                {netCost === 0 && <div className="text-center text-[11px] text-emerald-400 font-semibold pt-1">🎉 Fully offset — effectively free!</div>}
              </div>
            </>
          )}

          <Separator className="bg-white/5" />
          <div className="flex items-center justify-between py-1">
            <Label className="text-slate-300 text-sm">Active Subscription</Label>
            <Switch checked={f.isActive} onCheckedChange={v => setF(p => ({ ...p, isActive: v }))} className="data-[state=checked]:bg-blue-500" />
          </div>
          <div className="flex gap-2.5 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white">Cancel</Button>
            <Button onClick={submit} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">{editing ? "Save Changes" : "Add Service"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────────────────────────
// STAT CARD
// ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon, accent }: { label: string; value: string; sub?: string; Icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-[#0c1120] border border-white/5 rounded-xl p-5 flex items-start gap-4">
      <div className="rounded-lg p-2.5 shrink-0" style={{ background: `${accent}1a` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">{label}</div>
        <div className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: "Syne, sans-serif" }}>{value}</div>
        {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// SERVICE CARD
// ──────────────────────────────────────────────────────────────────
function ServiceCard({ svc, onEdit, onDelete, onToggle }: {
  svc: StreamingService; onEdit: () => void; onDelete: () => void; onToggle: () => void
}) {
  const mo = getMonthlyEquivalent(svc)
  const name = getDisplayName(svc)
  const card = getPaymentCard(svc)
  const reward = getMonthlyReward(svc)
  const credit = svc.creditAmount ?? 0
  const netCost = getEffectiveMonthlyCost(svc)
  const totalOffset = getTotalMonthlyOffset(svc)
  const hasCustomCard = svc.paymentCardId === "custom" && svc.paymentMethod
  const isFullyOffset = netCost === 0 && mo > 0

  return (
    <div className={cn("bg-[#0c1120] border border-white/5 rounded-xl overflow-hidden group transition-opacity flex flex-col", !svc.isActive && "opacity-40")}>
      <div className="h-0.5 w-full shrink-0" style={{ background: svc.color }} />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `${svc.color}22`, color: svc.color }}>{name.charAt(0)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="font-semibold text-white text-sm leading-tight truncate" style={{ fontFamily: "Syne, sans-serif" }}>{name}</div>
                {isFullyOffset && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0">FREE</span>}
              </div>
              {svc.plan && <div className="text-slate-500 text-xs mt-0.5 truncate">{svc.plan}</div>}
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={onEdit} className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><Edit className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {totalOffset > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>${netCost.toFixed(2)}</span>
                  <span className="text-slate-500 text-xs">/mo net</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5 line-through">${mo.toFixed(2)}/mo</div>
              </>
            ) : (
              <>
                <span className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>${mo.toFixed(2)}</span>
                <span className="text-slate-500 text-xs">/mo</span>
                <div className="text-xs text-slate-600 mt-0.5">${getAnnualEquivalent(svc).toFixed(2)}/yr</div>
              </>
            )}
          </div>
          <Switch checked={svc.isActive} onCheckedChange={onToggle} className="data-[state=checked]:bg-blue-500 scale-90" />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[svc.category]}1a`, color: CATEGORY_COLORS[svc.category] }}>{CATEGORY_LABELS[svc.category]}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">Day {svc.billingDate}</span>
          {svc.billingCycle === "annual" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Annual</span>}
          {svc.sharedWith > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">+{svc.sharedWith} sharing</span>}
        </div>

        {(credit > 0 || card || hasCustomCard) && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
            {credit > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0"><Ticket className="w-3 h-3 text-violet-400 shrink-0" /><span className="text-[11px] text-violet-300 truncate">{svc.creditNote || "Credit"}</span></div>
                <span className="text-[11px] font-semibold text-violet-400 shrink-0">−${credit.toFixed(2)}/mo</span>
              </div>
            )}
            {(card || hasCustomCard) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0"><CreditCard className="w-3 h-3 text-slate-500 shrink-0" /><span className="text-[11px] text-slate-400 truncate">{card ? card.name : svc.paymentMethod}</span>{card && <RatePill rate={card.streamingRate} tagColor={card.tagColor} />}</div>
                {reward > 0 && <span className={cn("text-[11px] font-semibold shrink-0", card && card.streamingRate >= 3 ? "text-emerald-400" : "text-slate-400")}>−${reward.toFixed(2)}/mo</span>}
              </div>
            )}
            {totalOffset > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[11px] text-slate-500">You pay</span>
                <span className={cn("text-[11px] font-bold", isFullyOffset ? "text-emerald-400" : "text-white")} style={{ fontFamily: "Syne, sans-serif" }}>
                  {isFullyOffset ? "🎉 $0.00/mo" : `$${netCost.toFixed(2)}/mo`}
                </span>
              </div>
            )}
          </div>
        )}

        {!credit && !card && !hasCustomCard && (
          <button onClick={onEdit} className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-400 transition-colors w-full text-left">
            <Sparkles className="w-3 h-3 shrink-0" /><span>Add credits or rewards</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// REWARDS BREAKDOWN (dashboard panel)
// ──────────────────────────────────────────────────────────────────
function RewardsBreakdown({ services }: { services: StreamingService[] }) {
  const withOffsets = services.filter(s => getPaymentCard(s) || (s.creditAmount ?? 0) > 0)
  const untracked = services.filter(s => !getPaymentCard(s) && !(s.creditAmount ?? 0) && s.paymentCardId !== "custom")
  const totalCredit = services.reduce((a, s) => a + (s.creditAmount ?? 0), 0)
  const totalReward = services.reduce((a, s) => a + getMonthlyReward(s), 0)
  const byCard: Record<string, { card: CreditCardReward; svcs: StreamingService[]; reward: number }> = {}
  for (const s of services) {
    const card = getPaymentCard(s)
    if (card) {
      if (!byCard[card.id]) byCard[card.id] = { card, svcs: [], reward: 0 }
      byCard[card.id].svcs.push(s)
      byCard[card.id].reward += getMonthlyReward(s)
    }
  }
  const withCredits = services.filter(s => (s.creditAmount ?? 0) > 0)
  if (services.length === 0) return null

  return (
    <div className="bg-[#0c1120] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Offset Tracker</h2>
        <div className="flex items-center gap-2">
          {totalCredit > 0 && (
            <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg px-2.5 py-1">
              <Ticket className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-400 font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>−${totalCredit.toFixed(2)}/mo</span>
            </div>
          )}
          {totalReward > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>+${totalReward.toFixed(2)}/mo</span>
            </div>
          )}
        </div>
      </div>

      {withOffsets.length === 0 ? (
        <p className="text-slate-600 text-sm">Edit any service to add credits, rebates, or card rewards.</p>
      ) : (
        <div className="space-y-5">
          {withCredits.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Credits & Rebates</span>
                <span className="text-violet-400 text-xs ml-auto font-bold">−${totalCredit.toFixed(2)}/mo</span>
              </div>
              <div className="space-y-1">
                {withCredits.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-slate-300 truncate">{getDisplayName(s)}</span>
                      {s.creditNote && <span className="text-[10px] text-violet-400 truncate">({s.creditNote})</span>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">${getMonthlyEquivalent(s).toFixed(2)}/mo</span>
                      <span className="text-xs text-violet-400 font-semibold">−${s.creditAmount!.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.values(byCard).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Card Rewards</span>
                <span className="text-emerald-400 text-xs ml-auto font-bold">+${totalReward.toFixed(2)}/mo</span>
              </div>
              <div className="space-y-3">
                {Object.values(byCard).map(({ card, svcs, reward }) => (
                  <div key={card.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <RatePill rate={card.streamingRate} tagColor={card.tagColor} />
                        <span className="text-sm text-white">{card.name}</span>
                        <span className="text-xs text-slate-500">{card.issuer}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400" style={{ fontFamily: "Syne, sans-serif" }}>+${reward.toFixed(2)}/mo</span>
                    </div>
                    <div className="space-y-1 ml-2">
                      {svcs.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-xs text-slate-300 truncate">{getDisplayName(s)}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-slate-500">${getMonthlyEquivalent(s).toFixed(2)}/mo</span>
                            <span className="text-xs text-emerald-500 font-medium">+${getMonthlyReward(s).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {untracked.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">No offsets tracked ({untracked.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {untracked.map(s => <span key={s.id} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500">{getDisplayName(s)}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// SINGLE REWARD CARD
// ──────────────────────────────────────────────────────────────────
function RewardCard({
  card, index, totalMonthly, isMine, isPrimary, onToggleMine
}: {
  card: CreditCardReward; index: number; totalMonthly: number
  isMine: boolean; isPrimary: boolean; onToggleMine: () => void
}) {
  const net = calcAnnualCashback(totalMonthly, card)
  const earned = totalMonthly * 12 * card.streamingRate / 100
  const isBest = isPrimary && index === 0 && !isMine

  return (
    <div className={cn(
      "bg-[#0c1120] border rounded-xl p-5 flex flex-col gap-4 relative",
      isMine ? "border-amber-500/30" : isBest ? "border-blue-500/40" : "border-white/5"
    )}>
      {/* My Card badge + toggle */}
      <button
        onClick={onToggleMine}
        title={isMine ? "Remove from my cards" : "Mark as my card"}
        className={cn(
          "absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border",
          isMine
            ? "bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
            : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
        )}
      >
        {isMine
          ? <><BookmarkCheck className="w-3.5 h-3.5" /> My Card</>
          : <><BookmarkPlus className="w-3.5 h-3.5" /> Add</>}
      </button>

      <div className="flex items-start justify-between gap-2 pr-20">
        <div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${card.tagColor}20`, color: card.tagColor }}>
            {isBest ? "★ " : ""}{card.tag}
          </span>
          <div className="font-bold text-white mt-2 text-base leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>{card.name}</div>
          <div className="text-slate-500 text-xs">{card.issuer}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-bold leading-none" style={{ fontFamily: "Syne, sans-serif", color: isPrimary || isMine ? card.tagColor : "#64748B" }}>{card.streamingRate}%</div>
          <div className="text-slate-600 text-[10px] mt-0.5">back on streaming</div>
        </div>
      </div>

      {card.creditHighlight && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-emerald-300 text-xs font-semibold">{card.creditHighlight}</span>
        </div>
      )}

      <div className="bg-[#070f1e] rounded-lg p-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">{isPrimary || isMine ? "Est. annual net reward" : "Est. annual streaming cashback"}</span>
          <span className={cn("text-sm font-bold", isPrimary || isMine ? (net >= 0 ? "text-emerald-400" : "text-red-400") : "text-slate-400")} style={{ fontFamily: "Syne, sans-serif" }}>
            {isPrimary || isMine ? (net >= 0 ? "+" : "") + `$${net.toFixed(2)}` : `$${earned.toFixed(2)}`}
          </span>
        </div>
        <div className="text-[10px] text-slate-600">
          {isPrimary || isMine ? `$${earned.toFixed(2)} earned — $${card.annualFee} annual fee` : `$${card.annualFee} annual fee — valued for non-streaming perks`}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        Annual fee: {card.annualFee === 0 ? <span className="text-emerald-400 font-medium ml-1">None</span> : <span className="text-white ml-1">${card.annualFee}/yr</span>}
      </div>

      <div className="space-y-1.5">
        {card.perks.map((p, pi) => (
          <div key={pi} className="flex gap-2 text-xs text-slate-400">
            <Check className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", isPrimary || isMine ? "text-blue-500" : "text-slate-600")} />{p}
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 pt-3">
        <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Best For</div>
        <div className="text-xs text-slate-300">{card.bestFor}</div>
      </div>

      {card.note && <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-[10px] text-amber-400">⚠ {card.note}</div>}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// CREDIT CARDS PANEL
// ──────────────────────────────────────────────────────────────────
function CardsPanel({ totalMonthly, myCardIds, onToggleCard }: {
  totalMonthly: number
  myCardIds: Set<string>
  onToggleCard: (id: string) => void
}) {
  const [showAllOther, setShowAllOther] = useState(false)

  const ranked = useMemo(() =>
    [...CREDIT_CARDS].sort((a, b) =>
      b.streamingRate !== a.streamingRate ? b.streamingRate - a.streamingRate
        : calcAnnualCashback(totalMonthly, b) - calcAnnualCashback(totalMonthly, a)
    ), [totalMonthly])

  const myCards = ranked.filter(c => myCardIds.has(c.id))
  const remaining = ranked.filter(c => !myCardIds.has(c.id))
  const streamingCards = remaining.filter(c => c.streamingRate > 1)
  const otherCards = remaining.filter(c => c.streamingRate <= 1)
  const visibleOther = showAllOther ? otherCards : otherCards.slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 font-semibold text-sm">Based on your ${totalMonthly.toFixed(2)}/month streaming spend</p>
          <p className="text-slate-400 text-xs mt-0.5">Click <span className="text-amber-400 font-medium">Add</span> on any card to pin it to "My Cards" at the top. Rotating-category rates apply only during qualifying quarters.</p>
        </div>
      </div>

      {/* My Cards */}
      {myCards.length > 0 && (
        <div>
          <h3 className="text-amber-400 text-sm font-semibold mb-3 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4" /> My Cards
            <span className="text-slate-600 text-xs font-normal">({myCards.length} saved)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCards.map((card, i) => (
              <RewardCard key={card.id} card={card} index={i} totalMonthly={totalMonthly}
                isMine={true} isPrimary={card.streamingRate > 1}
                onToggleMine={() => onToggleCard(card.id)} />
            ))}
          </div>
          {(streamingCards.length > 0 || otherCards.length > 0) && <Separator className="bg-white/5 mt-6" />}
        </div>
      )}

      {/* Best for Streaming */}
      {streamingCards.length > 0 && (
        <div>
          <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Best for Streaming Rewards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {streamingCards.map((card, i) => (
              <RewardCard key={card.id} card={card} index={i} totalMonthly={totalMonthly}
                isMine={false} isPrimary={true}
                onToggleMine={() => onToggleCard(card.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Other Cards */}
      {otherCards.length > 0 && (
        <div>
          <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-slate-400" /> Other Cards
            <span className="text-slate-600 text-xs font-normal">(1% on streaming — valued for other perks)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleOther.map((card, i) => (
              <RewardCard key={card.id} card={card} index={i} totalMonthly={totalMonthly}
                isMine={false} isPrimary={false}
                onToggleMine={() => onToggleCard(card.id)} />
            ))}
          </div>
          {otherCards.length > 2 && (
            <button onClick={() => setShowAllOther(v => !v)}
              className="mt-3 w-full py-2.5 rounded-lg border border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10 text-sm transition-colors">
              {showAllOther ? "Show less" : `Show ${otherCards.length - 2} more cards`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────
export function StreamingTracker() {
  const [services, setServices] = useState<StreamingService[]>([])
  const [myCardIds, setMyCardIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<"dashboard" | "services" | "cards">("dashboard")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<StreamingService | null>(null)
  const [catFilter, setCatFilter] = useState<ServiceCategory | "all">("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setServices(loadServices())
    setMyCardIds(loadMyCards())
    setMounted(true)
  }, [])

  useEffect(() => { if (mounted) saveServices(services) }, [services, mounted])
  useEffect(() => { if (mounted) saveMyCards(myCardIds) }, [myCardIds, mounted])

  const toggleMyCard = useCallback((id: string) => {
    setMyCardIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const save = useCallback((data: Omit<StreamingService, "id"> & { id?: string }) => {
    setServices(prev =>
      data.id
        ? prev.map(s => s.id === data.id ? ({ ...data, id: data.id! } as StreamingService) : s)
        : [...prev, { ...data, id: String(Date.now()) } as StreamingService]
    )
  }, [])

  const del = useCallback((id: string) => setServices(p => p.filter(s => s.id !== id)), [])
  const toggle = useCallback((id: string) => setServices(p => p.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)), [])

  const active = useMemo(() => services.filter(s => s.isActive), [services])
  const totalMo = useMemo(() => active.reduce((a, s) => a + getMonthlyEquivalent(s), 0), [active])
  const totalYr = useMemo(() => totalMo * 12, [totalMo])
  const totalRewardMo = useMemo(() => active.reduce((a, s) => a + getMonthlyReward(s), 0), [active])
  const totalCreditMo = useMemo(() => active.reduce((a, s) => a + (s.creditAmount ?? 0), 0), [active])
  const totalOffsetMo = useMemo(() => totalRewardMo + totalCreditMo, [totalRewardMo, totalCreditMo])
  const netMo = useMemo(() => Math.max(0, totalMo - totalOffsetMo), [totalMo, totalOffsetMo])

  const pieData = useMemo(() => {
    const m: Record<string, { value: number; color: string }> = {}
    for (const s of active) {
      if (!m[s.category]) m[s.category] = { value: 0, color: CATEGORY_COLORS[s.category] }
      m[s.category].value += getMonthlyEquivalent(s)
    }
    return Object.entries(m).map(([cat, d]) => ({ name: CATEGORY_LABELS[cat as ServiceCategory], value: parseFloat(d.value.toFixed(2)), color: d.color }))
  }, [active])

  const bestCard = useMemo(() =>
    [...CREDIT_CARDS].filter(c => c.streamingRate > 1).sort((a, b) => calcAnnualCashback(totalMo, b) - calcAnnualCashback(totalMo, a))[0],
    [totalMo])

  const filtered = useMemo(() => catFilter === "all" ? services : services.filter(s => s.category === catFilter), [services, catFilter])

  const upcoming = useMemo(() => {
    const today = new Date().getDate()
    return [...active].sort((a, b) => {
      const da = a.billingDate >= today ? a.billingDate - today : a.billingDate + 31 - today
      const db = b.billingDate >= today ? b.billingDate - today : b.billingDate + 31 - today
      return da - db
    }).slice(0, 6)
  }, [active])

  if (!mounted) return null

  const TABS = [
    { id: "dashboard" as const, label: "Dashboard", Icon: BarChart3 },
    { id: "services" as const, label: "My Services", Icon: Play },
    { id: "cards" as const, label: "Card Rewards", Icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-[#050913]">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050913]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: "Syne, sans-serif" }}>StreamVault</span>
          </div>
          <div className="flex items-center gap-2">
            {totalOffsetMo > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg px-2.5 py-1.5">
                <Ticket className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                  −{totalOffsetMo.toFixed(2)}<span className="text-violet-500/70 font-normal text-xs">/mo off</span>
                </span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                {totalMo.toFixed(2)}<span className="text-blue-500/70 font-normal text-xs">/mo</span>
              </span>
            </div>
            <Button onClick={() => { setEditing(null); setShowModal(true) }} size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white h-8 px-3 gap-1.5 text-sm">
              <Plus className="w-3.5 h-3.5" /> Add Service
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                tab === id ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Monthly Spend" value={`$${totalMo.toFixed(2)}`} sub="before offsets" Icon={DollarSign} accent="#3B82F6" />
              <StatCard label="Credits & Rebates" value={`−$${totalCreditMo.toFixed(2)}`} sub={`$${(totalCreditMo * 12).toFixed(0)}/yr`} Icon={Ticket} accent="#A78BFA" />
              <StatCard label="Card Rewards" value={`+$${totalRewardMo.toFixed(2)}`} sub={`$${(totalRewardMo * 12).toFixed(0)}/yr back`} Icon={Sparkles} accent="#10B981" />
              <StatCard label="Net Cost" value={`$${netMo.toFixed(2)}`} sub={`$${(netMo * 12).toFixed(0)}/yr after offsets`} Icon={TrendingDown} accent="#F59E0B" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-[#0c1120] border border-white/5 rounded-xl p-5">
                <h2 className="text-white font-bold mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Spend by Category</h2>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0c1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(v: number) => [`$${v.toFixed(2)}/mo`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                      {pieData.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          {d.name} <span className="text-slate-600">${d.value}/mo</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm">No active services yet</div>
                )}
              </div>

              <div className="bg-[#0c1120] border border-white/5 rounded-xl p-5">
                <h2 className="text-white font-bold mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Upcoming Bills</h2>
                {upcoming.length === 0 ? <div className="text-slate-600 text-sm">No active services</div> : (
                  <div>
                    {upcoming.map(s => {
                      const today = new Date().getDate()
                      const d = s.billingDate >= today ? s.billingDate - today : s.billingDate + 31 - today
                      const offset = getTotalMonthlyOffset(s)
                      const net = getEffectiveMonthlyCost(s)
                      return (
                        <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${s.color}22`, color: s.color }}>{getDisplayName(s).charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{getDisplayName(s)}</div>
                            {offset > 0 && <div className="text-[10px] text-slate-500">−${offset.toFixed(2)} offsets</div>}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>${offset > 0 ? net.toFixed(2) : getMonthlyEquivalent(s).toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">{d === 0 ? "Today" : `in ${d}d`}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <RewardsBreakdown services={active} />

            {bestCard && totalMo > 0 && (
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-4">
                <div className="bg-blue-500/20 rounded-lg p-2.5 shrink-0"><Star className="w-5 h-5 text-blue-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Best Card for Your Streaming</div>
                  <div className="text-white font-bold text-base" style={{ fontFamily: "Syne, sans-serif" }}>
                    {bestCard.name} <span className="text-slate-500 font-normal text-sm">by {bestCard.issuer}</span>
                  </div>
                  <div className="text-slate-300 text-sm mt-1">
                    Earns <span className="text-blue-400 font-bold">{bestCard.streamingRate}% back</span> — <span className="text-emerald-400 font-bold">${(totalMo * 12 * bestCard.streamingRate / 100).toFixed(2)}/year</span>
                    {bestCard.annualFee > 0 && <span className="text-slate-500"> minus ${bestCard.annualFee} annual fee</span>}
                  </div>
                </div>
                <button onClick={() => setTab("cards")} className="hidden sm:flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 shrink-0">
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MY SERVICES */}
        {tab === "services" && (
          <div className="space-y-5">
            {/* ── TOTALS SUMMARY BAR ── */}
            {active.length > 0 && (
              <ServicesSummary gross={totalMo} offsets={totalOffsetMo} net={netMo} />
            )}

            {/* Category filters */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "video", "music", "gaming", "other"] as const).map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
                      catFilter === cat ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-white/5 text-slate-400 hover:text-white border-transparent hover:border-white/10")}>
                    {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <span className="text-slate-600 text-xs">{filtered.length} service{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <div className="font-medium">No services yet</div>
                <div className="text-sm mt-1">Click &quot;Add Service&quot; to get started</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(s => (
                  <ServiceCard key={s.id} svc={s}
                    onEdit={() => { setEditing(s); setShowModal(true) }}
                    onDelete={() => del(s.id)}
                    onToggle={() => toggle(s.id)} />
                ))}
              </div>
            )}

            {services.length > 0 && (
              <div className="border-t border-white/5 pt-4 flex justify-between text-xs text-slate-500">
                <span>{active.length} active · {services.length - active.length} paused</span>
                <div className="flex items-center gap-2">
                  {totalOffsetMo > 0 && <span className="text-slate-500 line-through">${totalMo.toFixed(2)}</span>}
                  <span className="font-bold text-slate-300" style={{ fontFamily: "Syne, sans-serif" }}>
                    ${netMo.toFixed(2)}<span className="font-normal text-slate-500">/mo net</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARD REWARDS */}
        {tab === "cards" && (
          <CardsPanel totalMonthly={totalMo} myCardIds={myCardIds} onToggleCard={toggleMyCard} />
        )}
      </main>

      <ServiceModal open={showModal} onClose={() => { setShowModal(false); setEditing(null) }} editing={editing} onSave={save} />
    </div>
  )
}
