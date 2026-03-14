/* ===================================================
   applicantDashboard.js
   Navigation and data loading for Applicant Portal
   =================================================== */

const applicantDashboard = (function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- AUTH CHECK ---------- */
  async function checkAuth() {
    if (typeof api === 'undefined') return null;
    try {
      const user = await api.getMe();
      if (!user) {
         window.location.href = 'index.html';
         return null;
      }
      return user;
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = 'index.html';
      return null;
    }
  }

  /* ---------- LOAD APPLICATION STATUS ---------- */
  async function loadStatus() {
    const container = $('#applicationStatusContent');
    if (!container) return;

    try {
      const res = await api.request('/applications/mine', { method: 'GET' });
      const apps = res.data || res || [];

      if (!Array.isArray(apps) || apps.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem;">
            <p style="color:var(--text-secondary); margin-bottom:1rem;">You haven't submitted any applications yet.</p>
            <a href="application-form.html" class="btn btn-primary">Start Application</a>
          </div>`;
        return;
      }

      const latest = apps[0]; // Assuming newest is first
      const status = latest.status || 'pending';
      const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
      const date = latest.createdAt ? new Date(latest.createdAt).toLocaleDateString() : 'N/A';

      container.innerHTML = `
        <div style="background: ${statusColor}08; border-left: 4px solid ${statusColor}; padding: 1.5rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin:0; font-size: 1.1rem; color: var(--secondary);">Application for ${latest.submissionData?.organization?.name || 'Organization'}</h4>
                    <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-secondary);">Submitted on ${date}</p>
                </div>
                <span style="background: ${statusColor}15; color: ${statusColor}; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase;">
                    ${status}
                </span>
            </div>
            <p style="margin:0; font-size: 0.95rem; line-height: 1.5;">${getStatusMessage(status)}</p>
        </div>
      `;
    } catch (err) {
      console.error('Failed to load application status:', err);
      container.innerHTML = '<p style="color: #ef4444; padding: 1rem;">Failed to load application status. Please try again later.</p>';
    }
  }

  function getStatusMessage(status) {
      switch(status) {
          case 'pending': return 'Your application is currently being reviewed by our team. This usually takes 5-7 business days.';
          case 'approved': return 'Congratulations! Your application has been approved. You should soon see your role upgraded to Member.';
          case 'rejected': return 'Unfortunately, your application was not approved at this time. Please check your email for more details.';
          default: return 'Positioned in the review queue.';
      }
  }

  /* ---------- LOAD UPCOMING EVENTS ---------- */
  async function loadEvents() {
      const container = $('#upcomingEventsList');
      if (!container) return;

      try {
          const events = await api.getEvents();
          if (!events || events.length === 0) {
              container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">No upcoming public events scheduled.</p>';
              return;
          }

          container.innerHTML = events.slice(0, 3).map(ev => `
            <div style="display:flex; align-items:center; gap:1rem; padding: 12px 0; border-bottom:1px dotted #eee;">
                <div style="background:#e0f2fe; color:#0369a1; padding: 8px; border-radius: 8px; font-weight:bold; min-width: 50px; text-align:center;">
                    ${new Date(ev.date).getDate()}<br><span style="font-size:0.7rem;">${new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div>
                    <div style="font-weight:600;">${ev.title}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${ev.location || 'Online'}</div>
                </div>
            </div>
          `).join('');
      } catch (err) {
          container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">Could not load events.</p>';
      }
  }

  /* ---------- SIDEBAR NAVIGATION ---------- */
  function initNav() {
    const navItems = $$('.admin-nav button[data-view]');
    const sections = $$('.dashboard-section');

    // Logout button
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (typeof api !== 'undefined') {
          await api.logout();
          window.location.href = 'index.html';
        }
      });
    }

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;

        // Submit Application -> redirect
        if (targetView === 'submit') {
          window.location.href = 'application-form.html';
          return;
        }

        // Update active nav
        navItems.forEach(item => item.classList.remove('active'));
        btn.classList.add('active');

        // Switch sections
        sections.forEach(sec => {
          sec.style.display = (sec.id === targetView + 'Section') ? 'block' : 'none';
        });

        // Update topbar title
        if ($('#dashboardTitle')) {
          $('#dashboardTitle').textContent = btn.dataset.title || 'Applicant Portal';
        }

        // Lazy-load
        if (targetView === 'status') loadStatus();
      });
    });
  }

  /* ---------- INIT ---------- */
  async function init() {
    initNav();
    const user = await checkAuth();
    if (!user) return;

    // Populate user data
    if ($('#dispName')) $('#dispName').textContent = user.name;
    if ($('#dispEmail')) $('#dispEmail').textContent = user.email;

    loadEvents();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', applicantDashboard.init);
