let sportsData = [...SPORTS];
let currentEvents = [];
let currentBookmakers = [];

async function loadDemoData() {
  setStatus('Loading demo data...', 'amber', true);
  
  const demoEvents = [
    {id:'d1',sport_title:'Premier League',home_team:'Man City',away_team:'Liverpool',commence_time:new Date(Date.now()+86400000).toISOString(),bookmakers:[
      {title:'Betano',markets:[{key:'h2h',outcomes:[{name:'Man City',price:2.30},{name:'Draw',price:3.40},{name:'Liverpool',price:3.10}]}]},
      {title:'Bet365',markets:[{key:'h2h',outcomes:[{name:'Man City',price:2.20},{name:'Draw',price:3.50},{name:'Liverpool',price:3.35}]}]},
      {title:'Winbet',markets:[{key:'h2h',outcomes:[{name:'Man City',price:2.25},{name:'Draw',price:3.45},{name:'Liverpool',price:3.20}]}]}
    ]},
    {id:'d2',sport_title:'La Liga',home_team:'Real Madrid',away_team:'Barcelona',commence_time:new Date(Date.now()+172800000).toISOString(),bookmakers:[
      {title:'Betano',markets:[{key:'h2h',outcomes:[{name:'Real Madrid',price:2.05},{name:'Draw',price:3.60},{name:'Barcelona',price:3.75}]}]},
      {title:'Bet365',markets:[{key:'h2h',outcomes:[{name:'Real Madrid',price:1.95},{name:'Draw',price:3.70},{name:'Barcelona',price:4.00}]}]},
      {title:'Pinnacle',markets:[{key:'h2h',outcomes:[{name:'Real Madrid',price:2.08},{name:'Draw',price:3.65},{name:'Barcelona',price:3.80}]}]}
    ]}
  ];
  
  currentEvents = demoEvents;
  currentBookmakers = getAllBookmakersFromEvents(currentEvents);
  
  if (selectedBookmakers.size === 0) {
    selectedBookmakers = new Set(currentBookmakers);
  }
  
  renderBookmakerPanel(currentBookmakers, selectedBookmakers, toggleBookmaker, selectAllBookmakers, selectNoneBookmakers, selectPresetBg, selectPresetWorld);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  const arbCount = calculateArbitrage(currentEvents, selectedBookmakers, false, 0, stake).filter(a => a.profitPercent > 0).length;
  
  setStatus(`${currentEvents.length} events · ${arbCount} arbitrage opportunities · ${selectedBookmakers.size} bookmakers selected`, 'green');
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, arbCount);
}

