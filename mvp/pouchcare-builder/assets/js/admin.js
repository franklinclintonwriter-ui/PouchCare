(function () {
  /**
   * Fetch the WP REST API with headers PouchCare Security accepts for writes.
   * @param {string} path e.g. "pouchcare/v1/templates" (no leading slash required)
   */
  window.pouchcareBuilderFetch = function (path, options) {
    var rest = window.pouchcareBuilderRest || {};
    var base = (rest.root || '').replace(/\/?$/, '/');
    var url = base + String(path || '').replace(/^\//, '');
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    if (rest.nonceWpRest && !headers['X-WP-Nonce']) {
      headers['X-WP-Nonce'] = rest.nonceWpRest;
    }
    if (rest.noncePouchcare && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = rest.noncePouchcare;
    }
    options.headers = headers;
    options.credentials = options.credentials || 'same-origin';
    return fetch(url, options);
  };

  var rows = document.querySelectorAll('.widefat tbody tr');
  if (!rows.length) {
    return;
  }

  rows.forEach(function (row) {
    row.setAttribute('tabindex', '0');
  });
})();
