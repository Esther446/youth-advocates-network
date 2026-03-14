/* ===================================================
   memberDashboard.js
   Navigation, data loading, admin redirect
   =================================================== */

const memberDashboard = (function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- AUTH + ADMIN REDIRECT ---------- */
  async function checkAuth() {
    if (typeof api === 'undefined') return null;
    try {
      const user = await api.getMe();
      if (!user) return null;

      // Admin redirect: admins should go to admin.html, not member dashboard
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
        return null;
      }
      return user;
    } catch (err) {
      console.error('Auth check failed:', err);
      return null;
    }
  }

  /* ---------- LOAD DASHBOARD METRICS ---------- */
  async function loadMetrics(user) {
    try {
      const enrollments = await api.getMyEnrollments();
      let events = [];
      try { events = await api.getEvents(); } catch (e) { /* events endpoint may not exist */ }

      if ($('#statModules')) $('#statModules').textContent = enrollments.length || 0;
      if ($('#statAssignments')) {
        const pending = enrollments.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
        $('#statAssignments').textContent = pending;
      }
      if ($('#statEvents')) $('#statEvents').textContent = events.length || 0;
      if ($('#statCertificates')) $('#statCertificates').textContent = user.certificates?.length || 0;

      // Dashboard course preview
      loadCoursePreview(enrollments);
      // Profile view course list
      loadCourseList(enrollments);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }

  /* ---------- DASHBOARD COURSE PREVIEW ---------- */
  function loadCoursePreview(enrollments) {
    const container = $('#dashCoursePreview');
    if (!container) return;

    if (!enrollments || enrollments.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">No courses enrolled yet. Browse our <a href="index.html#capacity" style="color:var(--primary-color);">Capacity Building</a> modules.</p>';
      return;
    }

    container.innerHTML = enrollments.slice(0, 4).map(e => {
      const course = e.course;
      if (!course) return '';
      const total = course.lessons?.length || 0;
      const done = e.completedLessons?.length || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee;">
          <div>
            <div style="font-weight:600;">${course.title}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">${done}/${total} lessons</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:80px; height:6px; background:#eee; border-radius:4px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:linear-gradient(90deg,#00BCD4,#0D47A1);"></div>
            </div>
            <span style="font-size:0.8rem; font-weight:600; color:var(--secondary-color);">${pct}%</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------- PROFILE COURSE LIST ---------- */
  function loadCourseList(enrollments) {
    const container = $('#courseList');
    if (!container) return;

    if (!enrollments || enrollments.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);">No courses enrolled yet.</p>';
      return;
    }

    container.innerHTML = enrollments.map(e => {
      const course = e.course;
      if (!course) return '';
      const total = course.lessons?.length || 0;
      const done = e.completedLessons?.length || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `
        <div class="mdModuleCard" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 12px; border: 1px solid #eee;">
          <div>
            <div style="font-weight: 700; color: var(--secondary);">${course.title}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${course.category || 'Module'} • ${total} lessons</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #00B4D8;">${pct}% Done</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${done}/${total} completed</div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------- LOAD APPLICATIONS ---------- */
  async function loadApplications() {
    const container = $('#applicationsList');
    if (!container) return;

    container.innerHTML = '<p style="padding:1rem; color:var(--text-secondary);">Loading applications...</p>';
    try {
      const res = await api.request('/applications/mine', { method: 'GET' });
      const apps = res.data || res || [];

      if (!Array.isArray(apps) || apps.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem;">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">📋</div>
            <p style="color:var(--text-secondary);">You haven't submitted any applications yet.</p>
            <a href="application-form.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Submit Application</a>
          </div>`;
        return;
      }

      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="text-align:left; border-bottom:2px solid #eee;">
              <th style="padding:10px;">Organization</th>
              <th style="padding:10px;">Status</th>
              <th style="padding:10px;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map(a => {
              const orgName = a.submissionData?.organization?.name || a.organizationName || 'N/A';
              const status = a.status || 'pending';
              const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A';
              const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
              return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:12px; font-weight:500;">${orgName}</td>
                  <td style="padding:12px;">
                    <span style="background:${statusColor}15; color:${statusColor}; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">
                      ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td style="padding:12px; color:var(--text-secondary);">${date}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      console.error('Failed to load applications:', err);
      container.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📋</div>
          <p style="color:var(--text-secondary);">No applications found or unable to load.</p>
          <a href="application-form.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Submit Application</a>
        </div>`;
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

    // Topbar buttons bridge
    const topbarAppsBtn = $('#topbarAppsBtn');
    if (topbarAppsBtn) {
      topbarAppsBtn.addEventListener('click', () => {
        const appsBtn = document.querySelector('[data-view="applications"]');
        if (appsBtn) appsBtn.click();
      });
    }

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;

        // Submit Application -> redirect immediately
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

        // Update topbar title from data-title attribute
        if ($('#dashboardTitle')) {
          $('#dashboardTitle').textContent = btn.dataset.title || 'Member Dashboard';
        }

        // Lazy-load data for specific sections
        if (targetView === 'applications') {
          loadApplications();
        }
      });
    });
  }

  /* ---------- URL ROUTING ---------- */
  function checkInitialView() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'profile') {
      const profileBtn = document.querySelector('[data-view="profile"]');
      if (profileBtn) profileBtn.click();
    }
  }

  /* ---------- MODAL ---------- */
  function initModal() {
    const editBtn = $('#editProfileBtn');
    const modal = $('#editProfileModal');
    const closeBtn = $('#closeProfileModal');
    const cancelBtn = $('#cancelEdit');
    const overlay = $('#modalOverlay');

    if (!editBtn || !modal) return;

    editBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (overlay) overlay.addEventListener('click', () => modal.classList.remove('active'));

    // Form Submission
    const form = $('#editProfileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = form.querySelector('button[type="submit"]');
        const errBox = $('#editProfileError');
        const errText = $('#editProfileErrorText');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        if (errBox) errBox.style.display = 'none';

        try {
          const name = $('#editName').value;
          const bio = $('#editBio').value;

          await api.updateDetails(name, undefined, undefined, bio);
          
          // Successful update — simple page reload to refresh all data or update DOM
          window.location.reload(); 
        } catch (err) {
          console.error('Update failed:', err);
          if (errBox && errText) {
            errText.textContent = err.message || 'Update failed. Please try again.';
            errBox.style.display = 'block';
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes';
        }
      });
    }
  }

  /* ---------- INIT ---------- */
  async function init() {
    initNav();
    initModal();

    const user = await checkAuth();
    if (!user) return; // If not authed or admin-redirected, stop here

    // Populate user data into profile section
    if ($('#dispName')) $('#dispName').textContent = user.name;
    if ($('#dispEmail')) $('#dispEmail').textContent = user.email;
    if ($('#dispRole')) $('#dispRole').textContent = (user.role || 'member').charAt(0).toUpperCase() + (user.role || 'member').slice(1);
    
    if ($('#editName')) $('#editName').value = user.name || '';
    if ($('#editBio')) $('#editBio').value = user.bio || '';

    // If bio exists, maybe display it (optional: adding a bio display row if you want)
    if (user.bio) {
        // Just for reference, we can add more fields to the grid if needed
    }

    // Organization data
    if (user.organization) {
      const orgRow = $('#orgRow');
      const dispOrg = $('#dispOrg');
      if (orgRow) orgRow.style.display = 'flex';
      if (dispOrg) dispOrg.textContent = user.organization.name || user.organization;
    }

    // Load dashboard metrics
    loadMetrics(user);

    // Initial view routing
    checkInitialView();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', memberDashboard.init);
