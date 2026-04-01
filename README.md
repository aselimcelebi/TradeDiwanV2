# Trade Journal - TradeZella Clone

Modern, minimal web-based trade journal application inspired by TradeZella. Built with Next.js, Prisma, Tailwind CSS, and advanced trading analytics.

## ✨ Features

### Core Trading Features
- 📊 **Trade Management**: Add, edit, and track trades with detailed information
- 📈 **Advanced Analytics**: Comprehensive metrics including P&L, win rate, profit factor, and expectancy
- 📅 **Calendar View**: Visual trading calendar with daily P&L and trade counts
- 🎯 **Strategy Tracking**: Organize trades by strategies with performance analysis
- 🏷️ **Tag System**: Flexible tagging for market conditions and setups

### Dashboard Features
- 📋 **KPI Cards**: Net P&L, Profit Factor, Current Streak, and more
- 📅 **Monthly Calendar**: Visual representation of trading performance
- 📊 **Sidebar Widgets**: Account balance, win rate gauge, expectancy metrics
- 📈 **Performance Tracking**: Daily, weekly, and monthly summaries

### TradeZella-Inspired Design
- 🎨 **Modern UI**: Clean, professional interface with purple gradient sidebar
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔧 **Intuitive Navigation**: Easy-to-use sidebar with organized menu structure
- ⚡ **Fast Performance**: Optimized for speed with Next.js and modern practices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd trade-journal
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```

3. **Initialize database:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Create and migrate database
   npm run db:migrate
   
   # Seed with demo data (60 days, 100+ trades)
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

Visit http://localhost:3000 to see the application.

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── trades/        # Trade CRUD operations
│   │   │   ├── journal/       # Daily journal entries
│   │   │   └── strategies/    # Strategy management
│   │   ├── globals.css        # Global styles and design system
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Dashboard page
│   ├── components/            # React components
│   │   ├── sidebar.tsx        # TradeZella-style navigation
│   │   ├── header.tsx         # Top navigation with filters
│   │   ├── dashboard-*.tsx    # Dashboard components
│   │   └── add-trade-modal.tsx # Trade entry modal
│   └── lib/                   # Utilities and database
│       ├── prisma.ts          # Database client
│       ├── utils.ts           # Trading calculations & helpers
│       └── demoUser.ts        # Demo mode configuration
├── prisma/
│   └── schema.prisma          # Database schema
└── scripts/
    └── seed.ts                # Demo data generator
```

## 🎯 Key Features Breakdown

### Trade Management
- **Add Trade Modal**: Comprehensive form with real-time P&L calculation
- **Trade Validation**: Zod-powered form validation with error handling
- **Trade List**: Sortable, filterable table with advanced search
- **Edit/Delete**: Full CRUD operations with confirmation dialogs

### Analytics Engine
- **P&L Calculation**: Accurate profit/loss calculations for LONG/SHORT positions
- **Risk Management**: R-multiple calculations when risk is specified
- **Performance Metrics**: Win rate, profit factor, expectancy, max drawdown
- **Streak Tracking**: Current and maximum winning/losing streaks

### Design System
- **Color Palette**: Professional purple/blue theme with semantic colors
- **Typography**: Inter font with proper sizing hierarchy
- **Components**: Reusable button, input, card, and layout components
- **Animations**: Smooth transitions and micro-interactions

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="file:./dev.db"           # SQLite for development
NEXT_PUBLIC_APP_NAME="Trade Journal"   # App branding
NEXT_PUBLIC_DEMO_MODE="true"          # Demo mode indicator
```

### Database Schema
- **User**: Demo user management
- **Trade**: Complete trade information with calculated fields
- **JournalEntry**: Daily trading journal with mood tracking
- **Strategy**: Reusable trading strategies with rules

### Trading Calculations
```typescript
// P&L Calculation
PnL = (Exit - Entry) × Qty × (LONG=+1 / SHORT=-1) - Fees

// Key Metrics
Win Rate = Winning Trades / Total Trades
Profit Factor = Total Gains / Total Losses
Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
R Multiple = PnL / Risk (when risk is specified)
```

## 🎨 Customization

### Colors
The design system uses CSS custom properties for easy theming:

```css
:root {
  --background: #F6F7FB;     /* Main background */
  --card: #FFFFFF;           /* Card backgrounds */
  --primary: #6B5BFF;        /* Primary purple */
  --text: #0F172A;           /* Text color */
  --muted: #94A3B8;          /* Muted text */
  --border: #E2E8F0;         /* Borders */
  --pnl-positive: #16A34A;   /* Green for profits */
  --pnl-negative: #DC2626;   /* Red for losses */
}
```

### Component Styling
- **Cards**: Consistent rounded corners (16px) with subtle shadows
- **Buttons**: Primary (purple) and secondary (white) variants
- **Inputs**: Clean design with focus states and validation styling
- **Tables**: Striped rows with hover states for better UX

## 📊 Demo Data

The seed script generates realistic trading data:
- **60 days** of trading history
- **80-120 trades** with varied outcomes
- **Multiple symbols**: BTCUSDT, ETHUSDT, XAUUSD, forex pairs
- **Realistic strategies**: Breakout, Scalping, Swing, Momentum
- **Journal entries**: Daily reflections with mood tracking
- **60% win rate** with realistic P&L distribution

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set up Vercel Postgres database
3. Update environment variables:
   ```env
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_DEMO_MODE="false"
   ```
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from sqlite
     url      = env("DATABASE_URL")
   }
   ```
5. Deploy with automatic migrations

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Core trade management
- ✅ Dashboard with KPIs
- ✅ Calendar view
- ✅ Basic analytics

### Phase 2 (Next)
- [ ] Advanced filtering and search
- [ ] Trade list/table view
- [ ] Daily journal integration
- [ ] Strategy management

### Phase 3 (Future)
- [ ] CSV import/export
- [ ] Advanced charts (Recharts)
- [ ] User authentication
- [ ] Multi-user support

### Phase 4 (Advanced)
- [ ] AI-powered insights
- [ ] Performance coaching
- [ ] Social features
- [ ] Mobile app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [TradeZella](https://tradezella.com) for the UI/UX design
- Built with [Next.js](https://nextjs.org/), [Prisma](https://prisma.io/), and [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)

---

**Note**: This is a learning/demo project inspired by TradeZella. It is not affiliated with or endorsed by TradeZella.
