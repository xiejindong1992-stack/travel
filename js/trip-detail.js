/**
 * trip-detail.js — Enhanced trip detail with template layout
 */
const EMOJI_TD = {
  '广州':'🏙️','北京':'🏛️','上海':'🌆','武汉':'🏗️','成都':'🐼',
  '重庆':'🌉','西安':'🏯','杭州':'🌊','南京':'🏛️','昆明':'🌸',
  '厦门':'🌊','三亚':'🏖️','海口':'🌴','青岛':'⛵','大连':'⚓',
  '香港':'🌃','澳门':'🎰','台北':'🏯','高雄':'🌅',
  '曼谷':'🛕','清迈':'🏔️','甲米':'🏝️','苏梅':'🌴','普吉':'🏖️',
  '东京':'🗼','大阪':'🏯','名古屋':'🏯','首尔':'🏙️','济州':'🌋',
  '釜山':'🌊','新加坡':'🦁','巴厘岛':'🌺','科莫多':'🦎','泗水':'🌋',
  '吉隆坡':'🗼','亚庇':'🏝️','兰卡威':'🌴','河内':'🏛️','万象':'🛕',
  '揭阳':'🍵','大理':'⛰️','稻城':'🏔️','德宏':'🌴','延吉':'🏔️',
  '琼海':'🌴','珠海':'🏖️','深圳':'🌃','哈尔滨':'❄️','长春':'❄️',
  '乌鲁木齐':'🏔️','长沙':'🌶️','贵阳':'⛰️','福州':'🌊',
};

