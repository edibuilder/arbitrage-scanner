function renderSportBar(sports, currentKey, onSportClick) {
  const container = document.getElementById('sportBar');
  
  container.innerHTML = sports.map(sport => {
    let statusDot = '';
    let statusClass = 'gray';
    
    if (sportStatusChecked) {
      if (sport.active) {
        statusClass = 'green';
        statusDot = `<span class="status-dot ${statusClass}"></span>`;
      } else {
        statusClass = 'red';
        statusDot = `<span class="status-dot ${statusClass}"></span>`;
      }
    } else {
      statusDot = `<span class="status-dot gray"></span>`;
    }
    
    const activeClass = currentKey === sport.key ? 'active' : '';
    
    return `<button class="sport-btn ${activeClass}" data-sport="${sport.key}">
      ${statusDot} ${sport.name}
    </button>`;
  }).join('');
  
  document.querySelectorAll('.sport-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sportKey = btn.dataset.sport;
      onSportClick(sportKey);
    });
  });
}

function updateSportStatusIndicator(sports) {
  const buttons = document.querySelectorAll('.sport-btn');
  buttons.forEach((btn, index) => {
    const sport = sports[index];
    if (sport && sportStatusChecked) {
      const dot = btn.querySelector('.status-dot');
      if (dot) {
        if (sport.active) {
          dot.className = 'status-dot green';
        } else {
          dot.className = 'status-dot red';
        }
      }
    }
  });
}

function renderBookmakerPanel(bookmakers, selectedBooks, onToggle, onSelectAll, onSelectNone, onPresetBg, onPresetWorld) {
  const panel = document.getElementById('bkPanel');
  const grid = document.getElementById('bkGrid');
  
  if (bookmakers.length === 0) {
    panel.style.display = 'none';
    return;
  }
  
  panel.style.display = 'block';
  
  grid.innerHTML = bookmakers.map(bk => {
    const isSelected = selectedBooks.has(bk);
    return `<div class="bk-item ${isSelected ? 'on' : ''}" data-bk="${bk.replace(/'/g, "\\'")}">
      <div class="bk-check">${isSelected ? '✓' : ''}</div>
      <span class="bk-name" title="${bk}">${bk}</span>
    </div>`;
  }).join('');
  
  document.querySelectorAll('.bk-item').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.querySelector('.bk-name').getAttribute('title') || el.querySelector('.bk-name').textContent;
      onToggle(name, el);
    });
  });
  
  document.getElementById('selectAllBtn').onclick = onSelectAll;
  document.getElementById('selectNoneBtn').onclick = onSelectNone;
  document.getElementById('presetBgBtn').onclick = onPresetBg;
  document.getElementById('presetWorldBtn').onclick = onPresetWorld;
  
  const footer = document.getElementById('bkFooter');
  footer.textContent = `${bookmakers.length} bookmakers available · ${selectedBooks.size} selected · Only selected are used for arbitrage detection`;
}

function updateBookmakerSelectionUI(bookmakers, selectedBooks) {
  const items = document.querySelectorAll('.bk-item');
  items.forEach(item => {
    const name = item.querySelector('.bk-name').getAttribute('title') || item.querySelector('.bk-name').textContent;
    const isSelected = selectedBooks.has(name);
    if (isSelected) {
      item.classList.add('on');
      item.querySelector('.bk-check').textContent = '✓';
    } else {
      item.classList.remove('on');
      item.querySelector('.bk-check').textContent = '';
    }
  });
  
  const footer = document.getElementById('bkFooter');
  const total = document.querySelectorAll('.bk-item').length;
  footer.textContent = `${total} bookmakers available · ${selectedBooks.size} selected · Only selected are used for arbitrage detection`;
}

function setStatus(message, type, showSpinner = false) {
  const container = document.getElementById('statusArea');
  let dotClass = 'status-dot-lg';
  let spinnerHtml = '';
  
  if (type === 'green') dotClass += ' green';
  else if (type === 'amber') dotClass += ' amber';
  else if (type === 'red') dotClass += ' red';
  
  if (showSpinner) {
    spinnerHtml = `<span class="spinner"></span> `;
  }
  
  container.innerHTML = `<div class="status"><div class="${dotClass}"></div>${spinnerHtml}${message}</div>`;
}

