function formatTime(isoString) {
  const dt = new Date(isoString);
  return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' + 
         dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function calculateArbitrage(events, selectedBooks, onlyArb, minPct, stake) {
  const results = [];
  
  for (const ev of events) {
    const best = {};
    
    for (const bk of (ev.bookmakers || [])) {
      if (selectedBooks.size === 0 || selectedBooks.has(bk.title)) {
        const market = (bk.markets || []).find(m => m.key === 'h2h');
        if (market) {
          for (const outcome of market.outcomes) {
            if (!best[outcome.name] || best[outcome.name].price < outcome.price) {
              best[outcome.name] = { price: outcome.price, bookmaker: bk.title };
            }
          }
        }
      }
    }
    
    const outcomes = Object.keys(best);
    if (outcomes.length < 2) continue;
    
    let impliedSum = 0;
    for (const outcome of outcomes) {
      impliedSum += 1 / best[outcome].price;
    }
    
    const profitPercent = (1 / impliedSum - 1) * 100;
    const isArb = profitPercent > 0;
    
    if (onlyArb && !isArb) continue;
    if (profitPercent < minPct) continue;
    
    results.push({
      event: ev,
      best: best,
      outcomes: outcomes,
      impliedSum: impliedSum,
      profitPercent: profitPercent,
      isArb: isArb
    });
  }
  
  results.sort((a, b) => b.profitPercent - a.profitPercent);
  return results;
}

function calculateStakes(arb, totalStake) {
  const stakes = {};
  for (const outcome of arb.outcomes) {
    stakes[outcome] = (totalStake / arb.impliedSum) * (1 / arb.best[outcome].price);
  }
  return stakes;
}

function calculateManualArbitrage(o1, o2, o3, stake) {
  const outcomes = [];
  if (o1 > 1) outcomes.push({ odds: o1, name: 'Outcome 1' });
  if (o2 > 1) outcomes.push({ odds: o2, name: 'Outcome 2' });
  if (o3 > 1) outcomes.push({ odds: o3, name: 'Outcome 3' });
  
  if (outcomes.length < 2) return null;
  
  let impliedSum = 0;
  for (const out of outcomes) {
    impliedSum += 1 / out.odds;
  }
  
  const profitPercent = (1 / impliedSum - 1) * 100;
  const isArb = profitPercent > 0;
  const totalReturn = stake / impliedSum;
  const profit = totalReturn - stake;
  
  const stakesArray = [];
  for (const out of outcomes) {
    const betStake = (stake / impliedSum) * (1 / out.odds);
    stakesArray.push({
      odds: out.odds,
      stake: betStake,
      return: betStake * out.odds,
      name: out.name
    });
  }
  
  return {
    isArb: isArb,
    profitPercent: profitPercent,
    totalStake: stake,
    totalReturn: totalReturn,
    profit: profit,
    stakes: stakesArray
  };
}