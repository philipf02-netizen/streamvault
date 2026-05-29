export type ServiceCategory = 'video' | 'music' | 'gaming' | 'other'
export type BillingCycle = 'monthly' | 'annual'

export interface StreamingService {
  id: string
  presetName: string
  customName: string
  plan: string
  cost: number
  billingCycle: BillingCycle
  billingDate: number
  category: ServiceCategory
  isActive: boolean
  sharedWith: number
  paymentCardId: string   // CREDIT_CARDS[].id, "custom", or ""
  paymentMethod: string   // card display name when paymentCardId === "custom"
  color: string
  creditAmount: number    // monthly credit/rebate that offsets cost
  creditNote: string      // label for the credit (e.g. "Amex Platinum digital credit")
}

export interface ServicePreset {
  name: string
  color: string
  category: ServiceCategory
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { name: "Netflix", color: "#E50914", category: "video" },
  { name: "Hulu", color: "#1CE783", category: "video" },
  { name: "Disney+", color: "#113CCF", category: "video" },
  { name: "Max", color: "#9B59B6", category: "video" },
  { name: "Apple TV+", color: "#888888", category: "video" },
  { name: "Peacock", color: "#D97706", category: "video" },
  { name: "Paramount+", color: "#1A6FFF", category: "video" },
  { name: "Prime Video", color: "#00A8E0", category: "video" },
  { name: "YouTube Premium", color: "#FF0000", category: "video" },
  { name: "ESPN+", color: "#E4003B", category: "video" },
  { name: "Crunchyroll", color: "#F47521", category: "video" },
  { name: "Spotify", color: "#1DB954", category: "music" },
  { name: "Apple Music", color: "#FA243C", category: "music" },
  { name: "Tidal", color: "#00E5FF", category: "music" },
  { name: "Amazon Music", color: "#25D1DA", category: "music" },
  { name: "YouTube Music", color: "#FF0000", category: "music" },
  { name: "Xbox Game Pass", color: "#107C10", category: "gaming" },
  { name: "PlayStation Plus", color: "#003087", category: "gaming" },
  { name: "Nintendo Switch Online", color: "#E60012", category: "gaming" },
  { name: "EA Play", color: "#FF4747", category: "gaming" },
  { name: "Custom", color: "#6B7280", category: "other" },
]

export interface CreditCardReward {
  id: string
  name: string
  issuer: string
  streamingRate: number
  annualFee: number
  perks: string[]
  bestFor: string
  tag: string
  tagColor: string
  note?: string
  creditHighlight?: string
}

