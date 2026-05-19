var updateCryptoElement = function (shortSymbol, price, openPrice) {
  var elements = document.querySelectorAll('[data-crypto-symbol="' + shortSymbol + '"]');
  elements.forEach(function (el) {
    var priceEl = el.querySelector('.crypto_price');
    if (!priceEl) return;
    priceEl.textContent = CryptoService.formatPrice(price);

    var current = parseFloat(price);
    var open = parseFloat(openPrice);
    if (!isNaN(current) && !isNaN(open) && open > 0) {
      var change = ((current - open) / open) * 100;
      priceEl.title = (change >= 0 ? '+' : '') + change.toFixed(2) + '% 24h';
      priceEl.style.color = change >= 0 ? '#4ade80' : '#f87171';
    }
  });
};
var subscribeCryptoElements = function () {
  var elements = document.querySelectorAll('[data-crypto-symbol]');
  var seen = {};
  elements.forEach(function (el) {
    var shortSymbol = el.getAttribute('data-crypto-symbol');
    if (!shortSymbol || seen[shortSymbol]) return;
    seen[shortSymbol] = true;
    var pair = shortSymbol + 'USDT';
    CryptoService.SUBSCRIBE(pair, function (data) {
      updateCryptoElement(shortSymbol, data.price, data.open);
    });
  });
};

var initCrypto = function () {
  if (typeof CryptoService === 'undefined') {
    console.warn('CryptoService not available; price updates disabled');
    return;
  }
  subscribeCryptoElements();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCrypto);
} else {
  initCrypto();
}