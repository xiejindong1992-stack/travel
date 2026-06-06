/**
 * flights.js — Flight log view
 * Stats dashboard + highlights + flights grouped by year.
 */
function renderFlights() {
  const page = document.getElementById('page-flights');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const allFlights = DataStore.getFlights();
  const flightsByYear = DataStore.getFlightsByYear();
  const stats = DataStore.getFlightStats();
  const years = Object.keys(flightsByYear);
  const tl = (zh, en) => (lang === 'en' && en ? en : zh);

  let html = '<div class="container">';

  // === Stats dashboard ===
  html += `<div class="flights-stats">
    <div class="flights-stat">
      <div class="flights-stat-num">${stats.total}</div>
      <div class="flights-stat-label">${tl('航班总数', 'Flights')}</div>
    </div>
    <div class="flights-stat">
      <div class="flights-stat-num">${stats.airlines}</div>
      <div class="flights-stat-label">${tl('航空公司', 'Airlines')}</div>
    </div>
    <div class="flights-stat">
      <div class="flights-stat-num">${stats.airports}</div>
      <div class="flights-stat-label">${tl('到访机场', 'Airports')}</div>
    </div>
    <div class="flights-stat">
      <div class="flights-stat-num">${(stats.distance / 1000).toFixed(0)}k</div>
      <div class="flights-stat-label">${tl('总飞行距离(km)', 'Total km')}</div>
    </div>
  </div>`;

  // === Highlights: 最常坐的航司 / 最远 / 最短 ===
  // Most flown airline
  const airlineCount = {};
  for (const f of allFlights) {
    const name = tl(f.airline, f.airlineEn);
    airlineCount[name] = (airlineCount[name] || 0) + 1;
  }
  const sortedAirlines = Object.entries(airlineCount).sort((a, b) => b[1] - a[1]);
  const topAirline = sortedAirlines[0];

  // Longest / shortest flight (by distance)
  const withDist = allFlights.filter(f => f.distance && f.distance > 0);
  let longest = null, shortest = null;
  if (withDist.length > 0) {
    withDist.sort((a, b) => b.distance - a.distance);
    longest = withDist[0];
    shortest = withDist[withDist.length - 1];
  }

  html += '<div class="flights-highlights">';

  // Card 1: Most flown airline
  if (topAirline) {
    const pct = ((topAirline[1] / stats.total) * 100).toFixed(0);
    html += `<div class="flights-highlight-card">
      <div class="flights-highlight-label">${tl('乘坐最多的航空公司', 'Most Flown')}</div>
      <div class="flights-highlight-main">${topAirline[0]}</div>
      <div class="flights-highlight-sub">${topAirline[1]} ${tl('次', 'flights')}</div>
      <div class="flights-highlight-stat">${pct}% ${tl('占比', 'of total')}</div>
    </div>`;
  }

  // Card 2: Longest flight
  if (longest) {
    const airline = tl(longest.airline, longest.airlineEn);
    const dep = longest.departureCity;
    const arr = longest.arrivalCity;
    html += `<div class="flights-highlight-card">
      <div class="flights-highlight-label">${tl('最远飞行航班', 'Longest Flight')}</div>
      <div class="flights-highlight-main">${longest.flightNo}</div>
      <div class="flights-highlight-sub">${dep} → ${arr}</div>
      <div class="flights-highlight-stat">${longest.distance.toLocaleString()} km · ${airline} · ${longest.date}</div>
    </div>`;
  }

  // Card 3: Shortest flight
  if (shortest) {
    const airline = tl(shortest.airline, shortest.airlineEn);
    const dep = shortest.departureCity;
    const arr = shortest.arrivalCity;
    html += `<div class="flights-highlight-card">
      <div class="flights-highlight-label">${tl('最短飞行航班', 'Shortest Flight')}</div>
      <div class="flights-highlight-main">${shortest.flightNo}</div>
      <div class="flights-highlight-sub">${dep} → ${arr}</div>
      <div class="flights-highlight-stat">${shortest.distance.toLocaleString()} km · ${airline} · ${shortest.date}</div>
    </div>`;
  }

  html += '</div>';

  // === Airline breakdown (top 8) ===
  html += '<div class="flights-highlight-label" style="margin-bottom:8px">' + tl('各航司飞行次数', 'Flights by Airline') + '</div>';
  html += '<div class="flights-airline-list">';
  const maxCount = sortedAirlines[0] ? sortedAirlines[0][1] : 1;
  for (const [name, count] of sortedAirlines.slice(0, 8)) {
    const barPct = (count / maxCount) * 100;
    html += `<div class="flights-airline-item">
      <span class="flights-airline-name">${name}</span>
      <div class="flights-airline-bar"><div class="flights-airline-bar-fill" style="width:${barPct}%"></div></div>
      <span class="flights-airline-count">${count}</span>
    </div>`;
  }
  html += '</div>';

  // === Flights by year ===
  if (years.length === 0) {
    html += `<div class="empty-state"><p>${tl('还没有飞行记录。', 'No flights yet.')}</p></div>`;
  } else {
    for (const year of years) {
      const flights = flightsByYear[year];
      html += `<div class="flights-year-group">`;
      html += `<div class="flights-year-label">${year} <small>${flights.length} ${tl('次航班', 'flights')}</small></div>`;
      html += `<div class="flights-grouped-table">`;
      for (const f of flights) {
        const airline = tl(f.airline, f.airlineEn);
        const depCity = tl(f.departureCity, f.departureCityEn);
        const arrCity = tl(f.arrivalCity, f.arrivalCityEn);
        const depCode = f.departure || depCity;
        const arrCode = f.arrival || arrCity;
        html += `<div class="flight-card" onclick="${f.tripId ? "App.navigate('trip/"+f.tripId+"')" : ''}" style="${f.tripId ? 'cursor:pointer' : ''}">
          <div class="flight-route"><span>${depCode}</span><span class="flight-arrow">→</span><span>${arrCode}</span></div>
          <div class="flight-info">
            <div class="flight-meta"><span>${f.flightNo}</span><span>${airline}</span>${f.aircraft ? `<span>${f.aircraft}</span>` : ''}</div>
            <div class="flight-date">${f.date}${f.depTime ? ' · ' + f.depTime + '–' + f.arrTime : ''}</div>
          </div>
          <div class="flight-details">
            ${f.duration ? `<div>${f.duration}</div>` : ''}
            ${f.seat ? `<div class="flight-aircraft">${tl('座位', 'Seat')} ${f.seat}</div>` : ''}
            ${f.distance ? `<div class="flight-aircraft">${f.distance.toLocaleString()} km</div>` : ''}
          </div>
        </div>`;
      }
      html += `</div></div>`;
    }
  }

  html += '</div>';
  page.innerHTML = html;
}
