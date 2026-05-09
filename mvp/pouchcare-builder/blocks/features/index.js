(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/features', {
    baseClass: 'pouchcare-section pouchcare-features',
    hasButton: true
  });
})();
