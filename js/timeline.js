/**
 * timeline.js — Card-style timeline view
 */
function renderTimeline() {
  const page = document.getElementById('page-timeline');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tripsByYear = DataStore.getTripsByYear();
  const years = Object.keys(tripsByYear);
  const tl = (zh, en) => (lang === 'en' && en ? en : zh);

  const EMOJI = {
    '广州':'🏙️','北京':'🏛️','上海':'🌆','武汉':'🏗️','成都':'🐼',
    '重庆':'🌉','西安':'🏯','杭州':'🌊','南京':'🏛️','昆明':'🌸',
    '厦门':'🌊','三亚':'🏖️','海口':'🌴','青岛':'⛵','香港':'🌃',
    '澳门':'🎰','台北':'🏯','曼谷':'🛕','清迈':'🏔️','甲米':'🏝️',
    '苏梅':'🌴','东京':'🗼','大阪':'🏯','名古屋':'🏯','首尔':'🏙️',
    '济州':'🌋','釜山':'🌊','新加坡':'🦁','巴厘岛':'🌺','科莫多':'🦎',
    '泗水':'🌋','吉隆坡':'🗼','亚庇':'🏝️','兰卡威':'🌴',
    '河内':'🏛️','万象':'🛕','大理':'⛰️','稻城':'🏔️','揭阳':'🍵',
    '珠海':'🏖️','深圳':'🌃','哈尔滨':'❄️','长春':'❄️',
    '乌鲁木齐':'🏔️','德宏':'🌴','延吉':'🏔️','琼海':'🌴','大连':'⚓',
    '福州':'🌊','贵阳':'⛰️','长沙':'🌶️','兰州':'🍜','釜山':'🌊',
  };
  const getEmoji = (c) => EMOJI[c] || '✈️';

  let html = '<div class="container">';

  if (years.length === 0) {
    html += `<div class="empty-state"><p>${tl('还没有旅行记录。', 'No trips yet.')}</p></div>`;
  } else {
    // Year groups
    for (const year of years) {
      const trips = tripsByYear[year];
      html += `<div class="year-group">`;
      html += `<div class="year-label">${year}</div>`;
      html += `<div class="timeline-cards">`;

      for (const trip of trips) {
        const start = trip.dateRange.start;
        const end = trip.dateRange.end;
        const title = tl(trip.title, trip.titleEn);
        const dest = tl(trip.destinations, trip.destinationsEn);
        const destStr = Array.isArray(dest) ? dest.join(' · ') : dest;
        const emoji = getEmoji(trip.destinations[0] || '');
        const hls = tl(trip.highlights, trip.highlightsEn);
        const hlArr = Array.isArray(hls) ? hls : trip.highlights || [];
        const flightCount = (trip.flights || []).length;

        html += `<div class="timeline-card" onclick="App.navigate('trip/${trip.slug}')">
          <div class="timeline-card-img">
            <span>${emoji}</span>
          </div>
          <div class="timeline-card-body">
            <div class="timeline-card-date">${start} – ${end}${flightCount ? ` · ${flightCount} ${tl('段飞行', 'flights')}` : ''}</div>
            <div class="timeline-card-title">${title}</div>
            <div class="timeline-card-dest">${destStr}</div>
            ${hlArr.length > 0 ? `<div class="timeline-card-highlights">${hlArr.slice(0,3).map(h => `<span class="trip-entry-highlight">${h}</span>`).join('')}</div>` : ''}
          </div>
        </div>`;
      }

      html += `</div></div>`; // close timeline-cards & year-group
    }
  }

  html += '</div>';
  page.innerHTML = html;
}