function renderTripDetail(slug) {
  const page = document.getElementById('page-trip-detail');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tl = (zh, en) => lang === 'en' && en ? en : zh;

  const trip = DataStore.getTripBySlug(slug);
  if (!trip) {
    page.innerHTML = `<div class="container" style="padding-top:60px"><div class="empty-state">
      <p>${tl('没有找到该旅行记录。', 'Trip not found.')}</p>
      <p style="margin-top:12px"><a href="#timeline" style="color:var(--accent)">${tl('← 返回时间线', '← Back')}</a></p>
    </div></div>`;
    return;
  }

  const title = tl(trip.title, trip.titleEn);
  const dests = Array.isArray(tl(trip.destinations, trip.destinationsEn))
    ? tl(trip.destinations, trip.destinationsEn) : trip.destinations;
  const country = tl(trip.country, trip.countryEn);
  const desc = tl(trip.description, trip.descriptionEn);
  const highlights = Array.isArray(tl(trip.highlights, trip.highlightsEn))
    ? tl(trip.highlights, trip.highlightsEn) : trip.highlights || [];
  const flights = DataStore.getFlightsByTrip(trip.id);
  const mainEmoji = EMOJI_TD[trip.destinations[0]] || '✈️';

  // Compute stats
  const fCount = flights.length;
  const totalKm = trip.distance || flights.reduce((s, f) => s + (f.distance || 0), 0);
  const uniqueAirlines = [...new Set(flights.map(f => f.airline))];
  const hasRealDesc = desc && !desc.startsWith('从广州出发');

  let html = '<div class="container">';

  // Back
  html += `<a href="#timeline" class="trip-detail-back" onclick="App.navigate('timeline');return false;">← ${tl('返回', 'Back')}</a>`;

  // === COVER ===
  const coverImg = trip.cover;
  if (coverImg) {
    html += `<div class="trip-detail-cover" style="background-image:url('${coverImg}');background-size:cover;background-position:center;"></div>`;
  } else {
    html += `<div class="trip-detail-cover" style="background:var(--bg-alt);flex-direction:column;gap:8px;">
      <span style="font-size:3rem;opacity:0.3">${mainEmoji}</span>
      <span style="font-size:0.8rem;color:var(--text-muted)">${tl('📷 放一张封面照片', '📷 Add a cover photo')}</span>
    </div>`;
  }

  // === HEADER ===
  html += `<div class="trip-detail-header">
    <h1>${title}</h1>
    <div class="trip-detail-meta">
      <span>📅 ${trip.dateRange.start} – ${trip.dateRange.end}</span>
      <span>📍 ${dests.join(' · ')}</span>
      ${country && country !== '中国' ? `<span>🌏 ${country}</span>` : ''}
      ${totalKm ? `<span>📏 ${totalKm.toLocaleString()} km</span>` : ''}
    </div>
  </div>`;

  // === STATS STRIP ===
  html += `<div style="display:flex;gap:24px;padding:16px 0;margin-bottom:24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);flex-wrap:wrap;">
    <div><span style="font-size:1.25rem;font-weight:300">${fCount}</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">${tl('段飞行', 'Flights')}</span></div>
    <div><span style="font-size:1.25rem;font-weight:300">${uniqueAirlines.length}</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">${tl('家航司', 'Airlines')}</span></div>
    ${totalKm ? `<div><span style="font-size:1.25rem;font-weight:300">${(totalKm/1000).toFixed(1)}k</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">${tl('公里', 'Kilometers')}</span></div>` : ''}
    <div><span style="font-size:1.25rem;font-weight:300">${trip.destinations.length}</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">${tl('到访城市', 'Cities')}</span></div>
  </div>`;

  const isTravel = trip.category === 'travel';
  const isBiz = trip.category === 'business';

  // === HIGHLIGHTS ===
  if (highlights.length > 0) {
    html += `<div class="trip-detail-highlights">`;
    for (const h of highlights) {
      const cleanLabel = h.replace(/^到访/, '');
      html += `<span class="trip-detail-highlight">${cleanLabel}</span>`;
    }
    html += `</div>`;
  }

  // === DESCRIPTION / TRAVELOGUE ===
  html += `<div class="trip-detail-section-title">${tl('游记', 'Travelogue')}</div>`;
  if (desc && !desc.startsWith('从广州出发')) {
    html += `<div class="trip-detail-description">${desc}</div>`;
  } else {
    // Template placeholder
    const zhHint = '在这里写下你的旅行故事…比如：什么季节去的、和谁一起、最难忘的瞬间是什么。';
    const enHint = 'Write your travel story here… When did you go, who was with you, what was the most memorable moment?';
    html += `<div style="background:var(--accent-light);border-radius:6px;padding:24px;margin-bottom:32px;border:1px dashed var(--accent);">
      <p style="color:var(--text-secondary);font-size:0.9rem;margin:0">
        ✏️ ${tl(zhHint, enHint)}
      </p>
    </div>`;
  }

  // === PHOTO GALLERY ===
  html += `<div class="trip-detail-section-title">${tl('照片', 'Photos')}</div>`;
  html += `<div class="trip-detail-gallery">`;

  const hasPhotos = trip.photos && trip.photos.length > 0;
  if (hasPhotos) {
    for (const photo of trip.photos.slice(0, 7)) {
      html += `<div class="gallery-item" style="background-image:url('${photo}');background-size:cover;background-position:center;"></div>`;
    }
    // Fill remaining slots with placeholders
    const remaining = 7 - trip.photos.slice(0, 7).length;
    for (let i = 0; i < remaining; i++) {
      html += `<div class="gallery-item"><span class="item-icon">📷</span></div>`;
    }
  } else {
    // Show template grid with hints
    const labels = tl(
      ['封面照片', '风景', '美食', '人物', '街景', '细节', '其他'],
      ['Cover', 'Landscape', 'Food', 'People', 'Street', 'Detail', 'More']
    );
    for (let i = 0; i < 7; i++) {
      const isFirst = i === 0;
      html += `<div class="gallery-item" style="${isFirst ? 'grid-column:span 2;grid-row:span 2' : ''}">
        <span class="item-icon" style="font-size:${isFirst ? '2rem' : '1.2rem'};opacity:0.3">📷</span>
        <span style="position:absolute;bottom:10px;left:10px;font-size:0.68rem;color:var(--text-muted);background:rgba(250,250,250,0.8);padding:2px 8px;border-radius:3px;">+ ${labels[i]}</span>
      </div>`;
    }
  }
  html += `</div>`;

  // === FLIGHTS ===
  // === Flights (helper) ===
  function renderFlightsSection() {
    if (flights.length === 0) return '';
    let h = '<div class="trip-detail-section-title">' + tl('航班', 'Flights') + '</div>';
    h += '<div class="trip-detail-flights"><div class="flights-grouped-table">';
    for (const f of flights) {
      const airline = tl(f.airline, f.airlineEn);
      const depCity = tl(f.departureCity, f.departureCityEn);
      const arrCity = tl(f.arrivalCity, f.arrivalCityEn);
      const depCode = f.departure || depCity;
      const arrCode = f.arrival || arrCity;
      h += '<div class="flight-card">';
      h += '<div class="flight-route"><span>' + depCode + '</span><span class="flight-arrow">→</span><span>' + arrCode + '</span></div>';
      h += '<div class="flight-info">';
      h += '<div class="flight-meta"><span>' + f.flightNo + '</span><span>' + airline + '</span>' + (f.aircraft ? '<span>' + f.aircraft + '</span>' : '') + '</div>';
      h += '<div class="flight-date">' + f.date + (f.depTime ? ' · ' + f.depTime + ' – ' + f.arrTime : '') + '</div>';
      h += '</div>';
      h += '<div class="flight-details">';
      h += (f.duration ? '<div>' + f.duration + '</div>' : '');
      h += (f.seat ? '<div class="flight-aircraft">' + tl('座位', 'Seat') + ' ' + f.seat + '</div>' : '');
      h += (f.distance ? '<div class="flight-aircraft">' + f.distance.toLocaleString() + ' km</div>' : '');
      h += '</div></div>';
    }
    h += '</div></div>';
    return h;
  }

  // Flights: show right after stats for travel, at bottom for business
  if (isTravel) {
    html += renderFlightsSection();
  }
  // Flights for business: show at bottom
  if (!isTravel && flights.length > 0) {
    html += renderFlightsSection();
  }

  // === Travel Notes (hidden for business trips) ===
  if (!isBiz) {
    html += '<div class="trip-detail-section-title">' + tl('攻略 / 心得', 'Notes & Tips') + '</div>';
    html += '<div class="trip-notes">';
    html += '  <div class="trip-notes-title">' + tl('旅行小贴士', 'Travel Tips') + '</div>';
    html += '  <div class="trip-notes-content" style="color:var(--text-muted);font-style:italic;">';
    html += '    ✏️ ' + tl('签证、交通、住宿、推荐餐厅、实用提醒…在这里记录你的攻略心得。', 'Visa, transport, accommodation, restaurants, tips… Write your notes here.');
    html += '  </div>';
    html += '</div>';
  }

}
