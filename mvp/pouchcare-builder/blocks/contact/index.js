(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/contact', {
    baseClass: 'pouchcare-section pouchcare-contact',
    hasButton: true
  });
})();