function showNoEventsMessage(sportName) {
  const container = document.getElementById('arbList');
  container.innerHTML = `<div class="info-message">
    <strong>No active events for ${sportName} at the moment</strong><br>
    This league may be out of season or there are no matches scheduled in the next 7 days.<br>
    Try selecting a different sport from the list above - look for the <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;"></span> green indicator.
  </div>`;
}

function showApiError(message) {
  const container = document.getElementById('arbList');
  container.innerHTML = `<div class="warning-message">
    <strong>API Error:</strong> ${message}<br>
    Please check your API key or try again later.
  </div>`;
}

function renderArbitrageResults(arbs, stake, minPct, totalEvents, arbsFound) {
  const container = document.getElementById('arbList');
  
  if (arbs.length === 0) {
    if (totalEvents > 0) {
      container.innerHTML = `<div class="empty">No arbitrage opportunities found with current settings<br><small>Try lowering the minimum arb % or increasing stake</small></div>`;
    } else {
      return;
    }
    return;
  }
  
  container.innerHTML = arbs.slice(0, 30).map(arb => {
    const isArb = arb.profitPercent > 0;
    const dateStr = formatTime(arb.event.commence_time);
    const stakes = calculateStakes(arb, stake);
    
    const oddsHtml = arb.outcomes.map(outcome => {
      const betStake = stakes[outcome].toFixed(0);
      return `<div class="odds-cell">
        <div class="odds-lbl">${outcome}</div>
        <div class="odds-val">${arb.best[outcome].price.toFixed(2)}</div>
        <div class="odds-book">${arb.best[outcome].bookmaker} · ${betStake} ${stake < 10 ? 'USD' : 'USD'}</div>
      </div>`;
    }).join('');
    
    const totalReturn = (stake / arb.impliedSum).toFixed(2);
    const gain = (totalReturn - stake).toFixed(2);
    
    return `<div class="arb-card ${isArb ? 'hot' : ''}">
      <div class="arb-head">
        <div>
          <div class="arb-match">${arb.event.home_team} vs ${arb.event.away_team}</div>
          <div class="arb-sub">${arb.event.sport_title} · ${dateStr}</div>
        </div>
        <span class="badge ${isArb ? 'arb' : 'no'}">${isArb ? '+' : ''}${arb.profitPercent.toFixed(2)}%</span>
      </div>
      <div class="odds-grid">${oddsHtml}</div>
      <div class="result-row">
        ${isArb ? `<span class="profit">Guaranteed profit: +${gain} ${stake < 10 ? 'USD' : 'USD'}</span>` : `<span class="no-profit">Margin: ${Math.abs(arb.profitPercent).toFixed(2)}% — not an arb</span>`}
        <span style="font-size:11px;color:#aaa;">from ${stake} ${stake < 10 ? 'USD' : 'USD'} stake</span>
      </div>
    </div>`;
  }).join('');
}

function renderManualResult(result, bookmakerNames) {
  const container = document.getElementById('manualRes');
  
  if (!result) {
    container.innerHTML = '<div class="man-res" style="color:#888;font-size:13px;">Enter at least 2 odds greater than 1.00</div>';
    return;
  }
  
  const rows = result.stakes.map((s, idx) => {
    const bookmaker = bookmakerNames[idx] || `Bookmaker ${idx + 1}`;
    return `<tr>
      <td>${bookmaker}</td>
      <td><strong>${s.odds.toFixed(2)}</strong></td>
      <td style="color:#2563eb;">${s.stake.toFixed(2)} USD</td>
      <td>${s.return.toFixed(2)} USD</td>
    </tr>`;
  }).join('');
  
  container.innerHTML = `<div class="man-res">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <span style="font-size:15px;font-weight:600;">${result.isArb ? 'Arbitrage detected' : 'No arbitrage'}</span>
      <span style="font-size:14px;font-weight:600;color:${result.isArb ? '#16a34a' : '#ef4444'};">${result.isArb ? '+' : ''}${result.profitPercent.toFixed(2)}%</span>
    </div>
    <table>
      <thead><tr><th>Bookmaker</th><th>Odds</th><th>Stake</th><th>Return</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid #eee;">
      <span style="font-size:13px;color:#666;">Total: <strong>${result.totalStake.toFixed(2)} USD</strong></span>
      <span style="font-size:13px;font-weight:600;color:${result.isArb ? '#16a34a' : '#ef4444'};">${result.isArb ? 'Profit' : 'Loss'}: ${result.isArb ? '+' : ''}${result.profit.toFixed(2)} USD</span>
    </div>
  </div>`;
}