async function loadRealData() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    setStatus('Enter your API key', 'red');
    return;
  }
  
  setStatus('Checking sport availability...', 'amber', true);
  
  try {
    const availableSports = await checkSportAvailability(apiKey);
    sportsData = availableSports;
    renderSportBar(sportsData, currentSport, onSportChange);
    
    const activeSports = sportsData.filter(s => s.active);
    
    if (activeSports.length === 0) {
      setStatus('No active sports found. Try the demo or check back later.', 'red');
      document.getElementById('arbList').innerHTML = `<div class="info-message">
        <strong>No active events found</strong><br>
        All selected sports leagues are currently out of season or have no matches in the next 7 days.<br>
        Click "Demo" to test the scanner with example data.
      </div>`;
      return;
    }
    
    const currentSportData = sportsData.find(s => s.key === currentSport);
    
    if (!currentSportData || !currentSportData.active) {
      const firstActive = activeSports[0];
      currentSport = firstActive.key;
      renderSportBar(sportsData, currentSport, onSportChange);
      setStatus(`${firstActive.name} has active events. Loading...`, 'amber', true);
    } else {
      setStatus(`Loading ${currentSportData.name}...`, 'amber', true);
    }
    
    const events = await fetchOddsForSport(apiKey, currentSport);
    currentEvents = events;
    
    if (currentEvents.length === 0) {
      showNoEventsMessage(sportsData.find(s => s.key === currentSport)?.name || currentSport);
      setStatus(`No events for ${currentSport}`, 'amber');
      document.getElementById('bkPanel').style.display = 'none';
      return;
    }
    
    currentBookmakers = getAllBookmakersFromEvents(currentEvents);
    
    if (selectedBookmakers.size === 0) {
      selectedBookmakers = new Set(currentBookmakers);
    } else {
      const validSelected = new Set();
      for (const bk of selectedBookmakers) {
        if (currentBookmakers.includes(bk)) validSelected.add(bk);
      }
      selectedBookmakers = validSelected;
      if (selectedBookmakers.size === 0 && currentBookmakers.length > 0) {
        selectedBookmakers = new Set(currentBookmakers.slice(0, 5));
      }
    }
    
    renderBookmakerPanel(currentBookmakers, selectedBookmakers, toggleBookmaker, selectAllBookmakers, selectNoneBookmakers, selectPresetBg, selectPresetWorld);
    
    const minPct = parseFloat(document.getElementById('minPct').value) || 0;
    const onlyArb = document.getElementById('onlyArb').checked;
    const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
    
    const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
    const arbCount = calculateArbitrage(currentEvents, selectedBookmakers, false, 0, stake).filter(a => a.profitPercent > 0).length;
    
    setStatus(`${currentEvents.length} events · ${arbCount} arbitrage opportunities · ${selectedBookmakers.size} bookmakers selected`, 'green');
    renderArbitrageResults(arbs, stake, minPct, currentEvents.length, arbCount);
    
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message}`, 'red');
    showApiError(error.message);
  }
}

function onSportChange(sportKey) {
  currentSport = sportKey;
  renderSportBar(sportsData, currentSport, onSportChange);
  
  const sportInfo = sportsData.find(s => s.key === sportKey);
  
  if (sportInfo && !sportInfo.active && sportStatusChecked) {
    setStatus(`${sportInfo.name} has no active events right now`, 'amber');
    document.getElementById('arbList').innerHTML = `<div class="info-message">
      <strong>No active events for ${sportInfo.name} at the moment</strong><br>
      ${sportInfo.key.includes('soccer') ? 'Football leagues typically run from August to May.' : ''}
      ${sportInfo.key.includes('basketball') ? 'NBA season runs from October to June.' : ''}
      ${sportInfo.key.includes('tennis') ? 'Tennis tournaments happen year-round.' : ''}
      Try selecting a sport with a <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;"></span> green indicator.
    </div>`;
    document.getElementById('bkPanel').style.display = 'none';
    return;
  }
  
  const apiKey = document.getElementById('apiKey').value.trim();
  if (apiKey && sportInfo && sportInfo.active) {
    loadRealData();
  }
}

function toggleBookmaker(name, element) {
  if (selectedBookmakers.has(name)) {
    selectedBookmakers.delete(name);
    element.classList.remove('on');
    element.querySelector('.bk-check').textContent = '';
  } else {
    selectedBookmakers.add(name);
    element.classList.add('on');
    element.querySelector('.bk-check').textContent = '✓';
  }
  
  updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function selectAllBookmakers() {
  selectedBookmakers = new Set(currentBookmakers);
  updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function selectNoneBookmakers() {
  selectedBookmakers.clear();
  updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function selectPresetBg() {
  const preset = ['Betano', 'Winbet', 'Inbet', 'Bet365', 'efbet', 'Palms Bet'];
  selectNoneBookmakers();
  
  document.querySelectorAll('.bk-item').forEach(el => {
    const name = el.querySelector('.bk-name').getAttribute('title') || el.querySelector('.bk-name').textContent;
    if (preset.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
      selectedBookmakers.add(name);
      el.classList.add('on');
      el.querySelector('.bk-check').textContent = '✓';
    }
  });
  
  if (selectedBookmakers.size === 0 && currentBookmakers.length > 0) {
    selectedBookmakers = new Set([currentBookmakers[0]]);
    updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  }
  
  updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function selectPresetWorld() {
  const preset = ['Bet365', 'Pinnacle', 'Unibet', 'Bwin', 'William Hill', 'Betfair'];
  selectNoneBookmakers();
  
  document.querySelectorAll('.bk-item').forEach(el => {
    const name = el.querySelector('.bk-name').getAttribute('title') || el.querySelector('.bk-name').textContent;
    if (preset.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
      selectedBookmakers.add(name);
      el.classList.add('on');
      el.querySelector('.bk-check').textContent = '✓';
    }
  });
  
  if (selectedBookmakers.size === 0 && currentBookmakers.length > 0) {
    selectedBookmakers = new Set([currentBookmakers[0]]);
    updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  }
  
  updateBookmakerSelectionUI(currentBookmakers, selectedBookmakers);
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function refreshDisplay() {
  if (currentEvents.length === 0) return;
  
  const minPct = parseFloat(document.getElementById('minPct').value) || 0;
  const onlyArb = document.getElementById('onlyArb').checked;
  const stake = parseFloat(document.getElementById('stakeAmt').value) || 200;
  
  const arbs = calculateArbitrage(currentEvents, selectedBookmakers, onlyArb, minPct, stake);
  renderArbitrageResults(arbs, stake, minPct, currentEvents.length, 0);
}

function updateManualCalculator() {
  const o1 = parseFloat(document.getElementById('o1').value) || 0;
  const o2 = parseFloat(document.getElementById('o2').value) || 0;
  const o3 = parseFloat(document.getElementById('o3').value) || 0;
  const n1 = document.getElementById('n1').value || 'Bookmaker 1';
  const n2 = document.getElementById('n2').value || 'Bookmaker 2';
  const n3 = document.getElementById('n3').value || 'Bookmaker 3';
  const stake = parseFloat(document.getElementById('mStake').value) || 300;
  
  const result = calculateManualArbitrage(o1, o2, o3, stake);
  const bookmakerNames = [n1, n2, n3].filter((_, idx) => {
    const odds = [o1, o2, o3][idx];
    return odds > 1;
  });
  
  renderManualResult(result, bookmakerNames);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tabName}`).classList.add('active');
      if (tabName === 'manual') updateManualCalculator();
    });
  });
}

function setupEventListeners() {
  document.getElementById('fetchBtn').addEventListener('click', () => loadRealData());
  document.getElementById('demoBtn').addEventListener('click', () => loadDemoData());
  document.getElementById('minPct').addEventListener('change', () => refreshDisplay());
  document.getElementById('stakeAmt').addEventListener('change', () => refreshDisplay());
  document.getElementById('onlyArb').addEventListener('change', () => refreshDisplay());
  
  document.getElementById('o1').addEventListener('input', () => updateManualCalculator());
  document.getElementById('o2').addEventListener('input', () => updateManualCalculator());
  document.getElementById('o3').addEventListener('input', () => updateManualCalculator());
  document.getElementById('n1').addEventListener('input', () => updateManualCalculator());
  document.getElementById('n2').addEventListener('input', () => updateManualCalculator());
  document.getElementById('n3').addEventListener('input', () => updateManualCalculator());
  document.getElementById('mStake').addEventListener('input', () => updateManualCalculator());
}

function init() {
  setupTabs();
  setupEventListeners();
  renderSportBar(sportsData, currentSport, onSportChange);
  setStatus('Ready. Enter API key and click Load events, or try Demo', 'green');
  updateManualCalculator();
}

init();