export const CREDIT_CARDS: CreditCardReward[] = [
  {
    id: "amex-bcp",
    name: "Blue Cash Preferred®",
    issuer: "American Express",
    streamingRate: 6,
    annualFee: 95,
    perks: [
      "6% cash back on U.S. streaming services",
      "6% at U.S. supermarkets (up to $6,000/yr)",
      "3% on transit & U.S. gas stations",
      "$84/yr Disney Bundle or Equinox+ credit",
    ],
    bestFor: "Heavy streamers — best flat streaming cash back rate available",
    tag: "Best Rate",
    tagColor: "#F59E0B",
  },
  {
    id: "usbank-cash",
    name: "Cash+® Visa Signature",
    issuer: "U.S. Bank",
    streamingRate: 5,
    annualFee: 0,
    perks: [
      "5% on two categories you choose each quarter",
      "Select 'TV, Internet & Streaming' as a category",
      "2% on one everyday category",
      "No annual fee",
    ],
    bestFor: "No annual fee with top-tier streaming rewards",
    tag: "No Annual Fee",
    tagColor: "#10B981",
    note: "Must select streaming as a category each quarter",
  },
  {
    id: "citi-custom",
    name: "Custom Cash℠",
    issuer: "Citi",
    streamingRate: 5,
    annualFee: 0,
    perks: [
      "5% on your top eligible spend category (up to $500/mo)",
      "Streaming naturally becomes top category for many",
      "No annual fee",
      "1% unlimited on all other purchases",
    ],
    bestFor: "If streaming dominates your monthly spending",
    tag: "Smart Pick",
    tagColor: "#06B6D4",
    note: "5% only applies to your single highest spend category",
  },
  {
    id: "chase-flex",
    name: "Freedom Flex℠",
    issuer: "Chase",
    streamingRate: 5,
    annualFee: 0,
    perks: [
      "5% on rotating quarterly bonus categories",
      "Streaming services have been a quarterly bonus category",
      "3% on dining & drugstores year-round",
      "Pairs with Sapphire for valuable point transfers",
    ],
    bestFor: "Rotating category fans — great during streaming quarters",
    tag: "Rotating 5%",
    tagColor: "#EC4899",
    note: "5% on streaming only during qualifying bonus quarters",
  },
  {
    id: "chase-preferred",
    name: "Sapphire Preferred®",
    issuer: "Chase",
    streamingRate: 3,
    annualFee: 95,
    perks: [
      "3x Ultimate Rewards points on streaming services",
      "3x on dining, online grocery & select travel",
      "$50 annual hotel credit via Chase Travel",
      "Points worth 1.25¢ via Chase Travel portal",
      "No foreign transaction fees",
    ],
    bestFor: "Best mid-tier travel card — great streaming rewards with a reasonable fee",
    tag: "Best Value",
    tagColor: "#22D3EE",
  },
  {
    id: "cap-one-savor",
    name: "SavorOne Rewards",
    issuer: "Capital One",
    streamingRate: 3,
    annualFee: 0,
    perks: [
      "3% on entertainment, streaming & dining",
      "3% on groceries",
      "No annual fee, no foreign transaction fees",
      "Easy consistent rewards with no categories to track",
    ],
    bestFor: "Balanced everyday rewards with solid streaming coverage",
    tag: "Balanced",
    tagColor: "#3B82F6",
  },
  {
    id: "chase-reserve",
    name: "Sapphire Reserve®",
    issuer: "Chase",
    streamingRate: 3,
    annualFee: 550,
    perks: [
      "3x Ultimate Rewards points on streaming services",
      "$300 annual travel credit (effectively offsets fee)",
      "Priority Pass Select airport lounge access",
      "Points worth 1.5¢ via Chase Travel portal",
    ],
    bestFor: "Frequent travelers who stream — premium perks offset the fee",
    tag: "Premium Travel",
    tagColor: "#8B5CF6",
    note: "Points worth more when redeemed through Chase Travel",
  },
  {
    id: "amex-platinum",
    name: "Platinum Card®",
    issuer: "American Express",
    streamingRate: 1,
    annualFee: 695,
    perks: [
      "Up to $20/mo ($240/yr) digital entertainment credit",
      "Covers Disney+, ESPN+, Hulu, Peacock, Paramount+, NYT & more",
      "5x points on flights booked directly or via Amex Travel",
      "Centurion & Priority Pass lounge access worldwide",
      "$200 hotel credit, $200 airline fee credit, $199 CLEAR+ credit",
    ],
    bestFor: "Frequent fliers — the $240 streaming credit alone offsets much of the fee",
    tag: "Elite Perks",
    tagColor: "#94A3B8",
    creditHighlight: "$240/yr streaming credit",
    note: "Streaming credit requires enrollment; 1x points on streaming spend itself",
  },
  {
    id: "amex-gold",
    name: "Gold Card®",
    issuer: "American Express",
    streamingRate: 1,
    annualFee: 250,
    perks: [
      "4x Membership Rewards at restaurants worldwide",
      "4x at U.S. supermarkets (up to $25,000/yr)",
      "$120/yr dining credit ($10/mo at select restaurants)",
      "$120/yr Uber Cash ($10/mo)",
      "1x on streaming (not a primary strength)",
    ],
    bestFor: "Dining & grocery enthusiasts — streaming is not the focus",
    tag: "Dining Focus",
    tagColor: "#D97706",
    note: "Only 1x on streaming — choose this for dining rewards, not streaming",
  },
  {
    id: "chase-southwest",
    name: "SW Rapid Rewards® Priority",
    issuer: "Chase",
    streamingRate: 1,
    annualFee: 149,
    perks: [
      "3x points on Southwest purchases",
      "2x on hotel & rental car partners",
      "$75/yr Southwest travel credit",
      "4 upgraded boardings per year",
      "7,500 anniversary bonus points",
    ],
    bestFor: "Frequent Southwest fliers — not optimized for streaming",
    tag: "Travel Focused",
    tagColor: "#E87722",
    note: "Only 1x on streaming — pick this for Southwest loyalty, not streaming rewards",
  },
  {
    id: "citi-costco",
    name: "Costco Anywhere Visa®",
    issuer: "Citi",
    streamingRate: 1,
    annualFee: 0,
    perks: [
      "4% cash back on eligible gas & EV charging (up to $7,000/yr)",
      "3% on restaurants & eligible travel",
      "2% on all Costco & Costco.com purchases",
      "No annual fee (requires Costco membership)",
      "1% on all other purchases including streaming",
    ],
    bestFor: "Costco members — excellent for gas & dining, not for streaming",
    tag: "Gas & Costco",
    tagColor: "#1D4ED8",
    note: "Only 1% on streaming. Requires active Costco membership (~$65/yr)",
  },
  {
    id: "citi-aa-executive",
    name: "AAdvantage® Executive World Elite™",
    issuer: "Citi / American Airlines",
    streamingRate: 1,
    annualFee: 595,
    perks: [
      "4x AAdvantage miles on American Airlines purchases",
      "Admirals Club® airport lounge membership (value ~$850/yr)",
      "First checked bag free for you + 8 companions",
      "10,000 Elite Qualifying Miles bonus per year",
      "1x miles on all other purchases including streaming",
    ],
    bestFor: "American Airlines loyalists — the Admirals Club access justifies the fee",
    tag: "AA Loyalist",
    tagColor: "#DC2626",
    note: "Only 1x on streaming. Choose for AA status & lounge access, not streaming rewards",
  },
]

