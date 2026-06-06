/**
 * timeline.js — Card-style timeline with yearly stats
 */
function renderTimeline() {
  const page = document.getElementById('page-timeline');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tripsByYear = DataStore.getTripsByYear();
  const years = Object.keys(tripsByYear);
  const allTrips = DataStore.getTrips();
  const allFlights = DataStore.getFlights();
  const tl = (zh, en) => (lang === 'en' && en ? en : zh);

  // CnMap for city → country
  const CNMAP = {
    '首尔':'韩国','济州':'韩国','釜山':'韩国',
    '东京':'日本','大阪':'日本','名古屋':'日本','冲绳':'日本','札幌':'日本',
    '曼谷':'泰国','清迈':'泰国','甲米':'泰国','苏梅':'泰国',
    '新加坡':'新加坡','巴厘岛':'印尼','科莫多':'印尼','泗水':'印尼',
    '吉隆坡':'马来西亚','亚庇':'马来西亚','兰卡威':'马来西亚',
    '河内':'越南','万象':'老挝',
    '香港':'中国香港','澳门':'中国澳门','台北':'中国台湾','高雄':'中国台湾',
  };

  // Compute yearly stats
  const yearStats = {};
  for (const trip of allTrips) {
    const year = trip.dateRange.start.slice(0, 4);
    if (!yearStats[year]) yearStats[year] = { countries: new Set(), cities: new Set() };
    for (const city of trip.destinations) {
      yearStats[year].cities.add(city);
      const cn = CNMAP[city];
      if (cn) yearStats[year].countries.add(cn);
      else yearStats[year].countries.add('中国');
    }
  }

  const EMOJI = {
    '东京':'🗼','大阪':'🏯','曼谷':'🛕','清迈':'🏔️','甲米':'🏝️','巴厘岛':'🌺',
    '首尔':'🏙️','香港':'🌃','澳门':'🎰','台北':'🏯','北京':'🏛️','上海':'🌆',
    '广州':'🏙️','武汉':'🏗️','成都':'🐼','杭州':'🌊','厦门':'🌊','三亚':'🏖️',
    '昆明':'🌸','青岛':'⛵','大连':'⚓','哈尔滨':'❄️','济州':'🌋','釜山':'🌊',
    '新加坡':'🦁','河内':'🏛️','万象':'🛕','大理':'⛰️','稻城':'🏔️','深圳':'🌃',
    '揭阳':'🍵','琼海':'🌴','珠海':'🏖️','长春':'❄️','乌鲁木齐':'🏔️','德宏':'🌴',
    '延吉':'🏔️','长沙':'🌶️','贵阳':'⛰️','福州':'🌊','南京':'🏛️','西安':'🏯',
    '重庆':'🌉','苏梅':'🌴','科莫多':'🦎','亚庇':'🏝️','吉隆坡':'🗼','兰卡威':'🌴',
    '名古屋':'🏯','釜山':'🌊','苏梅':'🌴',
  };
  const getEmoji = (c) => EMOJI[c] || '✈️';

  let html = '<div class="container">';

  // === YEARLY STATS ===
  html += `<div class="section-title" style="margin-top:8px">${tl('旅行时间线', 'Travel Timeline')}</div>`;

  const sortedYears = Object.keys(yearStats).sort((a, b) => b - a);
  for (const year of sortedYears) {
    const st = yearStats[year];
    const countries = [...st.countries].sort();
    const cities = [...st.cities].sort((a, b) => (CNMAP[a] || '中国').localeCompare(CNMAP[b] || '中国'));

    html += `<div class="year-group" style="margin-bottom:28px">`;
    html += `<div class="year-label" style="font-size:1.3rem;padding-left:0;margin-bottom:8px">${year}</div>`;

    // Countries row
    if (countries.length > 0) {
      html += `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;flex-wrap:wrap">`;
      html += `<span style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.04em">${tl('到访', 'Visited')}</span>`;
      html += `<span style="font-size:1rem;font-weight:450">${countries.length}</span>`;
      html += `<span style="font-size:0.72rem;color:var(--text-muted)">${tl('个国家/地区', 'countries/regions')}</span>`;
      html += `<span style="font-size:0.82rem;color:var(--text-secondary)">${countries.join(' · ')}</span>`;
      html += `</div>`;
    }

    // Cities row
    if (cities.length > 0) {
      // Show first 15 cities with emoji
      const displayCities = cities.slice(0, 15);
      const more = cities.length - 15;
      html += `<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">`;
      html += `<span style="font-size:0.72rem;color:var(--text-muted)">${tl('城市', 'Cities')}</span>`;
      html += `<span style="font-size:1rem;font-weight:450">${cities.length}</span>`;
      html += `<span style="font-size:0.72rem;color:var(--text-muted)">${tl('个', '')}</span>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:4px">`;
      for (const city of displayCities) {
        html += `<span style="font-size:0.82rem;color:var(--text-secondary)">${getEmoji(city)}${city}</span>`;
      }
      if (more > 0) html += `<span style="font-size:0.78rem;color:var(--text-muted)">+${more}</span>`;
      html += `</div></div>`;
    }

    html += `</div>`; // year-group
  }

  // === TIMELINE CARDS ===
  if (years.length === 0) {
    html += `<div class="empty-state"><p>${tl('还没有旅行记录。', 'No trips yet.')}</p></div>`;
  } else {
    // Use a <hr> to separate stats from timeline cards
    html += `<hr style="border:none;border-top:1px solid var(--border);margin:8px 0 32px">`;

    for (const year of years) {
      const trips = tripsByYear[year];
      html += `<div class="year-group">`;
      html += `<div class="year-label">${year}</div>`;
      html += `<div class="timeline-cards">`;

      for (const trip of trips) {
        const title = tl(trip.title, trip.titleEn);
        const dest = tl(trip.destinations, trip.destinationsEn);
        const destStr = Array.isArray(dest) ? dest.join(' · ') : dest;
        const emoji = getEmoji(trip.destinations[0] || '');
        const hls = tl(trip.highlights, trip.highlightsEn);
        const hlArr = Array.isArray(hls) ? hls : trip.highlights || [];
        const flightCount = (trip.flights || []).length;

        html += `<div class="timeline-card" onclick="App.navigate('trip/${trip.slug}')">
          <div class="timeline-card-img"><span>${emoji}</span></div>
          <div class="timeline-card-body">
            <div class="timeline-card-date">${trip.dateRange.start} – ${trip.dateRange.end}${flightCount ? ` · ${flightCount} ${tl('段飞行', 'flights')}` : ''}</div>
            <div class="timeline-card-title">${title}</div>
            ${trip.category ? '<div class="timeline-card-cat"><span class="trip-cat ' + trip.category + '">' + tl(trip.category === 'travel' ? '走走世界' : '出差一下', trip.category === 'travel' ? 'Travel' : 'Business') + '</span></div>' : ''}
            <div class="timeline-card-dest">${destStr}</div>
            ${hlArr.length > 0 ? `<div class="timeline-card-highlights">${hlArr.slice(0,3).map(h => `<span class="trip-entry-highlight">${h}</span>`).join('')}</div>` : ''}
          </div>
        </div>`;
      }

      html += `</div></div>`;
    }
  }

  html += '</div>';
  page.innerHTML = html;
}
