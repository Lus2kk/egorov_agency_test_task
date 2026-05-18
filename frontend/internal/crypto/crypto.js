var BACKEND_URL = (location.port === '5173') ? 'http://localhost:8060' : '';

var symbolMap = {
  BTC: { name: 'Bitcoin', img: '/images/bitcoin.png' },
  ETH: { name: 'Ethereum', img: '/images/Etherium.png' },
  SOL: { name: 'Solana', img: '/images/Solana.png' },
  XRP: { name: 'XRP', img: '/images/X.png' },
  USDC: { name: 'USD Coin', img: '/images/USD.png' },
  BNB: { name: 'Binance Coin', img: '/images/Binance.png' },
  DOGE: { name: 'Dogecoin', img: '/images/Dogge.png' },
  SUI: { name: 'Sui', img: '/images/SUI.png' },
  USDT: { name: 'Tether', img: '/images/Tetter.png' },
  MIDNIGHT: { name: 'Midnight', img: '/images/Midnight.png' }
};

var defaultSymbols = Object.keys(symbolMap);

var subscriptions = [];

var formatPrice = function (price) {
  if (price === undefined || price === null) return '$0.00';
  if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + price.toFixed(4);
};

var updateCryptoElement = function (symbol, priceData) {
  var info = symbolMap[symbol];
  if (!info) return;

  var elements = document.querySelectorAll('[data-crypto-symbol="' + symbol + '"]');
  elements.forEach(function (el) {
    var priceEl = el.querySelector('.crypto_price');
    if (priceEl && priceData.price !== undefined && priceData.price !== null) {
      priceEl.textContent = formatPrice(priceData.price);
      var change = priceData.change_24h;
      if (change !== undefined && change !== null) {
        priceEl.title = (change >= 0 ? '+' : '') + change.toFixed(2) + '% 24h';
        if (change >= 0) {
          priceEl.style.color = '#4ade80';
        } else {
          priceEl.style.color = '#f87171';
        }
      }
    }
    var changeEl = el.querySelector('.crypto_change');
    if (changeEl && priceData.change_24h !== undefined) {
      var ch = priceData.change_24h;
      changeEl.textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
      changeEl.style.color = ch >= 0 ? '#4ade80' : '#f87171';
      changeEl.style.fontFamily = 'Bruno Ace, sans-serif';
      changeEl.style.fontSize = '12px';
      changeEl.style.marginLeft = '6px';
    }
  });
};

var fetchPrices = function () {
  var url = BACKEND_URL + '/crypto/prices?symbols=' + defaultSymbols.join(',');
  fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result && result.data) {
        Object.keys(result.data).forEach(function (symbol) {
          updateCryptoElement(symbol, result.data[symbol]);
        });
      }
    })
    .catch(function (err) {
      console.error('Failed to fetch crypto prices:', err);
    });
};

var fetchSubscriptions = function () {
  fetch(BACKEND_URL + '/crypto/subscriptions')
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result && result.data) {
        subscriptions = result.data;
        renderSubscriptions();
      } else if (result && result.error) {
        console.warn('Subscriptions:', result.error);
      }
    })
    .catch(function (err) {
      console.warn('Subscriptions not available:', err);
    });
};

var renderSubscriptions = function () {
  var container = document.getElementById('subscriptions_container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'subscriptions_container';
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(3,28,65,0.95);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:16px;z-index:1000;min-width:260px;max-height:300px;overflow-y:auto;color:white;font-family:Bruno Ace,sans-serif;font-size:14px;';
    document.body.appendChild(container);
  }

  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><strong style="font-size:16px;">Streamer Subscriptions</strong><button id="close_subs" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;line-height:1;">&times;</button></div>';

  if (subscriptions.length === 0) {
    html += '<p style="opacity:0.6;text-align:center;">No active subscriptions</p>';
  } else {
    subscriptions.forEach(function (sub, i) {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.1);">';
      html += '<span>' + (sub.from_symbol || sub.stream_id) + ' \u2192 ' + (sub.to_symbol || 'USD') + '</span>';
      html += '<button class="delete-sub-btn" data-stream-id="' + sub.stream_id + '" style="background:#f87171;border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:12px;">\u2715</button>';
      html += '</div>';
    });
  }

  container.innerHTML = html;

  var closeBtn = document.getElementById('close_subs');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      container.style.display = 'none';
    });
  }

  document.querySelectorAll('.delete-sub-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var streamId = btn.getAttribute('data-stream-id');
      deleteSubscription(streamId);
    });
  });
};

var deleteSubscription = function (streamId) {
  fetch(BACKEND_URL + '/crypto/subscriptions/' + encodeURIComponent(streamId), {
    method: 'DELETE'
  })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (result.message) {
        subscriptions = subscriptions.filter(function (s) { return s.stream_id !== streamId; });
        renderSubscriptions();
      }
    })
    .catch(function (err) {
      console.error('Failed to delete subscription:', err);
    });
};

var connectWebSocket = function () {
  var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  var host = BACKEND_URL ? BACKEND_URL.replace(/^https?:\/\//, '') : window.location.host;
  var wsUrl = protocol + '//' + host + '/crypto/ws?symbols=' + defaultSymbols.join(',');
  var ws = null;
  var reconnectDelay = 3000;

  var connect = function () {
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('WebSocket creation failed, falling back to polling:', e);
      startPolling();
      return;
    }

    ws.onopen = function () {
      console.log('Crypto WebSocket connected');
      reconnectDelay = 3000;
    };

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'prices' && msg.data) {
          Object.keys(msg.data).forEach(function (symbol) {
            updateCryptoElement(symbol, msg.data[symbol]);
          });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = function () {
      console.log('Crypto WebSocket disconnected, reconnecting...');
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    ws.onerror = function () {
      ws.close();
    };
  };

  connect();
};

var pollingInterval = null;

var startPolling = function () {
  if (pollingInterval) return;
  fetchPrices();
  pollingInterval = setInterval(fetchPrices, 5000);
};

var initCrypto = function () {
  fetchPrices();
  connectWebSocket();
  fetchSubscriptions();

  var addBtn = document.querySelector('.crypto_add_btn');
  if (addBtn) {
    addBtn.addEventListener('click', function (e) {
      var container = document.getElementById('subscriptions_container');
      if (container) {
        container.style.display = 'block';
        fetchSubscriptions();
      }
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrypto);
} else {
  initCrypto();
}