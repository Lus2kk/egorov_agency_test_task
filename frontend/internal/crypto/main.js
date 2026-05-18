var CryptoMain = (function () {
  function init() {
    var addBtn = document.querySelector('.crypto_add_btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        CryptoUI.openModal();
      });
    }

    CryptoUI.subscribeExistingCoins();

    CryptoService.GET('', function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();