(function () {
  var rows = document.querySelectorAll('.widefat tbody tr');
  if (!rows.length) {
    return;
  }

  rows.forEach(function (row) {
    row.setAttribute('tabindex', '0');
  });
})();
