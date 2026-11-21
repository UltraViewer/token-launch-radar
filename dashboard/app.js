// Token Radar's page: one dataset in (window.RADAR, written beside the page),
// one sortable, filterable board out, with a detail view per protocol.
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) {
    document.getElementById('rows').innerHTML = '<tr><td colspan="7">No radar data was loaded.</td></tr>';
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var tabParam = params.get('tab') === 'live';
  var state = {
    tab: tabParam ? 'live' : 'board',
    sort: params.get('sort') || (tabParam ? 'mcap_usd' : 'rank'),
    dir: params.get('dir') || (tabParam ? 'desc' : 'asc'),
    q: params.get('q') || '',
    category: params.get('category') || '',
    chain: params.get('chain') || '',
    watchlist: params.get('watchlist') === '1',
    selected: params.get('detail') || null,
  };

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /** $2.75B, $826.4M, $51.2M, $4.1K, $900. */
  function fmtMoney(n) {
    if (n == null || !isFinite(n)) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(n >= 1e10 ? 1 : 2).replace(/\.0+$/, '') + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + Math.round(n);
  }
  function fmtPct(n) {
    if (n == null || !isFinite(n)) return '<span class="sub">—</span>';
    var cls = n >= 0 ? 'up' : 'down';
    return '<span class="' + cls + '">' + (n >= 0 ? '+' : '') + n.toFixed(1) + '%</span>';
  }
  function fmtAge(days) {
    if (days == null) return '<span class="sub">unknown</span>';
    if (days < 30) return days + 'd';
    if (days < 365) return Math.round(days / 30) + 'mo';
    return (days / 365).toFixed(1) + 'y';
  }
  function fmtDate(iso) { return iso || '—'; }

  /** Split one farm-step string into its action, cost and time. */
  function splitStep(s) {
    var costAt = s.indexOf(' Cost: ');
    var timeAt = s.indexOf(' Time: ');
    if (costAt < 0 || timeAt < 0 || timeAt < costAt) return { action: s, cost: '', time: '' };
    return {
      action: s.slice(0, costAt),
      cost: s.slice(costAt + 7, timeAt),
      time: s.slice(timeAt + 7).replace(/\.$/, ''),
    };
  }

  function boardRows() {
    var q = state.q.trim().toLowerCase();
    var rows = D.rows.filter(function (r) {
      if (state.watchlist && !r.watchlisted) return false;
      if (state.category && (r.category || '') !== state.category) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (q && (r.name + ' ' + r.slug).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    return sortByKey(rows, state.sort, state.dir);
  }

  function sortByKey(rows, key, dir) {
    var d = dir === 'desc' ? -1 : 1;
    return rows.sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return av.localeCompare(bv) * d;
      return (av - bv) * d;
    });
  }

  function liveRows() {
    return sortByKey(D.live.slice(), state.sort, state.dir);
  }

  function headCells(cols) {
    return cols.map(function (c) {
      var sorted = state.sort === c.key;
      var aria = sorted ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return '<th data-sort="' + c.key + '" aria-sort="' + aria + '" class="' + (c.num ? 'num' : '') + '">' + c.label + '</th>';
    }).join('');
  }

  function renderHead() {
    if (state.tab === 'live') {
      $('headrow').innerHTML = headCells([
        { key: 'name', label: 'Protocol' },
        { key: 'category', label: 'Category' },
        { key: 'tvl_usd', label: 'TVL', num: true },
        { key: 'mcap_usd', label: 'Market cap', num: true },
        { key: 'change_7d', label: '7d', num: true },
      ]);
      return;
    }
    $('headrow').innerHTML = headCells([
      { key: 'rank', label: 'Rank', num: true },
      { key: 'name', label: 'Protocol' },
      { key: 'category', label: 'Category' },
      { key: 'tvl_usd', label: 'TVL', num: true },
      { key: 'change_7d', label: '7d', num: true },
      { key: 'age_days', label: 'Age', num: true },
      { key: 'implied_value_usd', label: 'Implied value', num: true },
    ]);
  }

  function renderRows() {
    var tbody = $('rows');
    if (state.tab === 'live') {
      tbody.innerHTML = liveRows().map(function (r) {
        return '<tr data-slug="' + esc(r.slug) + '">' +
          '<td><span class="name">' + esc(r.name) + '</span><div class="sub">' + esc(r.slug) + (r.symbol ? ' · ' + esc(r.symbol) : '') + '</div></td>' +
          '<td>' + esc(r.category || '—') + '</td>' +
          '<td class="num money">' + fmtMoney(r.tvl_usd) + '</td>' +
          '<td class="num value">' + fmtMoney(r.mcap_usd) + '</td>' +
          '<td class="num">' + fmtPct(r.change_7d) + '</td></tr>';
      }).join('');
      $('empty').hidden = true;
      return;
    }
    var rows = boardRows();
    $('empty').hidden = rows.length > 0;
    tbody.innerHTML = rows.map(function (r) {
      var sel = state.selected === r.slug ? ' class="selected"' : '';
      var rankCls = r.rank <= 3 ? 'rank top3' : 'rank';
      return '<tr data-slug="' + esc(r.slug) + '"' + sel + '>' +
        '<td class="num"><span class="' + rankCls + '">' + r.rank + '</span></td>' +
        '<td><span class="name">' + esc(r.name) + '</span><div class="sub">' + esc(r.slug) + '</div>' +
        (r.watchlisted ? '<span class="tag wl">watchlist</span>' : '') +
        r.chains.slice(0, 3).map(function (c) { return '<span class="tag">' + esc(c) + '</span>'; }).join('') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td class="num money">' + fmtMoney(r.tvl_usd) + '</td>' +
        '<td class="num">' + fmtPct(r.change_7d) + '</td>' +
        '<td class="num">' + fmtAge(r.age_days) + '</td>' +
        '<td class="num value">' + fmtMoney(r.implied_value_usd) + '</td></tr>';
    }).join('');
  }

  function renderDetail() {
    var box = $('detail');
    if (!state.selected) { box.innerHTML = ''; return; }
    var r = null;
    for (var i = 0; i < D.rows.length; i++) if (D.rows[i].slug === state.selected) { r = D.rows[i]; break; }
    if (!r) { box.innerHTML = ''; return; }
    var steps = r.farm_steps.map(function (s) {
      var p = splitStep(s);
      return '<li>' + esc(p.action) +
        (p.cost ? '<span class="cost">Cost: ' + esc(p.cost) + '</span>' : '') +
        (p.time ? '<span class="time">Time: ' + esc(p.time) + '</span>' : '') + '</li>';
    }).join('');
    box.innerHTML = '<div class="detail"><button class="close" id="closeDetail" type="button">Close</button>' +
      '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<p class="meta">' + esc(r.slug) + ' · ' + esc(r.category || 'uncategorised') + ' · ' + r.chains.map(esc).join(', ') + ' · listed ' + fmtDate(r.listed_at) + '</p>' +
      '<h3>How the implied value is derived</h3><dl class="modelgrid">' +
      '<div><dt>TVL</dt><dd>' + fmtMoney(r.tvl_usd) + '</dd></div>' +
      '<div><dt>Base (TVL × 0.30)</dt><dd>' + fmtMoney(r.base_usd) + '</dd></div>' +
      '<div><dt>7-day change</dt><dd>' + fmtPct(r.change_7d) + '<small>growth × ' + r.growth_multiplier.toFixed(2) + '</small></dd></div>' +
      '<div><dt>Age with no token</dt><dd>' + fmtAge(r.age_days) + '<small>maturity × ' + r.maturity_multiplier.toFixed(2) + '</small></dd></div>' +
      '<div><dt>Implied value</dt><dd>' + fmtMoney(r.implied_value_usd) + '<small>base × growth × maturity</small></dd></div>' +
      '</dl>' +
      '<h3>Farm plan — ' + r.farm_steps.length + ' steps</h3><ol class="steps">' + steps + '</ol></div>';
    $('closeDetail').addEventListener('click', function () { state.selected = null; syncUrl(); render(); });
  }

  function renderFilters() {
    var cats = {}, chains = {};
    D.rows.forEach(function (r) {
      if (r.category) cats[r.category] = true;
      r.chains.forEach(function (c) { chains[c] = true; });
    });
    var catSel = $('category');
    var chainSel = $('chain');
    if (catSel.options.length <= 1) {
      Object.keys(cats).sort().forEach(function (c) {
        var o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
      });
    }
    if (chainSel.options.length <= 1) {
      Object.keys(chains).sort().forEach(function (c) {
        var o = document.createElement('option'); o.value = c; o.textContent = c; chainSel.appendChild(o);
      });
    }
    catSel.value = state.category;
    chainSel.value = state.chain;
    $('q').value = state.q;
    $('watchlist').checked = state.watchlist;
  }

  function renderStats() {
    $('stats').innerHTML =
      '<div><dt>Snapshot</dt><dd>' + esc(D.as_of) + '</dd></div>' +
      '<div><dt>Protocols</dt><dd>' + D.board_size + ' ranked</dd></div>' +
      '<div><dt>Watchlist covered</dt><dd>' + D.watchlist_size + ' / ' + D.watchlist_size + '</dd></div>' +
      '<div><dt>Early finds</dt><dd>' + D.early_size + '</dd></div>' +
      '<div><dt>Already tokenized</dt><dd>' + D.live_size + ' shown</dd></div>';
    $('formula').innerHTML = '<b>Model ' + esc(D.model_version) + ':</b> ' + esc(D.formula);
    $('asof').textContent = D.as_of;
  }

  function renderTabs() {
    $('tab-board').setAttribute('aria-selected', state.tab === 'board' ? 'true' : 'false');
    $('tab-live').setAttribute('aria-selected', state.tab === 'live' ? 'true' : 'false');
    var boardOnly = state.tab === 'board';
    $('q').disabled = !boardOnly;
    $('category').disabled = !boardOnly;
    $('chain').disabled = !boardOnly;
    $('watchlist').disabled = !boardOnly;
  }

  function render() {
    renderStats();
    renderTabs();
    renderFilters();
    renderHead();
    renderRows();
    renderDetail();
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.tab === 'live') p.set('tab', 'live');
    if (state.sort !== 'rank' || state.dir !== 'asc') { p.set('sort', state.sort); p.set('dir', state.dir); }
    if (state.q) p.set('q', state.q);
    if (state.category) p.set('category', state.category);
    if (state.chain) p.set('chain', state.chain);
    if (state.watchlist) p.set('watchlist', '1');
    if (state.selected) p.set('detail', state.selected);
    var qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  $('tab-board').addEventListener('click', function () { state.tab = 'board'; state.sort = 'rank'; state.dir = 'asc'; syncUrl(); render(); });
  $('tab-live').addEventListener('click', function () { state.tab = 'live'; state.sort = 'mcap_usd'; state.dir = 'desc'; syncUrl(); render(); });
  $('q').addEventListener('input', function (e) { state.q = e.target.value; syncUrl(); renderRows(); });
  $('category').addEventListener('change', function (e) { state.category = e.target.value; syncUrl(); renderRows(); });
  $('chain').addEventListener('change', function (e) { state.chain = e.target.value; syncUrl(); renderRows(); });
  $('watchlist').addEventListener('change', function (e) { state.watchlist = e.target.checked; syncUrl(); renderRows(); });
  $('headrow').addEventListener('click', function (e) {
    var th = e.target.closest('th[data-sort]');
    if (!th) return;
    var key = th.getAttribute('data-sort');
    if (state.sort === key) { state.dir = state.dir === 'asc' ? 'desc' : 'asc'; }
    else { state.sort = key; state.dir = key === 'name' || key === 'category' ? 'asc' : 'desc'; }
    syncUrl(); renderHead(); renderRows();
  });
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (!tr) return;
    if (state.tab === 'live') return;
    state.selected = state.selected === tr.getAttribute('data-slug') ? null : tr.getAttribute('data-slug');
    syncUrl(); renderRows(); renderDetail();
    if (state.selected) $('detail').scrollIntoView({ block: 'nearest' });
  });

  render();
})();
