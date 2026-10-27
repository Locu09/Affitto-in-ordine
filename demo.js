(() => {
  'use strict';

  const STORAGE_KEY = 'affitto-in-ordine-demo-v1';
  const ROUTE_FLAG = 'aio-motion-nav';
  const MS_DAY = 86400000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (id) => document.getElementById(id);

  const money0 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
  const money2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });

  const fmtMoney = (v) => money0.format(Math.round(Number(v) || 0));
  const fmtMoney2 = (v) => money2.format(Number(v) || 0);
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad2 = (n) => String(n).padStart(2, '0');

  function toISO(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function utcDay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }

  function todayISO() { return toISO(new Date()); }

  function shiftMonths(months, day = 1) {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() + months, 1);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(day, lastDay));
    return toISO(base);
  }

  function daysUntil(iso) {
    if (!iso) return Infinity;
    return Math.round((utcDay(iso) - utcDay(todayISO())) / MS_DAY);
  }

  function monthKey(date = new Date()) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  }

  function monthKeysBack(count) {
    const now = new Date();
    const keys = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    return keys;
  }

  function monthLabel(key, style = 'long') {
    const [y, m] = key.split('-').map(Number);
    const text = new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: style, year: 'numeric' });
    return cap(text.replace('.', ''));
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return cap(parseISO(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''));
  }

  function dueDate(prop, key) {
    const day = Math.max(1, Math.min(28, Number(prop.dueDay) || 5));
    return `${key}-${pad2(day)}`;
  }

  function relLabel(n) {
    if (n < 0) return `scaduta da ${Math.abs(n)} gg`;
    if (n === 0) return 'oggi';
    if (n === 1) return 'domani';
    return `tra ${n} gg`;
  }

  function sampleState() {
    const properties = [
      {
        id: 'p1',
        name: 'Bilocale Porta Romana',
        address: 'Via Anfossi 12, Milano',
        tenant: 'Giulia Rossi',
        rent: 1150,
        dueDay: 5,
        contractStart: shiftMonths(-38, 1),
        contractEnd: shiftMonths(14, 28),
        registrationDate: shiftMonths(2, 15),
        increaseDate: shiftMonths(1, 10),
        deposit: 2300,
        notes: 'Caldaia revisionata a marzo'
      },
      {
        id: 'p2',
        name: 'Trilocale Navigli',
        address: 'Alzaia Naviglio Grande 44, Milano',
        tenant: 'Marco Bianchi',
        rent: 1450,
        dueDay: 10,
        contractStart: shiftMonths(-14, 1),
        contractEnd: shiftMonths(26, 30),
        registrationDate: shiftMonths(7, 15),
        increaseDate: shiftMonths(9, 10),
        deposit: 2900,
        notes: ''
      },
      {
        id: 'p3',
        name: 'Monolocale Bologna Centro',
        address: 'Via San Vitale 30, Bologna',
        tenant: 'Sara Conti',
        rent: 780,
        dueDay: 5,
        contractStart: shiftMonths(-20, 1),
        contractEnd: shiftMonths(5, 28),
        registrationDate: shiftMonths(1, 10),
        increaseDate: shiftMonths(4, 15),
        deposit: 1560,
        notes: 'L’inquilina ha chiesto una proroga'
      }
    ];

    const keys = monthKeysBack(6);
    const allPaid = {};
    keys.forEach((k) => { allPaid[k] = true; });

    const p3Paid = {};
    keys.forEach((k, i) => { p3Paid[k] = i < keys.length - 2; });

    return {
      properties,
      payments: { p1: { ...allPaid }, p2: { ...allPaid }, p3: p3Paid }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.properties) && parsed.payments && typeof parsed.payments === 'object') {
          return parsed;
        }
      }
    } catch (_) { /* dati non validi: riparte dalla demo */ }
    return sampleState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { /* storage non disponibile */ }
  }

  let state = loadState();
  let currentView = 'overview';
  let deadlineFilter = 90;
  let toastTimer = null;
  let lastFocused = null;

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }

  /* ------------------------------------------------------------------ */
  /* Schermata di attesa locale                                          */
  /* ------------------------------------------------------------------ */

  let thinking = null;
  let thinkingTimer = 0;

  function showThinking(title, detail, kicker = 'Demo locale') {
    if (reduceMotion.matches) return null;
    clearTimeout(thinkingTimer);

    if (!thinking) {
      thinking = document.createElement('div');
      thinking.className = 'aio-thinking';
      thinking.setAttribute('role', 'status');
      thinking.setAttribute('aria-live', 'polite');
      thinking.setAttribute('aria-atomic', 'true');
      thinking.innerHTML = `
        <div class="aio-thinking-card">
          <span class="aio-thinking-mark" aria-hidden="true"><svg focusable="false"><use href="#i-logo"></use></svg></span>
          <p class="aio-thinking-kicker"></p>
          <p class="aio-thinking-title"></p>
          <p class="aio-thinking-detail"></p>
          <span class="aio-thinking-bar" aria-hidden="true"><i></i></span>
        </div>`;

      const app = document.querySelector('.app');
      thinking._restoreInert = app ? app.inert : false;
      thinking._restoreBusy = app ? app.getAttribute('aria-busy') : null;
      thinking._lastFocus = document.activeElement;
      if (app) {
        app.inert = true;
        app.setAttribute('aria-busy', 'true');
      }
      document.body.appendChild(thinking);
    }

    thinking.querySelector('.aio-thinking-kicker').textContent = kicker;
    thinking.querySelector('.aio-thinking-title').textContent = title;
    thinking.querySelector('.aio-thinking-detail').textContent = detail;
    thinking.classList.remove('is-out');
    return thinking;
  }

  function hideThinking(delay = 280) {
    if (!thinking) return;
    clearTimeout(thinkingTimer);
    const node = thinking;
    thinking = null;
    node.classList.add('is-out');

    const app = document.querySelector('.app');
    if (app) {
      if (!node._restoreInert) app.inert = false;
      if (node._restoreBusy === null) app.removeAttribute('aria-busy');
      else app.setAttribute('aria-busy', node._restoreBusy);
    }
    if (node._lastFocus && node._lastFocus.isConnected && typeof node._lastFocus.focus === 'function') {
      node._lastFocus.focus({ preventScroll: true });
    }
    window.setTimeout(() => node.remove(), delay);
  }

  function runThinking(title, detail, action, duration = 430) {
    if (reduceMotion.matches) {
      action();
      return;
    }
    showThinking(title, detail);
    thinkingTimer = window.setTimeout(() => {
      try {
        action();
      } finally {
        hideThinking();
      }
    }, duration);
  }

  function animateNumber(el, value, format) {
    if (!el) return;
    const target = Number(value) || 0;
    const previous = Number(el.dataset.fxValue);
    const from = Number.isFinite(previous) ? previous : 0;
    el.dataset.fxValue = String(target);

    if (reduceMotion.matches || from === target) {
      el.textContent = format(target);
      el.classList.remove('is-counting');
      return;
    }

    if (el._fxFrame) cancelAnimationFrame(el._fxFrame);
    const started = performance.now();
    const duration = 560;
    el.classList.add('is-counting');

    function tick(now) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(from + (target - from) * eased);
      if (progress < 1) {
        el._fxFrame = requestAnimationFrame(tick);
      } else {
        el.textContent = format(target);
        el.classList.remove('is-counting');
        el._fxFrame = 0;
      }
    }

    el._fxFrame = requestAnimationFrame(tick);
  }

  function paymentStatus(prop, key) {
    const value = state.payments[prop.id] ? state.payments[prop.id][key] : undefined;
    if (value === true) return 'paid';
    if (value === false) {
      return daysUntil(dueDate(prop, key)) < 0 ? 'unpaid' : 'pending';
    }
    return 'pending';
  }

  function togglePayment(propId, key) {
    if (!state.payments[propId]) state.payments[propId] = {};
    state.payments[propId][key] = state.payments[propId][key] !== true;
    saveState();
    renderAll();
    const selector = `[data-pay-id="${CSS.escape(propId)}"][data-pay-key="${CSS.escape(key)}"], [data-cell-id="${CSS.escape(propId)}"][data-cell-key="${CSS.escape(key)}"]`;
    const nextButton = document.querySelector(selector);
    if (nextButton) {
      nextButton.focus();
      nextButton.classList.add('is-flash');
      setTimeout(() => {
        if (nextButton.isConnected) nextButton.classList.remove('is-flash');
      }, 650);
    }
    toast(state.payments[propId][key] ? 'Canone segnato come incassato' : 'Canone segnato come non incassato');
  }

  function tagLabel(type) {
    return { contract: 'Contratto', registration: 'Registrazione', increase: 'ISTAT', rent: 'Affitto' }[type] || 'Scadenza';
  }

  function buildDeadlines() {
    const list = [];
    for (const prop of state.properties) {
      if (prop.contractEnd) {
        list.push({
          date: prop.contractEnd,
          type: 'contract',
          label: 'Fine prima scadenza contratto',
          detail: 'Valuta rinnovo, proroga e nuova registrazione.',
          prop
        });
      }
      if (prop.registrationDate) {
        list.push({
          date: prop.registrationDate,
          type: 'registration',
          label: 'Registrazione / annualità',
          detail: 'Verifica annualità, imposta e eventuale cedolare secca.',
          prop
        });
      }
      if (prop.increaseDate) {
        list.push({
          date: prop.increaseDate,
          type: 'increase',
          label: 'Adeguamento ISTAT',
          detail: 'Controlla se il contratto prevede l’aumento e applica la variazione.',
          prop
        });
      }
    }

    const keys = monthKeysBack(3);
    for (const prop of state.properties) {
      for (const key of keys) {
        if (paymentStatus(prop, key) === 'unpaid') {
          list.push({
            date: dueDate(prop, key),
            type: 'rent',
            label: `Canone di ${monthLabel(key, 'long').toLowerCase()} non incassato`,
            detail: `${fmtMoney(prop.rent)} · scadenza ${fmtDate(dueDate(prop, key))}`,
            prop
          });
        }
      }
    }

    return list
      .filter((d) => daysUntil(d.date) >= -60)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function deadlineItemHTML(d, full = false) {
    const n = daysUntil(d.date);
    const stateClass = n < 0 ? 'overdue' : n <= 30 ? 'urgent' : '';
    const relClass = n < 0 ? 'late' : n <= 30 ? 'soon' : '';
    const month = parseISO(d.date)
      .toLocaleDateString('it-IT', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
    const meta = full
      ? `${esc(d.prop.name)} · ${esc(d.prop.tenant)} · ${esc(d.detail)}`
      : `${esc(d.prop.name)} · ${esc(d.prop.tenant)}`;

    return `<div class="deadline-item ${stateClass}">
      <div class="date-chip"><strong>${Number(d.date.slice(8, 10))}</strong><small>${month}</small></div>
      <div class="deadline-main">
        <div class="deadline-title">${esc(d.label)}<span class="tag ${d.type}">${tagLabel(d.type)}</span></div>
        <div class="deadline-meta">${meta}</div>
      </div>
      <div class="deadline-rel ${relClass}">${relLabel(n)}</div>
    </div>`;
  }

  function renderChart() {
    const host = $('collectionsChart');
    if (!host) return;
    const keys = monthKeysBack(6);
    const data = keys.map((key) => {
      const paid = state.properties.filter((prop) => paymentStatus(prop, key) === 'paid');
      const total = state.properties.length;
      const amount = paid.reduce((sum, prop) => sum + Number(prop.rent || 0), 0);
      return { key, count: paid.length, total, amount };
    });
    const max = Math.max(1, ...data.map((item) => item.count));

    host.innerHTML = data.map((item, index) => {
      const height = item.total ? Math.max(5, Math.round((item.count / max) * 100)) : 5;
      const label = monthShort(item.key);
      return `<div class="chart-col">
        <span class="chart-value">${item.count}/${item.total}</span>
        <span class="chart-bar" style="--h:${height}%;--delay:${(index * 0.06).toFixed(2)}s" title="${esc(label)}: ${item.count} di ${item.total} canoni incassati · ${esc(fmtMoney(item.amount))}"></span>
        <span class="chart-label">${esc(label)}</span>
      </div>`;
    }).join('');

    host.setAttribute('aria-label', `Andamento incassi demo negli ultimi sei mesi: ${data.map((item) => `${monthShort(item.key)}, ${item.count} canoni incassati su ${item.total}`).join('; ')}.`);
  }

  function renderOverview() {
    const properties = state.properties;
    const count = properties.length;
    const monthly = properties.reduce((sum, p) => sum + Number(p.rent || 0), 0);
    const month = monthKey();
    const keys = monthKeysBack(6);

    let collected = 0;
    let expected = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    for (const prop of properties) {
      for (const key of keys) {
        expected += Number(prop.rent || 0);
        const status = paymentStatus(prop, key);
        if (status === 'paid') collected += Number(prop.rent || 0);
        if (status === 'unpaid') {
          overdueAmount += Number(prop.rent || 0);
          overdueCount++;
        }
      }
    }

    animateNumber($('kpiProperties'), count, (v) => String(Math.round(v)));
    $('kpiPropertiesSub').textContent = count === 1 ? '1 contratto attivo' : `${count} contratti attivi`;
    animateNumber($('kpiMonthly'), monthly, fmtMoney);
    $('kpiMonthlySub').textContent = `${fmtMoney(monthly * 12)} all’anno`;
    animateNumber($('kpiCollected'), collected, fmtMoney);
    const ratio = expected > 0 ? Math.round((collected / expected) * 100) : 0;
    $('kpiCollectedSub').textContent = `${ratio}% del dovuto negli ultimi 6 mesi`;
    animateNumber($('kpiOverdue'), overdueAmount, fmtMoney);
    $('kpiOverdueSub').textContent = overdueCount === 0
      ? 'Nessun canone arretrato'
      : overdueCount === 1 ? '1 canone da recuperare' : `${overdueCount} canoni da recuperare`;

    const allDeadlines = buildDeadlines();
    const attention = allDeadlines.filter((d) => daysUntil(d.date) <= 60);
    const alert = $('nextAlert');
    if (attention.length) {
      const first = attention[0];
      const n = daysUntil(first.date);
      alert.hidden = false;
      $('alertText').innerHTML = `<strong>${attention.length} ${attention.length === 1 ? 'scadenza' : 'scadenze'} da controllare.</strong> La più vicina: ${esc(first.label.toLowerCase())} — ${esc(first.prop.name)}, ${fmtDate(first.date)} (${relLabel(n)}).`;
    } else {
      alert.hidden = true;
    }

    const nextList = allDeadlines.slice(0, 4);
    $('nextDeadlines').innerHTML = nextList.length
      ? nextList.map((d) => deadlineItemHTML(d)).join('')
      : '<div class="empty">Nessuna scadenza nei prossimi mesi. Buon segno.</div>';

    const currentPayments = properties.map((p) => ({ prop: p, status: paymentStatus(p, month) }));
    const monthCollected = currentPayments
      .filter((x) => x.status === 'paid')
      .reduce((sum, x) => sum + Number(x.prop.rent || 0), 0);
    $('monthLabel').textContent = monthLabel(month, 'long');
    $('monthTotal').textContent = `${fmtMoney(monthCollected)} / ${fmtMoney(monthly)}`;

    $('monthPayments').innerHTML = currentPayments.length
      ? currentPayments.map(({ prop, status }) => {
          const cls = status === 'paid' ? 'paid' : status === 'unpaid' ? 'late' : 'pending';
          const label = status === 'paid' ? 'Incassato' : status === 'unpaid' ? `In ritardo` : 'In attesa';
          return `<div class="pay-row">
            <div class="pay-name">${esc(prop.name)}<small>${esc(prop.tenant)} · ${fmtMoney(prop.rent)}</small></div>
            <div class="pay-right">
              <span class="pill ${cls}">${label}</span>
              <button class="pay-action" type="button" data-pay-id="${esc(prop.id)}" data-pay-key="${esc(month)}">${status === 'paid' ? 'Annulla' : 'Segna incassato'}</button>
            </div>
          </div>`;
        }).join('')
      : '<div class="empty">Aggiungi un immobile per iniziare.</div>';

    renderChart();
  }

  function renderProperties() {
    if (!state.properties.length) {
      $('propertiesGrid').innerHTML = '<div class="empty">Nessun immobile inserito. Usa “Aggiungi immobile” per iniziare.</div>';
      return;
    }

    const month = monthKey();
    $('propertiesGrid').innerHTML = state.properties.map((prop) => {
      const status = paymentStatus(prop, month);
      const cls = status === 'paid' ? 'paid' : status === 'unpaid' ? 'late' : 'pending';
      const label = status === 'paid' ? 'Incassato' : status === 'unpaid' ? 'In ritardo' : 'In attesa';
      return `<article class="property-card">
        <div class="property-top">
          <div>
            <h3>${esc(prop.name)}</h3>
            <p class="property-address">${esc(prop.address || 'Indirizzo non indicato')}</p>
          </div>
          <span class="pill paid">Affittato</span>
        </div>
        <div class="rent-line"><strong>${fmtMoney(prop.rent)}</strong><span>/ mese</span></div>
        <div class="property-meta">
          <div><span>Inquilino</span><b>${esc(prop.tenant)}</b></div>
          <div><span>Scadenza canone</span><b>Giorno ${Number(prop.dueDay) || 5}</b></div>
          <div><span>Fine contratto</span><b>${fmtDate(prop.contractEnd)}</b></div>
          <div><span>Prossima registrazione</span><b>${fmtDate(prop.registrationDate)}</b></div>
          <div><span>Adeguamento ISTAT</span><b>${fmtDate(prop.increaseDate)}</b></div>
          <div><span>Deposito</span><b>${fmtMoney(prop.deposit)}</b></div>
        </div>
        <div class="property-foot">
          <span class="pill ${cls}">${monthLabel(month, 'short')}: ${label}</span>
          <button class="delete-btn" type="button" data-delete-id="${esc(prop.id)}"><svg aria-hidden="true" focusable="false"><use href="#i-trash"></use></svg>Rimuovi</button>
        </div>
      </article>`;
    }).join('');
  }

  function monthShort(key) {
    const [y, m] = key.split('-').map(Number);
    const name = new Date(y, m - 1, 1)
      .toLocaleDateString('it-IT', { month: 'short' })
      .replace('.', '');
    return `${cap(name)} ${String(y).slice(2)}`;
  }

  function renderPayments() {
    const keys = monthKeysBack(6);
    let collected = 0;
    let unpaid = 0;

    const head = `<thead><tr><th scope="col">Immobile</th>${keys.map((k) => `<th scope="col">${monthShort(k)}</th>`).join('')}</tr></thead>`;

    const body = state.properties.map((prop) => {
      const cells = keys.map((key) => {
        const status = paymentStatus(prop, key);
        const cls = status === 'paid' ? 'paid' : status === 'unpaid' ? 'unpaid' : 'pending';
        const icon = status === 'paid'
          ? '<svg aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>'
          : status === 'unpaid' ? '<svg aria-hidden="true" focusable="false"><use href="#i-alert"></use></svg>' : '–';
        if (status === 'paid') collected += Number(prop.rent || 0);
        if (status === 'unpaid') unpaid += Number(prop.rent || 0);
        const label = status === 'paid' ? 'Incassato' : status === 'unpaid' ? 'Non incassato' : 'Non ancora scaduto';
        return `<td><button class="cell-btn ${cls}" type="button" data-cell-id="${esc(prop.id)}" data-cell-key="${esc(key)}" aria-label="${esc(prop.name)} · ${monthShort(key)}: ${label}" title="${label}">${icon}</button></td>`;
      }).join('');
      return `<tr>
        <td class="pay-prop"><strong>${esc(prop.name)}</strong><small>${esc(prop.tenant)} · ${fmtMoney(prop.rent)}</small></td>
        ${cells}
      </tr>`;
    }).join('');

    $('paymentsTable').innerHTML = state.properties.length
      ? `${head}<tbody>${body}</tbody>`
      : `<tbody><tr><td colspan="${keys.length + 1}"><div class="empty">Aggiungi un immobile per vedere gli incassi.</div></td></tr></tbody>`;

    animateNumber($('periodCollected'), collected, fmtMoney);
    animateNumber($('periodUnpaid'), unpaid, fmtMoney);
  }

  function renderDeadlines() {
    const all = buildDeadlines();
    const filtered = all.filter((d) => {
      if (deadlineFilter === 'all') return true;
      return daysUntil(d.date) <= Number(deadlineFilter);
    });

    $('deadlinesList').innerHTML = filtered.length
      ? filtered.map((d) => deadlineItemHTML(d, true)).join('')
      : '<div class="empty">Nessuna scadenza in questo intervallo. Prova ad allargare il filtro.</div>';

    document.querySelectorAll('#deadlineFilters .filter').forEach((btn) => {
      const filter = btn.dataset.filter;
      const active = String(filter) === String(deadlineFilter);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function calcIstat() {
    const rent = Math.max(0, parseFloat($('istatRent').value) || 0);
    const pct = Math.max(0, parseFloat($('istatPct').value) || 0);
    const quota = parseFloat($('istatQuota').value) || 100;
    const increase = rent * (pct / 100) * (quota / 100);
    const newRent = rent + increase;

    $('istatResult').textContent = fmtMoney2(newRent);
    $('istatDetail').textContent = rent > 0
      ? `${fmtMoney2(increase)} in più al mese · ${fmtMoney(increase * 12)} in più all’anno`
      : 'Inserisci un canone per calcolare l’aumento.';
  }

  function fillReminderProperties() {
    const select = $('reminderProperty');
    const previous = select.value;
    if (!state.properties.length) {
      select.innerHTML = '<option value="">Nessun immobile</option>';
      select.disabled = true;
      $('copyReminder').disabled = true;
      return;
    }
    select.disabled = false;
    $('copyReminder').disabled = false;
    select.innerHTML = state.properties
      .map((p) => `<option value="${esc(p.id)}">${esc(p.name)} — ${esc(p.tenant)}</option>`)
      .join('');
    if (state.properties.some((p) => p.id === previous)) {
      select.value = previous;
    } else {
      const withArrears = state.properties.find((p) =>
        monthKeysBack(6).some((key) => paymentStatus(p, key) === 'unpaid')
      );
      select.value = (withArrears || state.properties[0]).id;
    }
  }

  function nextDueDateLabel(prop) {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(Number(prop.dueDay) || 5, 28));
    return fmtDate(toISO(next));
  }

  function updateReminder() {
    const select = $('reminderProperty');
    const type = $('reminderType').value;
    const prop = state.properties.find((p) => p.id === select.value);
    const textarea = $('reminderText');

    if (!prop) {
      textarea.value = 'Aggiungi un immobile per generare un promemoria.';
      $('reminderHint').textContent = 'Nessun immobile disponibile.';
      return;
    }

    const tenant = prop.tenant;
    const name = prop.name;
    const rent = fmtMoney(prop.rent);
    const signature = '\n\nGrazie,\n[Il tuo nome]\n[Telefono o email]';
    let text = '';

    if (type === 'rent') {
      const keys = monthKeysBack(6);
      const unpaidKey = [...keys].reverse().find((key) => paymentStatus(prop, key) === 'unpaid');
      if (unpaidKey) {
        const due = dueDate(prop, unpaidKey);
        text = `Gentile ${tenant},\n\nti scrivo in merito al canone di locazione dell’immobile “${name}” relativo a ${monthLabel(unpaidKey, 'long')} (${rent}), con scadenza ${fmtDate(due)}.\n\nAl momento non risulta ancora ricevuto il pagamento. Ti chiedo di verificare e, se necessario, di provvedere al bonifico sul solito IBAN.\n\nSe il pagamento è già stato effettuato, puoi ignorare questo messaggio.${signature}`;
        $('reminderHint').textContent = `Sollecito per ${monthLabel(unpaidKey, 'long')}.`;
      } else {
        text = `Gentile ${tenant},\n\nnon risultano canoni arretrati per l’immobile “${name}”. Questo è solo un promemoria: il prossimo canone di ${rent} scade il ${nextDueDateLabel(prop)}.\n\nSe hai già provveduto al pagamento, grazie.${signature}`;
        $('reminderHint').textContent = 'Nessun arretrato: promemoria per il prossimo canone.';
      }
    } else if (type === 'increase') {
      text = `Gentile ${tenant},\n\ncome previsto dal contratto di locazione dell’immobile “${name}”, dal mese di [mese/anno] il canone sarà adeguato alla variazione ISTAT del [inserisci percentuale]%, passando da ${rent} a [nuovo canone].\n\nRiceverai il dettaglio del calcolo e l’aggiornamento delle modalità di pagamento. Per qualsiasi chiarimento resto a disposizione.${signature}`;
      $('reminderHint').textContent = 'Completa percentuale, mese e nuovo canone.';
    } else {
      const end = prop.contractEnd ? fmtDate(prop.contractEnd) : '[data di scadenza]';
      text = `Gentile ${tenant},\n\nti ricordo che il contratto di locazione dell’immobile “${name}” scade il ${end}.\n\nNei prossimi giorni verificheremo insieme le opzioni di rinnovo o proroga e gli adempimenti necessari. Se hai già comunicato la tua intenzione, puoi considerare questo messaggio come conferma.${signature}`;
      $('reminderHint').textContent = 'Promemoria sulla scadenza del contratto.';
    }

    textarea.value = text;
  }

  function renderTools() {
    fillReminderProperties();
    calcIstat();
    updateReminder();
  }

  function renderAll() {
    renderOverview();
    renderProperties();
    renderPayments();
    renderDeadlines();
    renderTools();
  }

  const VIEW_TITLES = {
    overview: 'Panoramica',
    properties: 'I tuoi immobili',
    payments: 'Incassi',
    deadlines: 'Scadenze',
    tools: 'Strumenti'
  };

  const VIEW_HASH = {
    overview: '#panoramica',
    properties: '#immobili',
    payments: '#incassi',
    deadlines: '#scadenze',
    tools: '#strumenti'
  };

  const HASH_VIEW = {
    '#panoramica': 'overview',
    '#immobili': 'properties',
    '#incassi': 'payments',
    '#scadenze': 'deadlines',
    '#strumenti': 'tools'
  };

  function switchView(view, options = {}) {
    if (!VIEW_TITLES[view]) view = 'overview';
    currentView = view;

    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== view;
    });
    document.querySelectorAll('.nav-item').forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    $('viewTitle').textContent = VIEW_TITLES[view];
    document.title = `${VIEW_TITLES[view]} · Demo · Affitto in Ordine`;
    $('viewAnnouncement').textContent = `Vista: ${VIEW_TITLES[view]}.`;

    if (!options.silent) {
      try { history.replaceState(null, '', VIEW_HASH[view]); } catch (_) { /* file:// */ }
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  function openModal() {
    const form = $('propertyForm');
    lastFocused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : $('openAdd');
    form.reset();
    $('fDueDay').value = '5';
    $('fStart').value = todayISO();
    $('fEnd').value = shiftMonths(48, 28);
    $('fRegistration').value = shiftMonths(3, 15);
    $('fIncrease').value = shiftMonths(12, 10);
    $('propertyModal').hidden = false;
    const app = document.querySelector('.app');
    if (app) app.inert = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (!$('propertyModal').hidden) $('fName').focus();
    }, 40);
  }

  function closeModal() {
    const modal = $('propertyModal');
    if (modal.hidden) return;
    modal.hidden = true;
    const app = document.querySelector('.app');
    if (app) app.inert = false;
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function addProperty(event) {
    event.preventDefault();
    const name = $('fName').value.trim();
    const tenant = $('fTenant').value.trim();
    const rent = Math.max(0, parseFloat($('fRent').value) || 0);
    if (!name || !tenant || rent <= 0) {
      toast('Completa nome, inquilino e canone.');
      return;
    }

    const start = $('fStart').value || todayISO();
    const end = $('fEnd').value || shiftMonths(48, 28);
    if (end <= start) {
      toast('La fine contratto deve essere successiva all’inizio.');
      return;
    }

    const id = `p${Date.now()}`;
    state.properties.push({
      id,
      name,
      address: $('fAddress').value.trim(),
      tenant,
      rent,
      dueDay: Math.max(1, Math.min(28, parseInt($('fDueDay').value, 10) || 5)),
      contractStart: start,
      contractEnd: end,
      registrationDate: $('fRegistration').value,
      increaseDate: $('fIncrease').value,
      deposit: Math.max(0, parseFloat($('fDeposit').value) || 0),
      notes: $('fNotes').value.trim()
    });

    state.payments[id] = {};
    monthKeysBack(6).forEach((key) => { state.payments[id][key] = true; });

    saveState();
    closeModal();
    renderAll();
    switchView('properties');
    toast('Immobile aggiunto alla demo.');
  }

  function deleteProperty(id) {
    const prop = state.properties.find((p) => p.id === id);
    if (!prop) return;
    if (!window.confirm(`Rimuovere “${prop.name}” dalla demo?`)) return;
    const buttons = [...document.querySelectorAll('[data-delete-id]')];
    const removedIndex = buttons.findIndex((button) => button.dataset.deleteId === id);
    runThinking('Rimuovo l’immobile', 'Aggiorno scadenze, incassi e riepilogo.', () => {
      state.properties = state.properties.filter((p) => p.id !== id);
      delete state.payments[id];
      saveState();
      renderAll();
      const remaining = [...document.querySelectorAll('[data-delete-id]')];
      const nextButton = remaining[Math.min(removedIndex, remaining.length - 1)] || $('openAdd');
      nextButton.focus();
      toast('Immobile rimosso.');
    }, 360);
  }

  function resetDemo() {
    if (!window.confirm('Ripristinare i dati demo iniziali?')) return;
    runThinking(
      'Ripristino i dati demo',
      'Riporto l’esempio allo stato iniziale. Nessun dato lascia il browser.',
      () => {
        state = sampleState();
        saveState();
        renderAll();
        switchView('overview');
        toast('Dati demo ripristinati.');
      },
      460
    );
  }

  function exportCSV() {
    const keys = monthKeysBack(6);
    const statusLabel = { paid: 'Incassato', unpaid: 'Non incassato', pending: 'Non scaduto' };
    const rows = [
      ['Immobile', 'Inquilino', ...keys.map(monthShort)],
      ...state.properties.map((prop) => [
        prop.name,
        prop.tenant,
        ...keys.map((key) => statusLabel[paymentStatus(prop, key)])
      ])
    ];
    const cellValue = (cell) => {
      let text = String(cell);
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = '\uFEFF' + rows
      .map((row) => row.map(cellValue).join(';'))
      .join('\r\n');

    if (!reduceMotion.matches) {
      showThinking('Preparo il CSV', 'Raccolgo gli incassi degli ultimi sei mesi.');
    }

    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incassi-demo-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      if (reduceMotion.matches) {
        toast('CSV esportato.');
      } else {
        window.setTimeout(() => {
          hideThinking();
          toast('CSV esportato.');
        }, 460);
      }
    }
  }

  async function copyReminder() {
    const textarea = $('reminderText');
    try {
      await navigator.clipboard.writeText(textarea.value);
      toast('Testo copiato.');
    } catch (_) {
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        toast('Testo copiato.');
      } catch (__) {
        toast('Copia non disponibile: seleziona il testo manualmente.');
      }
    }
  }

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelectorAll('#deadlineFilters .filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      deadlineFilter = btn.dataset.filter === 'all' ? 'all' : Number(btn.dataset.filter);
      renderDeadlines();
    });
  });

  $('openAdd').addEventListener('click', openModal);
  $('openAdd2').addEventListener('click', openModal);
  $('propertyForm').addEventListener('submit', addProperty);
  $('resetDemo').addEventListener('click', resetDemo);
  $('resetDemoTop').addEventListener('click', resetDemo);
  $('exportPayments').addEventListener('click', exportCSV);
  $('copyReminder').addEventListener('click', copyReminder);
  $('istatRent').addEventListener('input', calcIstat);
  $('istatPct').addEventListener('input', calcIstat);
  $('istatQuota').addEventListener('change', calcIstat);
  $('reminderProperty').addEventListener('change', updateReminder);
  $('reminderType').addEventListener('change', updateReminder);

  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]');
    if (go) {
      switchView(go.dataset.go);
      return;
    }

    const payBtn = event.target.closest('[data-pay-id]');
    if (payBtn) {
      togglePayment(payBtn.dataset.payId, payBtn.dataset.payKey);
      return;
    }

    const cell = event.target.closest('[data-cell-id]');
    if (cell) {
      togglePayment(cell.dataset.cellId, cell.dataset.cellKey);
      return;
    }

    const del = event.target.closest('[data-delete-id]');
    if (del) {
      deleteProperty(del.dataset.deleteId);
      return;
    }

    if (event.target.closest('[data-close-modal]')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    const modal = $('propertyModal');
    if (modal.hidden) return;

    if (event.key === 'Escape') {
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el) => el.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const formattedToday = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  $('todayLabel').textContent = cap(formattedToday);

  const arrivedByRoute = (() => {
    try { return sessionStorage.getItem(ROUTE_FLAG) === '1'; } catch (_) { return false; }
  })();
  const bootStarted = performance.now();
  const showBootLoader = !arrivedByRoute && !reduceMotion.matches;
  if (showBootLoader) {
    showThinking(
      'Sto preparando la demo',
      'Date, incassi e promemoria vengono letti solo da questo browser.',
      'Demo locale'
    );
  }

  try {
    renderAll();
    switchView(HASH_VIEW[location.hash] || 'overview', { silent: true });
  } finally {
    if (showBootLoader) {
      const remaining = Math.max(0, 520 - (performance.now() - bootStarted));
      window.setTimeout(() => hideThinking(), remaining);
    }
  }
})();