// ── cost helpers ──────────────────────────────────────────────────
export function getMonthlyEquivalent(service: StreamingService): number {
  return service.billingCycle === 'annual' ? service.cost / 12 : service.cost
}

export function getAnnualEquivalent(service: StreamingService): number {
  return service.billingCycle === 'annual' ? service.cost : service.cost * 12
}

export function getMonthlyReward(service: StreamingService): number {
  const card = getPaymentCard(service)
  if (!card) return 0
  return getMonthlyEquivalent(service) * card.streamingRate / 100
}

/** True out-of-pocket after card rewards AND manual credits */
export function getEffectiveMonthlyCost(service: StreamingService): number {
  const gross = getMonthlyEquivalent(service)
  const reward = getMonthlyReward(service)
  const credit = service.creditAmount ?? 0
  return Math.max(0, gross - reward - credit)
}

export function getTotalMonthlyOffset(service: StreamingService): number {
  return getMonthlyReward(service) + (service.creditAmount ?? 0)
}

export function getDisplayName(service: StreamingService): string {
  return service.presetName === 'Custom'
    ? (service.customName || 'Custom Service')
    : service.presetName
}

export function getPaymentCard(service: StreamingService): CreditCardReward | undefined {
  if (!service.paymentCardId || service.paymentCardId === 'custom') return undefined
  return CREDIT_CARDS.find(c => c.id === service.paymentCardId)
}

export function calcAnnualCashback(monthlySpend: number, card: CreditCardReward): number {
  return (monthlySpend * 12 * card.streamingRate) / 100 - card.annualFee
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  video: 'Video', music: 'Music', gaming: 'Gaming', other: 'Other',
}

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  video: '#3B82F6', music: '#1DB954', gaming: '#8B5CF6', other: '#94A3B8',
}

// ── storage ───────────────────────────────────────────────────────
const STORAGE_KEY = 'streamvault-v3'

export function loadServices(): StreamingService[] {
  if (typeof window === 'undefined') return getDefaultServices()
  try {
    // try v3, then migrate from v2/v1
    const raw = localStorage.getItem(STORAGE_KEY)
      ?? localStorage.getItem('streamvault-v2')
      ?? localStorage.getItem('streamvault-v1')
    if (!raw) return getDefaultServices()
    const parsed = JSON.parse(raw) as Partial<StreamingService>[]
    return parsed.map(s => ({
      id: s.id ?? String(Date.now() + Math.random()),
      presetName: s.presetName ?? 'Custom',
      customName: s.customName ?? '',
      plan: s.plan ?? '',
      cost: s.cost ?? 0,
      billingCycle: s.billingCycle ?? 'monthly',
      billingDate: s.billingDate ?? 1,
      category: s.category ?? 'other',
      isActive: s.isActive ?? true,
      sharedWith: s.sharedWith ?? 0,
      paymentCardId: s.paymentCardId ?? '',
      paymentMethod: s.paymentMethod ?? '',
      color: s.color ?? '#6B7280',
      creditAmount: s.creditAmount ?? 0,
      creditNote: s.creditNote ?? '',
    }))
  } catch {
    return getDefaultServices()
  }
}

export function saveServices(services: StreamingService[]): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(services)) } catch {}
}

function getDefaultServices(): StreamingService[] {
  return [
    { id: '1', presetName: 'Netflix', customName: '', plan: 'Standard with Ads', cost: 7.00, billingCycle: 'monthly', billingDate: 1, category: 'video', isActive: true, sharedWith: 0, paymentCardId: '', paymentMethod: '', color: '#E50914', creditAmount: 0, creditNote: '' },
    { id: '2', presetName: 'Spotify', customName: '', plan: 'Premium Individual', cost: 11.99, billingCycle: 'monthly', billingDate: 15, category: 'music', isActive: true, sharedWith: 0, paymentCardId: '', paymentMethod: '', color: '#1DB954', creditAmount: 0, creditNote: '' },
    { id: '3', presetName: 'Disney+', customName: '', plan: 'Basic with Ads', cost: 7.99, billingCycle: 'monthly', billingDate: 20, category: 'video', isActive: true, sharedWith: 1, paymentCardId: '', paymentMethod: '', color: '#113CCF', creditAmount: 0, creditNote: '' },
  ]
}
