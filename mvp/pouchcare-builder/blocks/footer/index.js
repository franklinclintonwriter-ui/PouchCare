(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/footer', {
    baseClass: 'pouchcare-section pouchcare-footer',
    hasButton: false
  });
})();
