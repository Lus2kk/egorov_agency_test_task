var CryptoUI = (function () {
  var modal = null;
  var searchInput = null;
  var coinsList = null;
  var addedCoins = {};
  var priceElements = {};
  var updateCallback = null;

  function getIconUrl(symbol) {
    var coin = CryptoService.getSymbolCoin(symbol);
    if (CryptoConfig.EXISTING_COINS[symbol]) {
      return CryptoConfig.EXISTING_COINS[symbol].icon;
    }
    return CryptoConfig.ICONS_CDN + coin.toLowerCase() + '.png';
  }

  function formatChange(changePercent) {
    var num = parseFloat(changePercent);
    if (isNaN(num)) return '';
    var sign = num >= 0 ? '+' : '';
    return sign + num.toFixed(2) + '%';
  }

  function formatChangeColor(changePercent) {
    var num = parseFloat(changePercent);
    if (isNaN(num)) return 'rgba(255,255,255,0.7)';
    return num >= 0 ? 'rgba(46,139,87,1)' : 'rgba(220,38,38,1)';
  }

  function createModal() {
    modal = document.createElement('div');
    modal.className = 'crypto_modal_overlay';
    modal.id = 'cryptoModal';

    modal.innerHTML =
      '<div class="crypto_modal">' +
        '<div class="crypto_modal_header">' +
          '<h2>Add a Cryptocurrency</h2>' +
          '<button class="crypto_modal_close" id="cryptoModalClose">&times;</button>' +
        '</div>' +
        '<input type="text" class="crypto_search" id="cryptoSearch" placeholder="Search by name or symbol...">' +
        '<div class="crypto_modal_list" id="cryptoList"></div>' +
        '<div class="crypto_modal_pagination" id="cryptoPagination"></div>' +
      '</div>';

    document.body.appendChild(modal);

    searchInput = document.getElementById('cryptoSearch');
    coinsList = document.getElementById('cryptoList');

    document.getElementById('cryptoModalClose').addEventListener('click', function () {
      CryptoUI.closeModal();
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) CryptoUI.closeModal();
    });

    var searchTimeout = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        CryptoUI.searchCoins(searchInput.value);
      }, 300);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        CryptoUI.closeModal();
      }
    });
  }

  function renderCoinItem(coin) {
    var symbol = coin.symbol;
    var existingClass = CryptoConfig.EXISTING_COINS[symbol] ? ' crypto_coin_item--existing' : '';
    var addedClass = addedCoins[symbol] ? ' crypto_coin_item--added' : '';
    var changePercent = coin.priceChangePercent || '0';
    var coinName = CryptoConfig.EXISTING_COINS[symbol]
      ? CryptoConfig.EXISTING_COINS[symbol].name
      : CryptoService.formatSymbolName(symbol);

    var item = document.createElement('div');
    item.className = 'crypto_coin_item' + existingClass + addedClass;
    item.setAttribute('data-symbol', symbol);

    item.innerHTML =
      '<img class="crypto_coin_item_icon" src="' + getIconUrl(symbol) + '" alt="' + coinName + '" onerror="this.style.display=\'none\'">' +
      '<div class="crypto_coin_item_info">' +
        '<span class="crypto_coin_item_name">' + coinName + '</span>' +
        '<span class="crypto_coin_item_symbol">' + CryptoService.getSymbolCoin(symbol) + '/USDT</span>' +
      '</div>' +
      '<div class="crypto_coin_item_price_info">' +
        '<span class="crypto_coin_item_price">' + CryptoService.formatPrice(coin.lastPrice) + '</span>' +
        '<span class="crypto_coin_item_change" style="color:' + formatChangeColor(changePercent) + '">' + formatChange(changePercent) + '</span>' +
      '</div>';

    item.addEventListener('click', function () {
      CryptoUI.addCoinToPage(symbol, coinName, coin.lastPrice);
    });

    return item;
  }

  return {
    openModal: function () {
      if (!modal) createModal();
      modal.classList.add('open');
      searchInput.value = '';
      document.body.style.overflow = 'hidden';
      CryptoUI.searchCoins('');
      searchInput.focus();
    },

    closeModal: function () {
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    },

    searchCoins: function (query) {
      var cache = CryptoService.GET_CACHE();
      if (cache.length > 0) {
        CryptoUI.renderCoinsList(cache, query);
        return;
      }
      coinsList.innerHTML = '<div class="crypto_loading">Loading cryptocurrencies...</div>';
      CryptoService.GET(query, function (data, err) {
        if (err || !data) {
          coinsList.innerHTML = '<div class="crypto_loading">Failed to load. Please try again.</div>';
          return;
        }
        CryptoUI.renderCoinsList(data, query);
      });
    },

    renderCoinsList: function (data, query) {
      coinsList.innerHTML = '';
      var q = (query || '').toUpperCase();
      var filtered = data;
      if (q) {
        filtered = data.filter(function (t) {
          return t.symbol.indexOf(q) !== -1;
        });
      }
      var limit = CryptoConfig.MODAL_PAGE_SIZE;
      var shown = filtered.slice(0, limit);

      for (var i = 0; i < shown.length; i++) {
        coinsList.appendChild(renderCoinItem(shown[i]));
      }

      if (filtered.length === 0) {
        coinsList.innerHTML = '<div class="crypto_loading">No cryptocurrencies found</div>';
      }
    },

    addCoinToPage: function (symbol, name, initialPrice) {
      if (CryptoConfig.EXISTING_COINS[symbol] || addedCoins[symbol]) {
        CryptoUI.closeModal();
        return;
      }

      var section = document.querySelector('.crypto_section');
      if (!section) return;

      var coin = document.createElement('div');
      coin.className = 'crypto_coin crypto_coin--dynamic';
      coin.setAttribute('data-symbol', symbol);
      coin.id = 'dynamic_' + symbol;

      coin.innerHTML =
        '<button class="crypto_coin_delete" title="Remove">&times;</button>' +
        '<img src="' + getIconUrl(symbol) + '" alt="' + name + '" class="crypto_icon" onerror="this.style.display=\'none\'">' +
        '<span class="crypto_name">' + name + '</span>' +
        '<span class="crypto_price" id="price_' + symbol + '">' + CryptoService.formatPrice(initialPrice) + '</span>';

      var targetContainer = section.querySelector('.crypto_right');
      if (targetContainer) {
        targetContainer.appendChild(coin);
      } else {
        section.appendChild(coin);
      }

      var deleteBtn = coin.querySelector('.crypto_coin_delete');
      deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        CryptoUI.removeCoinFromPage(symbol);
      });

      addedCoins[symbol] = { name: name, price: initialPrice };

      CryptoService.SUBSCRIBE(symbol, function (data) {
        CryptoUI.updatePrice(data.symbol, data.price, data.open);
      });

      CryptoUI.closeModal();
    },

    removeCoinFromPage: function (symbol) {
      var el = document.getElementById('dynamic_' + symbol);
      if (el) el.remove();
      delete addedCoins[symbol];
      CryptoService.DELETE(symbol);
    },

    updatePrice: function (symbol, price, openPrice) {
      var el = document.getElementById('price_' + symbol);
      if (el) {
        el.textContent = CryptoService.formatPrice(price);

        var current = parseFloat(price);
        var open = parseFloat(openPrice);
        if (!isNaN(current) && !isNaN(open) && open > 0) {
          var change = ((current - open) / open) * 100;
          el.style.color = change >= 0 ? 'rgba(46,139,87,1)' : 'rgba(220,38,38,1)';
          setTimeout(function () {
            el.style.color = '';
          }, 2000);
        }
      }
    },

    updateExistingPrices: function () {
      var existingSymbols = Object.keys(CryptoConfig.EXISTING_COINS);
      for (var i = 0; i < existingSymbols.length; i++) {
        (function (sym) {
          CryptoService.GET_PRICE(sym, function (data, err) {
            if (err || !data) return;
            var coin = CryptoConfig.EXISTING_COINS[sym];
            if (!coin) return;

            var priceEls = document.querySelectorAll('.crypto_coin[data-symbol="' + sym + '"] .crypto_price');
            for (var j = 0; j < priceEls.length; j++) {
              priceEls[j].textContent = CryptoService.formatPrice(data.lastPrice);
            }
          });
        })(existingSymbols[i]);
      }
    },

    subscribeExistingCoins: function () {
      var symbols = Object.keys(CryptoConfig.EXISTING_COINS);
      for (var i = 0; i < symbols.length; i++) {
        (function (sym) {
          CryptoService.SUBSCRIBE(sym, function (data) {
            var priceEls = document.querySelectorAll('.crypto_coin[data-symbol="' + data.symbol + '"] .crypto_price');
            for (var j = 0; j < priceEls.length; j++) {
              priceEls[j].textContent = CryptoService.formatPrice(data.price);
              var current = parseFloat(data.price);
              var open = parseFloat(data.open);
              if (!isNaN(current) && !isNaN(open) && open > 0) {
                var change = ((current - open) / open) * 100;
                priceEls[j].style.color = change >= 0 ? 'rgba(46,139,87,1)' : 'rgba(220,38,38,1)';
              }
            }
          });
        })(symbols[i]);
      }
    },

    getAddedCoins: function () {
      return addedCoins;
    }
  };
})();