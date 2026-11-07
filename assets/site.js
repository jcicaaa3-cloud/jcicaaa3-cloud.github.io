/* Small local-only board search. No analytics, trackers or external services. */
(function () {
  'use strict';
  var board = document.querySelector('[data-research-board]');
  if (!board) return;
  var input = document.getElementById('board-search');
  var buttons = Array.prototype.slice.call(board.querySelectorAll('[data-board-filter]'));
  var items = Array.prototype.slice.call(board.querySelectorAll('[data-board-item]'));
  var count = document.getElementById('board-result-count');
  var empty = document.getElementById('board-empty');
  var current = 'all';

  function update() {
    var query = (input.value || '').trim().toLocaleLowerCase();
    var visible = 0;
    items.forEach(function (item) {
      var group = item.getAttribute('data-group');
      var text = item.textContent.toLocaleLowerCase();
      var shown = (current === 'all' || current === group) && (!query || text.indexOf(query) >= 0);
      item.hidden = !shown;
      if (shown) visible += 1;
    });
    count.textContent = visible + '개';
    empty.hidden = visible !== 0;
  }
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      current = btn.getAttribute('data-board-filter');
      buttons.forEach(function (b) {
        var selected = b === btn;
        b.classList.toggle('selected', selected);
        b.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      update();
    });
  });
  input.addEventListener('input', update);
  update();
}());
