# StreamVault 🎬

A sleek dark-themed streaming subscription tracker that helps you monitor what you pay across all your streaming services and maximize credit card rewards.

## Features

- **My Services** — Track all streaming subscriptions with cost, billing cycle, and billing date
- **Credit Card Rewards** — Compare 12 credit cards to see which earns the best streaming rewards
- **Manual Offsets** — Add rebates/credits (like Amex Platinum's $240 digital entertainment credit) per service
- **Totals Summary** — At-a-glance bar showing gross cost, total discounts, and net out-of-pocket
- **My Cards** — Bookmark your own cards to pin them to the top of the card list
- **Spending Breakdown** — Pie chart visualization of spending by category
- **Offset Tracker** — Dashboard showing where your credits and card rewards come from

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Recharts** — pie chart visualization
- **localStorage** — persists your data across sessions

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Credit Cards Tracked

| Card | Streaming Rate | Annual Fee |
|------|---------------|-----------|
| Amex Blue Cash Preferred® | 6% | $95 |
| U.S. Bank Cash+® | 5% | $0 |
| Citi Custom Cash℠ | 5% | $0 |
| Chase Freedom Flex℠ | 5%* | $0 |
| Chase Sapphire Preferred® | 3x pts | $95 |
| Capital One SavorOne | 3% | $0 |
| Chase Sapphire Reserve® | 3x pts | $550 |
| Amex Platinum Card® | 1x + $240 credit | $695 |
| Amex Gold Card® | 1x | $250 |
| Chase SW Rapid Rewards® Priority | 1x | $149 |
| Citi Costco Anywhere Visa® | 1% | $0 |
| Citi AAdvantage® Executive | 1x | $595 |

*Rotating category bonus
