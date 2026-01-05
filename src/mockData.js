// ============= MOCK DATA (Replace with real Web3 calls) =============
const MOCK_MARKETS = [
  {
    id: '0x1234...5678',
    question: 'Will Bitcoin reach $150,000 by end of 2026?',
    description: 'Market resolves YES if BTC/USD hits $150k before Dec 31, 2026',
    logo: '₿',
    category: 'Crypto',
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 125000,
    liquidity: 45000,
    endTime: new Date('2026-12-31').getTime(),
    status: 'active',
    yesBalance: 100,
    noBalance: 50,
    lpShares: 500,
    resolved: false,
    outcome: null
  },
  {
    id: '0xabcd...efgh',
    question: 'Will Trump win 2028 election?',
    description: 'Resolves YES if Donald Trump wins the 2028 US Presidential Election',
    logo: '🇺🇸',
    category: 'Politics',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 89000,
    liquidity: 32000,
    endTime: new Date('2028-11-05').getTime(),
    status: 'active',
    yesBalance: 200,
    noBalance: 100,
    lpShares: 0,
    resolved: false,
    outcome: null
  },
  {
    id: '0x9999...1111',
    question: 'Chelsea to beat Man United?',
    description: 'Premier League match on March 15, 2026. Resolves YES if Chelsea wins.',
    logo: '⚽',
    category: 'Sports',
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 56000,
    liquidity: 28000,
    endTime: new Date('2026-03-15').getTime(),
    status: 'active',
    yesBalance: 0,
    noBalance: 0,
    lpShares: 1000,
    resolved: false,
    outcome: null
  }
];

export default MOCK_MARKETS;