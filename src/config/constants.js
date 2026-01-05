// Contract Addresses - UPDATE THESE AFTER DEPLOYMENT
export const FACTORY_ADDRESS = process.env.VITE_FACTORY_ADDRESS || '0xf4246b4eC3CC7eF8c9F5BB615E0E545973013A15';
export const USDC_ADDRESS = process.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000';

// Network Configuration
export const CHAIN_ID = 5042002; // Arc Network chain ID
export const CHAIN_NAME = 'Arc Network';
export const RPC_URL = process.env.VITE_RPC_URL || 'https://rpc.testnet.arc.network';
export const BLOCK_EXPLORER = 'https://testnet.arcscan.app/';

// Market Categories
export const CATEGORIES = {
  CRYPTO: 'crypto',
  POLITICS: 'politics',
  SPORTS: 'sports',
  ENTERTAINMENT: 'entertainment',
};

// Logo Mapping - Dynamic logo detection
export const LOGO_MAPPING = {
  bitcoin: '₿',
  btc: '₿',
  ethereum: 'Ξ',
  eth: 'Ξ',
  trump: '🇺🇸',
  election: '🗳️',
  chelsea: '⚽',
  'man u': '⚽',
  'manchester united': '⚽',
  football: '⚽',
  soccer: '⚽',
};

// Get logo from question text
export function getLogoFromQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  for (const [keyword, logo] of Object.entries(LOGO_MAPPING)) {
    if (lowerQuestion.includes(keyword)) {
      return logo;
    }
  }
  
  return '❓'; // Default logo
}

// Get category from question
export function getCategoryFromQuestion(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.match(/bitcoin|ethereum|crypto|btc|eth|token/)) {
    return CATEGORIES.CRYPTO;
  }
  if (lowerQuestion.match(/trump|election|president|vote|politics/)) {
    return CATEGORIES.POLITICS;
  }
  if (lowerQuestion.match(/football|soccer|basketball|tennis|sports|match|game/)) {
    return CATEGORIES.SPORTS;
  }
  
  return CATEGORIES.ENTERTAINMENT;
}