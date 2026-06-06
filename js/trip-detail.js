/**
 * trip-detail.js — Trip detail with category-aware layout
 */
function renderTripDetail(slug) {
  const page = document.getElementById('page-trip-detail');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const tl = (zh, en) => lang === 'en' && en ? en : zh;

  const trip = DataStore.getTripBySlug(slug);
  if (!trip) {
    page.innerHTML = '<div class="container" style="padding-top:60px"><div class="empty-state"><p>' + tl('没有找到该旅行记录。', 'Trip not found.') + '</p></div></div>';
    return;
  }

  const isTravel = trip.category === 'travel';
  const isBiz = trip.category === 'business';
  const title = tl(trip.title, trip.titleEn);
  const dests = Array.isArray(tl(trip.destinations, trip.destinationsEn)) ? tl(trip.destinations, trip.destinationsEn) : trip.destinations;
  const country = tl(trip.country, trip.countryEn);
  const desc = tl(trip.description, trip.descriptionEn);
  const highlights = Array.isArray(tl(trip.highlights, trip.highlightsEn)) ? tl(trip.highlights, trip.highlightsEn) : trip.highlights || [];
  const flights = DataStore.getFlightsByTrip(trip.id);
  const totalKm = trip.distance || flights.reduce(function(s, f) { return s + (f.distance || 0); }, 0);

  var html = '<div class="container">';

  // Back
  html += '<a href="#timeline" class="trip-detail-back" onclick="App.navigate(\'timeline\');return false;">← ' + tl('返回', 'Back') + '</a>';

  // Cover
  var coverImg = trip.cover;
  if (coverImg) {
    html += '<div class="trip-detail-cover" style="background-image:url(' + coverImg + ');background-size:cover;background-position:center;"></div>';
  } else {
    html += '<div class="trip-detail-cover" style="background:var(--bg-alt);flex-direction:column;gap:8px;"><span style="font-size:3rem;opacity:0.3">✈️</span><span style="font-size:0.8rem;color:var(--text-muted)">📷 ' + tl('放一张封面照片', 'Add a cover photo') + '</span></div>';
  }

  // Header
  html += '<div class="trip-detail-header"><h1>' + title + '</h1>';
  html += '<div class="trip-detail-meta">';
  html += '<span>📅 ' + trip.dateRange.start + ' – ' + trip.dateRange.end + '</span>';
  html += '<span>📍 ' + dests.join(' · ') + '</span>';
  if (country && country !== '中国') html += '<span>🌏 ' + country + '</span>';
  if (totalKm) html += '<span>📏 ' + totalKm.toLocaleString() + ' km</span>';
  html += '</div></div>';

  // Stats strip
  html += '<div style="display:flex;gap:24px;padding:16px 0;margin-bottom:24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);flex-wrap:wrap;">';
  html += '<div><span style="font-size:1.25rem;font-weight:300">' + flights.length + '</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">' + tl('段飞行', 'Flights') + '</span></div>';
  var airlines = [];
  for (var fi = 0; fi < flights.length; fi++) { if (airlines.indexOf(flights[fi].airline) < 0) airlines.push(flights[fi].airline); }
  html += '<div><span style="font-size:1.25rem;font-weight:300">' + airlines.length + '</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">' + tl('家航司', 'Airlines') + '</span></div>';
  if (totalKm) html += '<div><span style="font-size:1.25rem;font-weight:300">' + (totalKm/1000).toFixed(1) + 'k</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">' + tl('公里', 'km') + '</span></div>';
  html += '<div><span style="font-size:1.25rem;font-weight:300">' + trip.destinations.length + '</span><br><span style="font-size:0.72rem;color:var(--text-secondary)">' + tl('到访城市', 'Cities') + '</span></div>';
  html += '</div>';

  // Flights for travel: shown right after stats
  if (isTravel && flights.length > 0) {
    html += buildFlightsHTML(flights, tl);
  }

  // Highlights
  if (highlights.length > 0) {
    html += '<div class="trip-detail-highlights">';
    for (var hi = 0; hi < highlights.length; hi++) {
      var label = highlights[hi].replace(/^到访/, '');
      html += '<span class="trip-detail-highlight">' + label + '</span>';
    }
    html += '</div>';
  }

  // Travelogue
  html += '<div class="trip-detail-section-title">' + tl('游记', 'Travelogue') + '</div>';
  if (desc && desc.indexOf('从广州出发') !== 0) {
    html += '<div class="trip-detail-description">' + desc + '</div>';
  } else {
    var hint = tl('在这里写下你的旅行故事…', 'Write your travel story here…');
    html += '<div style="background:var(--accent-light);border-radius:6px;padding:24px;margin-bottom:32px;border:1px dashed var(--accent);"><p style="color:var(--text-secondary);font-size:0.9rem;margin:0">✏️ ' + hint + '</p></div>';
  }

  // Photos
  html += '<div class="trip-detail-section-title">' + tl('照片', 'Photos') + '</div>';
  html += '<div class="trip-detail-gallery">';
  if (trip.photos && trip.photos.length > 0) {
    var maxPhotos = Math.min(trip.photos.length, 7);
    for (var pi = 0; pi < maxPhotos; pi++) {
      html += '<div class="gallery-item" style="background-image:url(' + trip.photos[pi] + ');background-size:cover;background-position:center;"></div>';
    }
    for (var pj = maxPhotos; pj < 7; pj++) {
      html += '<div class="gallery-item"><span class="item-icon">📷</span></div>';
    }
  } else {
    for (var pi2 = 0; pi2 < 7; pi2++) {
      var isFirst = pi2 === 0;
      html += '<div class="gallery-item"' + (isFirst ? ' style="grid-column:span 2;grid-row:span 2"' : '') + '>';
      html += '<span class="item-icon" style="font-size:' + (isFirst ? '2rem' : '1.2rem') + ';opacity:0.3">📷</span>';
      var label = tl(['封面照片','风景','美食','人物','街景','细节','其他'], ['Cover','Landscape','Food','People','Street','Detail','More'])[pi2];
      html += '<span style="position:absolute;bottom:10px;left:10px;font-size:0.68rem;color:var(--text-muted);background:rgba(250,250,250,0.8);padding:2px 8px;border-radius:3px;">+ ' + label + '</span>';
      html += '</div>';
    }
  }
  html += '</div>';

  // Flights for business: shown at bottom
  if (!isTravel && flights.length > 0) {
    html += buildFlightsHTML(flights, tl);
  }

  // Travel Notes (hidden for business)
  if (!isBiz) {
    html += '<div class="trip-detail-section-title">' + tl('攻略 / 心得', 'Notes & Tips') + '</div>';
    html += '<div class="trip-notes">';
    html += '<div class="trip-notes-title">' + tl('旅行小贴士', 'Travel Tips') + '</div>';
    html += '<div class="trip-notes-content" style="color:var(--text-muted);font-style:italic;">✏️ ' + tl('签证、交通、住宿、推荐餐厅、实用提醒…在这里记录你的攻略心得。', 'Visa, transport, accommodation, restaurants, tips… Write your notes here.') + '</div>';
    html += '</div>';
  }

  html += '</div>';
  page.innerHTML = html;
}

function buildFlightsHTML(flights, tl) {
  var h = '<div class="trip-detail-section-title">' + tl('航班', 'Flights') + '</div>';
  h += '<div class="trip-detail-flights"><div class="flights-grouped-table">';
  for (var fi = 0; fi < flights.length; fi++) {
    var f = flights[fi];
    var airline = tl(f.airline, f.airlineEn);
    var depCity = tl(f.departureCity, f.departureCityEn);
    var arrCity = tl(f.arrivalCity, f.arrivalCityEn);
    var depCode = f.departure || depCity;
    var arrCode = f.arrival || arrCity;
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
