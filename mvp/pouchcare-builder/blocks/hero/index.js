(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/hero', {
    baseClass: 'pouchcare-section pouchcare-hero',
    hasButton: true
  });
})();
