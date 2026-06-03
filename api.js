const SPORTS = [
  { key: 'soccer_epl', name: ' Premier League', active: false, checked: false },
  { key: 'soccer_spain_la_liga', name: ' La Liga', active: false, checked: false },
  { key: 'soccer_germany_bundesliga', name: ' Bundesliga', active: false, checked: false },
  { key: 'soccer_italy_serie_a', name: ' Serie A', active: false, checked: false },
  { key: 'soccer_france_ligue_one', name: ' Ligue 1', active: false, checked: false },
  { key: 'basketball_nba', name: ' NBA', active: false, checked: false },
  { key: 'tennis_atp_french_open', name: ' Tennis (French Open)', active: false, checked: false }
];

let currentSport = 'tennis_atp_french_open';
let allEvents = [];
let selectedBookmakers = new Set();
let sportStatusChecked = false;

async function checkSportAvailability(apiKey) {
  const results = [];
  
  for (const sport of SPORTS) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const response = await fetch(url);
      
      if (!response.ok) {
        sport.active = false;
        results.push({ ...sport, active: false, error: response.status });
        continue;
      }
      
      const data = await response.json();
      sport.active = data && data.length > 0;
      results.push({ ...sport, active: sport.active, eventCount: data ? data.length : 0 });
      
    } catch (error) {
      sport.active = false;
      results.push({ ...sport, active: false, error: error.message });
    }
  }
  
  sportStatusChecked = true;
  return results;
}

async function fetchOddsForSport(apiKey, sportKey) {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

function getAllBookmakersFromEvents(events) {
  const bookmakers = new Set();
  for (const event of events) {
    for (const bk of (event.bookmakers || [])) {
      bookmakers.add(bk.title);
    }
  }
  return Array.from(bookmakers).sort();
}