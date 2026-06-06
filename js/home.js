/**
 * home.js — Home page view
 * Hero, stats, recent trips, quick nav.
 */
function renderHome() {
  const page = document.getElementById('page-home');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tl = (zh, en) => lang === 'en' && en ? en : zh;

  const trips = DataStore.getTrips();
  const flights = DataStore.getFlights();
  const stats = DataStore.getFlightStats();

  const countries = new Set();
  const cnMap = {
    '首尔':'韩国','济州':'韩国','釜山':'韩国',
    '东京':'日本','大阪':'日本','名古屋':'日本',
    '曼谷':'泰国','清迈':'泰国','甲米':'泰国','苏梅':'泰国',
    '新加坡':'新加坡','巴厘岛':'印尼','科莫多':'印尼','泗水':'印尼',
    '吉隆坡':'马来西亚','亚庇':'马来西亚','兰卡威':'马来西亚',
    '河内':'越南','万象':'老挝',
  };
  for (const f of flights) {
    for (const c of [f.departureCity, f.arrivalCity]) {
      if (cnMap[c]) countries.add(cnMap[c]);
    }
  }

  const recentTrips = [...trips].filter(t => !t.tags || !t.tags.includes('plan'))
    .sort((a, b) => b.dateRange.start.localeCompare(a.dateRange.start))
    .slice(0, 6);

  const years = new Set();
  flights.forEach(f => { if (f.date && f.date.length >= 4) years.add(f.date.slice(0,4)); });

  const EMOJI = {
    '东京':'🗼','大阪':'🏯','曼谷':'🛕','清迈':'🏔️','甲米':'🏝️',
    '巴厘岛':'🌺','首尔':'🏙️','香港':'🌃','澳门':'🎰','台北':'🏯',
    '北京':'🏛️','上海':'🌆','广州':'🏙️','武汉':'🏗️','成都':'🐼',
    '杭州':'🌊','南京':'🏛️','厦门':'🌊','三亚':'🏖️','昆明':'🌸',
  };
  const em = (c) => EMOJI[c] || '✈️';

  let html = '';

  // Hero
  html += '<div class="hero">';
  html += '  <div class="hero-bg"></div>';
  html += '  <div class="hero-bg-overlay"></div>';
  html += '  <div class="hero-content">';
  html += '    <span class="hero-icon">✈️</span>';
  html += '    <h1><span>Don</span> · Travel</h1>';
  html += '    <p class="tagline">' + tl('十年 · 七国 · 二十七万公里', '10 years · 7 countries · 270,000 km') + '</p>';
  html += '    <p class="subtitle">' + tl('把每一次出发都记下来', 'Every journey tells a story') + '</p>';
  html += '  </div>';
  html += '  <div class="hero-scroll">' + tl('往下看', 'Scroll') + '</div>';
  html += '</div>';

  // Stats
  html += '<div class="container">';
  html += '<div class="home-stats">';
  html += '  <div class="home-stat"><div class="home-stat-num">' + flights.length + '</div><div class="home-stat-label">' + tl('航班', 'Flights') + '</div></div>';
  html += '  <div class="home-stat"><div class="home-stat-num">' + countries.size + '</div><div class="home-stat-label">' + tl('国家和地区', 'Countries') + '</div></div>';
  html += '  <div class="home-stat"><div class="home-stat-num">' + (stats.distance / 1000).toFixed(0) + 'k</div><div class="home-stat-label">' + tl('公里', 'Kilometers') + '</div></div>';
  html += '  <div class="home-stat"><div class="home-stat-num">' + years.size + '</div><div class="home-stat-label">' + tl('飞行年', 'Years') + '</div></div>';
  html += '</div>';

  // Recent trips
  html += '<div class="home-section">';
  html += '  <div class="home-section-title">';
  html += '    ' + tl('最近旅行', 'Recent Trips');
  html += '    <a href="#timeline" class="home-section-link" onclick="App.navigate(\'timeline\');return false;">' + tl('查看全部 →', 'View all →') + '</a>';
  html += '  </div>';
  html += '  <div class="home-trips">';

  for (const t of recentTrips) {
    const title = tl(t.title, t.titleEn);
    const dests = tl(t.destinations, t.destinationsEn);
    const ds = Array.isArray(dests) ? dests.join(' · ') : dests;
    html += '    <div class="home-trip-card" onclick="App.navigate(\'trip/' + t.slug + '\')">';
    html += '      <div class="home-trip-card-img"><span class="emoji-bg">' + em(t.destinations[0] || '') + '</span></div>';
    html += '      <div class="home-trip-card-body">';
    html += '        <div class="home-trip-card-title">' + title + '</div>';
    html += '        <div class="home-trip-card-meta">' + t.dateRange.start + ' – ' + t.dateRange.end + '</div>';
    html += '        <div class="home-trip-card-dest">' + ds + '</div>';
    html += '      </div>';
    html += '    </div>';
  }

  html += '  </div>';
  html += '</div>';

  // Quick Links
  html += '<div class="home-section">';
  html += '  <div class="home-section-title">' + tl('探索', 'Explore') + '</div>';
  html += '  <div class="home-quick-links">';
  html += '    <div class="home-quick-link" onclick="App.navigate(\'timeline\')">';
  html += '      <div class="home-quick-link-icon">📅</div>';
  html += '      <div class="home-quick-link-label">' + tl('时间线', 'Timeline') + '</div>';
  html += '      <div class="home-quick-link-count">' + trips.length + ' ' + tl('趟旅行', 'trips') + '<span class="arrow">→</span></div>';
  html += '    </div>';
  html += '    <div class="home-quick-link" onclick="App.navigate(\'flights\')">';
  html += '      <div class="home-quick-link-icon">✈️</div>';
  html += '      <div class="home-quick-link-label">' + tl('飞行日志', 'Flights') + '</div>';
  html += '      <div class="home-quick-link-count">' + flights.length + ' ' + tl('条记录', 'records') + '<span class="arrow">→</span></div>';
  html += '    </div>';
  html += '    <div class="home-quick-link" onclick="App.navigate(\'map\')">';
  html += '      <div class="home-quick-link-icon">🌍</div>';
  html += '      <div class="home-quick-link-label">' + tl('足迹地图', 'Map') + '</div>';
  html += '      <div class="home-quick-link-count">' + countries.size + ' ' + tl('个国家', 'countries') + '<span class="arrow">→</span></div>';
  html += '    </div>';
  html += '  </div>';
  html += '</div>';

  html += '</div>'; // container

  page.innerHTML = html;
}
