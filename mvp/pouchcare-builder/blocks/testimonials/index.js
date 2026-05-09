(function () {
  if (!window.PouchCareBlockFactory) {
    return;
  }

  window.PouchCareBlockFactory.register('pouchcare/testimonials', {
    baseClass: 'pouchcare-section pouchcare-testimonials',
    hasButton: true
  });
})();
