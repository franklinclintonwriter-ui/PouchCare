(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/faq', {
    baseClass: 'pouchcare-section pouchcare-faq',
    hasButton: true
  });
})();
