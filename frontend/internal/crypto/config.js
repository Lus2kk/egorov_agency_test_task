var CryptoConfig = {
  BINANCE_REST: 'https://api.binance.com/api/v3',
  BINANCE_WS: 'wss://stream.binance.com:9443/stream',
  ICONS_CDN: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/',
  EXISTING_COINS: {
    'BTCUSDT':   { name: 'Bitcoin',       icon: '/images/bitcoin.png', side: 'left' },
    'ETHUSDT':   { name: 'Ethereum',      icon: '/images/Etherium.png', side: 'left' },
    'SOLUSDT':   { name: 'Solana',        icon: '/images/Solana.png', side: 'left' },
    'XRPUSDT':   { name: 'XRP',           icon: '/images/X.png', side: 'left' },
    'USDCUSDT':  { name: 'USD Coin',      icon: '/images/USD.png', side: 'left' },
    'BNBUSDT':   { name: 'Binance Coin',  icon: '/images/Binance.png', side: 'right' },
    'DOGEUSDT':  { name: 'Dogecoin',      icon: '/images/Dogge.png', side: 'right' },
    'SUIUSDT':   { name: 'Sui',           icon: '/images/SUI.png', side: 'right' }
  },
  MODAL_PAGE_SIZE: 50
};