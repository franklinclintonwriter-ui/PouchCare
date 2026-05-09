(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/cta', {
    baseClass: 'pouchcare-section pouchcare-cta',
    hasButton: true
  });
})();
