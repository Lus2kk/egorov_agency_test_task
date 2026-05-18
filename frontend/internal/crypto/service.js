var CryptoService = (function () {
  var ws = null;
  var subscriptions = {};
  var reconnectTimer = null;
  var allCoinsCache = [];

  function getSymbolCoin(symbol) {
    if (!symbol.endsWith('USDT')) return null;
    return symbol.slice(0, -4);
  }

  function formatSymbolName(symbol) {
    var coin = getSymbolCoin(symbol);
    if (!coin) return symbol;
    return coin.charAt(0) + coin.slice(1).toLowerCase();
  }

  function formatPrice(price) {
    var num = parseFloat(price);
    if (isNaN(num)) return price;
    if (num >= 1) return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (num >= 0.01) return '$' + num.toFixed(4);
    return '$' + num.toFixed(6);
  }

  function buildWsUrl() {
    var streams = Object.keys(subscriptions).map(function (s) {
      return s.toLowerCase() + '@miniTicker';
    });
    if (streams.length === 0) return null;
    return CryptoConfig.BINANCE_WS + '?streams=' + streams.join('/');
  }

  function connectWebSocket() {
    var url = buildWsUrl();
    if (!url) return;

    if (ws) {
      ws.onclose = null;
      ws.close();
    }

    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.error('WebSocket connection error:', e);
      scheduleReconnect();
      return;
    }

    ws.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        var data = msg.data || msg;
        if (data.s && subscriptions[data.s]) {
          var callbacks = subscriptions[data.s];
          var payload = {
            symbol: data.s,
            price: data.c,
            open: data.o,
            high: data.h,
            low: data.l,
            volume: data.v
          };
          for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](payload);
          }
        }
      } catch (e) {}
    };

    ws.onclose = function () {
      scheduleReconnect();
    };

    ws.onerror = function () {
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(function () {
      connectWebSocket();
    }, 5000);
  }

  return {
    GET: function (query, callback) {
      var url = CryptoConfig.BINANCE_REST + '/ticker/24hr';
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) {
          callback(null, new Error('Request failed: ' + xhr.status));
          return;
        }
        try {
          var data = JSON.parse(xhr.responseText);
          var filtered = data.filter(function (t) {
            return t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 0;
          });
          filtered.sort(function (a, b) {
            return parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume);
          });
          if (query) {
            var q = query.toUpperCase();
            filtered = filtered.filter(function (t) {
              return t.symbol.indexOf(q) !== -1 || t.symbol.replace('USDT', '').indexOf(q) !== -1;
            });
          }
          allCoinsCache = filtered;
          callback(filtered, null);
        } catch (e) {
          callback(null, e);
        }
      };
      xhr.send();
    },

    GET_PRICE: function (symbol, callback) {
      var url = CryptoConfig.BINANCE_REST + '/ticker/24hr?symbol=' + symbol;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) {
          callback(null, new Error('Request failed'));
          return;
        }
        try {
          var data = JSON.parse(xhr.responseText);
          callback(data, null);
        } catch (e) {
          callback(null, e);
        }
      };
      xhr.send();
    },

    DELETE: function (symbol) {
      if (subscriptions[symbol]) {
        delete subscriptions[symbol];
        connectWebSocket();
      }
    },

    SUBSCRIBE: function (symbol, callback) {
      if (!subscriptions[symbol]) {
        subscriptions[symbol] = [];
      }
      if (subscriptions[symbol].indexOf(callback) === -1) {
        subscriptions[symbol].push(callback);
      }
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      } else {
        var stream = symbol.toLowerCase() + '@miniTicker';
        try {
          ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: [stream], id: Date.now() }));
        } catch (e) {
          connectWebSocket();
        }
      }
    },

    UNSUBSCRIBE: function (symbol, callback) {
      if (subscriptions[symbol]) {
        if (callback) {
          var idx = subscriptions[symbol].indexOf(callback);
          if (idx !== -1) subscriptions[symbol].splice(idx, 1);
        }
        if (!callback || subscriptions[symbol].length === 0) {
          delete subscriptions[symbol];
          var stream = symbol.toLowerCase() + '@miniTicker';
          if (ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: [stream], id: Date.now() }));
            } catch (e) {}
          }
        }
      }
    },

    GET_CACHE: function () {
      return allCoinsCache;
    },

    DISCONNECT: function () {
      if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      subscriptions = {};
    },

    formatPrice: formatPrice,
    getSymbolCoin: getSymbolCoin,
    formatSymbolName: formatSymbolName
  };
})();