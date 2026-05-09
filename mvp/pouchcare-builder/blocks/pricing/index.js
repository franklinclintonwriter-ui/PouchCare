(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/pricing', {
    baseClass: 'pouchcare-section pouchcare-pricing',
    hasButton: true
  });
})();
