# Arbitrage Scanner

## What is this application

This application scans real-time odds from multiple bookmakers through The Odds API and automatically identifies arbitrage opportunities (surebets) in sports betting. An arbitrage opportunity exists when the sum of inverted odds for all possible outcomes of an event is less than 1.00, guaranteeing a profit regardless of the result.

## How it works

The application fetches odds for selected sports leagues from The Odds API. It then analyzes all available bookmakers, finds the highest odds for each outcome from different bookmakers, and calculates whether an arbitrage situation exists. When found, it shows exactly how much to stake on each outcome to guarantee a profit.

## Technology stack

- HTML5 for structure
- CSS3 for styling with CSS Grid and Flexbox
- Vanilla JavaScript (ES6+) for all logic
- The Odds API for real-time sports odds data
- No external frameworks or libraries

## Features

- Real-time odds fetching from 40+ bookmakers
- Multiple sports leagues including Premier League, La Liga, Bundesliga, Serie A, Ligue 1, NBA, and Tennis
- Visual indicators showing which sports have active events
- Filter by minimum arbitrage percentage
- Adjustable stake amount
- Manual calculator for testing custom odds combinations
- Demo mode for testing without an API key

## How to use

1. Get a free API key from the-odds-api.com by registering an account
2. Enter the API key in the input field
3. Click "Load events" to fetch available matches
4. Select the bookmakers you have accounts with
5. Adjust the minimum arbitrage percentage and stake amount as needed
6. Review the detected arbitrage opportunities
7. Place bets simultaneously on all outcomes using the suggested stake amounts

## Understanding the results

Each arbitrage card shows:
- The match and start time
- The best odds for each outcome and which bookmaker offers them
- The exact amount to stake on each outcome based on your total stake
- The guaranteed profit amount

Green bordered cards indicate active arbitrage opportunities with positive guaranteed profit.

## Demo mode

If you do not have an API key or want to test the application first, click the "Demo" button. This loads example data showing how the scanner works without making real API calls.

## Manual calculator

The manual calculator tab allows you to test custom odds combinations. Enter up to three odds with their respective bookmakers and a total stake. The calculator will show if an arbitrage exists and how to distribute the stake.

## Limitations

- The Odds API free tier allows 500 requests per month
- Only events starting within the next 7 days are returned
- Some sports leagues have seasonal schedules and may show no events during off-seasons
- The application only uses the h2h (head-to-head/moneyline) market

## File structure

- index.html - Main application structure
- style.css - All styling rules
- utils.js - Helper functions for calculations and formatting
- api.js - API integration and sport management
- ui.js - User interface rendering and updates
- app.js - Main application logic and event handling

## Installation

Simply download all files to the same folder and open index.html in a modern web browser. No server or build process required.

## Notes

Bookmakers may limit or close accounts that regularly use arbitrage betting. Act quickly when opportunities appear as odds change frequently and arbitrage windows are short.

## License
Free for personal use.