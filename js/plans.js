/**
 * plans.js — Future plans view
 * Three-column kanban: Dreaming / Planning / Booked
 */
function renderPlans() {
  const page = document.getElementById('page-plans');
  if (!page) return;
  page.classList.add('active');

  const lang = App.getLang();
  const plansByStatus = DataStore.getPlansByStatus();
  const statuses = ['dreaming', 'planning', 'booked'];

  const tl = (zh, en) => (lang === 'en' && en ? en : zh);

  const statusLabels = {
    dreaming: tl('梦想', 'Dreaming'),
    planning: tl('规划中', 'Planning'),
    booked: tl('已预订', 'Booked')
  };

  let html = '<div class="container">';
  html += `<div class="section-title">${tl('未来计划', 'Future Plans')}</div>`;
  html += '<div class="plans-board">';

  for (const status of statuses) {
    const plans = plansByStatus[status] || [];
    html += `<div class="plans-column">`;
    html += `<div class="plans-column-header" data-status="${status}">${statusLabels[status]} <span class="plans-column-count">${plans.length}</span></div>`;

    if (plans.length === 0) {
      html += `<div style="font-size:0.8rem;color:var(--text-muted);padding:16px 0;">${tl('暂无', 'None')}</div>`;
    } else {
      for (const p of plans) {
        const title = tl(p.title, p.titleEn);
        const dest = tl(p.destinations.join(' · '), p.destinationsEn.join(' · '));
        const notes = tl(p.notes, p.notesEn);
        const hasDate = p.dateRange && (p.dateRange.start || p.dateRange.end);

        html += `<div class="plan-card">`;
        html += `<div class="plan-card-title">${title}</div>`;
        html += `<div class="plan-card-dest">${dest}</div>`;
        if (hasDate) {
          const dr = p.dateRange;
          const dateStr = dr.start ? `${dr.start}${dr.end ? ` – ${dr.end}` : ''}` : dr.end || '';
          html += `<div class="plan-card-date">${dateStr}</div>`;
        }
        if (notes) {
          html += `<div class="plan-card-notes">${notes}</div>`;
        }
        html += `</div>`;
      }
    }

    html += `</div>`;
  }

  html += '</div></div>';
  page.innerHTML = html;
}
