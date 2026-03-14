// /assets/JS/adminDashboard.js

const $ = (id) => document.getElementById(id);

const LS_KEYS = {
  AUTH: "yan_auth",
  APPS: "yan_applications",
  COURSES: "yan_courses",
  ASSIGNMENTS: "yan_assignments",
  OPPS: "yan_opportunities",
  EVENTS: "yan_events",
};

const state = {
  view: "applications",
  search: "",
  activeAppId: null, // currently opened application
};

function safeJSONParse(value, fallback) {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
}
function loadList(key) { return safeJSONParse(localStorage.getItem(key), []); }
function saveList(key, list) { localStorage.setItem(key, JSON.stringify(list)); }
function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function normalizeStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "submitted" || v === "screening" || v === "under_review") return "pending";
  if (v === "approved" || v === "accepted") return "accepted";
  return v;
}

async function requireAdmin() {
  if (typeof api === 'undefined') return;
  
  try {
    const user = await api.getMe();
    if (!user || user.role !== "admin") {
      window.location.href = "index.html";
      return;
    }
    $("adminRoleChip").textContent = user.role.toUpperCase();
  } catch (e) {
    window.location.href = "index.html";
  }
}

function setYear() {
  $("year").textContent = new Date().getFullYear();
}

/* ===== Sidebar mobile toggle ===== */
function initSidebarToggle() {
  const sidebar = $("adminSidebar");
  const overlay = $("sidebarOverlay");
  const menuBtn = $("menuBtn");

  function open() { sidebar.classList.add("open"); overlay.classList.add("active"); }
  function close() { sidebar.classList.remove("open"); overlay.classList.remove("active"); }

  menuBtn.addEventListener("click", open);
  overlay.addEventListener("click", close);
  document.querySelectorAll(".admin-nav button").forEach(btn => btn.addEventListener("click", close));
}

/* ===== Views ===== */
const VIEW_META = {
  applications: {
    title: "Applications",
    subtitle: "Review, accept, or reject membership applications.",
    primary: "", // Removed as it was only for demo seeds
    onPrimary: () => {},
  },
  courses: { title: "Courses", subtitle: "Manage training modules that members will see.", primary: "+ New Course",
    onPrimary: () => { resetCourseForm(); $("courseTitle").focus(); } },
  assignments: { title: "Assignments", subtitle: "Create assignments linked to courses for members.", primary: "+ New Assignment",
    onPrimary: () => { resetAssignmentForm(); $("assignmentTitle").focus(); } },
  opportunities: { title: "Opportunities", subtitle: "Add funding, training, and partnership opportunities.", primary: "+ New Opportunity",
    onPrimary: () => { resetOppForm(); $("oppTitle").focus(); } },
  events: { title: "Events", subtitle: "Add upcoming events for members and partners.", primary: "+ New Event",
    onPrimary: () => { resetEventForm(); $("eventTitle").focus(); } },
  profile: { title: "My Profile", subtitle: "Manage your administrator account.", primary: "Update Profile",
    onPrimary: () => { openAdminProfileModal(); } },
};

function switchView(view) {
  state.view = view;

  document.querySelectorAll(".admin-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.view === view);
  });

  const map = {
    applications: "view-applications",
    courses: "view-courses",
    assignments: "view-assignments",
    opportunities: "view-opportunities",
    events: "view-events",
    profile: "view-profile",
  };

  Object.values(map).forEach(id => $(id).style.display = "none");
  $(map[view]).style.display = "block";

  $("pageTitle").textContent = VIEW_META[view].title;
  $("primaryActionBtn").textContent = VIEW_META[view].primary;

  $("globalSearch").value = "";
  state.search = "";

  renderAll();
}

/* ===== Stats ===== */
function updateStats(apiStats) {
  if (apiStats) {
    // If stats are provided from the API (nested structure)
    if ($("statPending")) $("statPending").textContent = apiStats.pendingApplications ?? 0;
    if ($("statAccepted")) $("statAccepted").textContent = apiStats.organizations?.active ?? 0;
    if ($("statOpps")) $("statOpps").textContent = apiStats.opportunities?.total ?? 0;
    // Courses count comes from LMS analytics usually, updated in renderAll
    return;
  }

  // Fallback to localStorage sync
  const apps = loadList(LS_KEYS.APPS).map(a => ({...a, status: normalizeStatus(a.status)}));
  const courses = loadList(LS_KEYS.COURSES);
  const opps = loadList(LS_KEYS.OPPS);

  if ($("statPending")) $("statPending").textContent = apps.filter(a => a.status === "pending").length;
  if ($("statAccepted")) $("statAccepted").textContent = apps.filter(a => a.status === "accepted").length;
  if ($("statCourses")) $("statCourses").textContent = courses.length;
  if ($("statOpps")) $("statOpps").textContent = opps.length;
}

/* ===== Applications ===== */
function badge(status) {
  if (status === "accepted" || status === "approved") return `<span class="badge b-accepted">Accepted</span>`;
  if (status === "rejected") return `<span class="badge b-rejected">Rejected</span>`;
  return `<span class="badge b-pending">Pending</span>`;
}

function renderApplications() {
  const tbody = $("applicationsTbody");
  const empty = $("applicationsEmpty");

  const filter = $("appStatusFilter").value; // all/pending/accepted/rejected
  let apps = loadList(LS_KEYS.APPS).map(a => ({...a, status: normalizeStatus(a.status)}));

  if (filter !== "all") apps = apps.filter(a => a.status === filter);

  if (state.search) {
    const q = state.search.toLowerCase();
    apps = apps.filter(a => {
      const data = a.submissionData || {};
      return (data.fullName || data.repFullName || a.applicant?.name || "").toLowerCase().includes(q) ||
        (a.applicant?.email || data.email || data.repEmail || "").toLowerCase().includes(q) ||
        (data.organization || data.orgLegalName || "").toLowerCase().includes(q);
    });
  }

  apps.sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  tbody.innerHTML = "";

  if (!apps.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const a of apps) {
    const canAct = a.status === "pending";
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>
          <div style="font-weight:900; color: var(--secondary);">${escapeHTML(a.submissionData?.fullName || a.submissionData?.repFullName || a.applicant?.name || "Unknown")}</div>
          <div class="muted">${escapeHTML(a.applicant?.email || a.submissionData?.email || a.submissionData?.repEmail || "")}</div>
        </td>
        <td>${badge(a.status)}</td>
        <td>${escapeHTML(a.submissionData?.organization?.name || a.submissionData?.organization || a.submissionData?.orgLegalName || "-")}</td>
        <td class="muted">${escapeHTML(formatDate(a.submittedAt || a.createdAt))}</td>
        <td>
          <div class="actions" style="margin:0;">
            <button class="btn-sm btn-soft" data-act="view" data-id="${a.id}">View</button>
            <button class="btn-sm btn-primary-sm" data-act="accept" data-id="${a.id}" ${canAct ? "" : "disabled"}>Accept</button>
            <button class="btn-sm btn-danger-sm" data-act="reject" data-id="${a.id}" ${canAct ? "" : "disabled"}>Reject</button>
          </div>
        </td>
      </tr>
    `);
  }

  tbody.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      if (act === "view") viewApplication(id);
      if (act === "accept") acceptApplication(id);
      if (act === "reject") openRejectModal(id);
    });
  });
}

async function acceptApplication(id) {
  if (!confirm("Accept this application? This will create a member account and notify the applicant.")) return;
  try {
    await api.updateApplicationStatus(id, "approved");
    renderAll();
  } catch (err) {
    console.error("Accept failed:", err);
    alert(err.message);
  }
}

function openRejectModal(id) {
  $("rejectAppId").value = id;
  $("rejectMessage").value = "";
  $("rejectModal").classList.add("active");
}
function closeRejectModal() {
  $("rejectModal").classList.remove("active");
}

/* ===== View Modal (fixed IDs) ===== */
function openViewModal() {
  $("viewApplicationModal").classList.add("active");
}
function closeViewModal() {
  $("viewApplicationModal").classList.remove("active");
  state.activeAppId = null;
}

function renderFileLinks(files) {
  if (!files || !Object.keys(files).length) return "<p class='muted'>No files uploaded.</p>";

  let html = "";
  for (const key of Object.keys(files)) {
    const list = files[key] || [];
    if (!list.length) continue;

    html += `<div style="margin:10px 0;"><strong>${escapeHTML(key)}</strong></div>`;

    for (const file of list) {
      const name = escapeHTML(file.name || "file");
      const size = file.size ? ` (${Math.round(file.size / 1024)} KB)` : "";
      // if dataUrl exists we can download/open, else show metadata-only note
      if (file.dataUrl) {
        html += `
          <div style="margin-bottom:6px;">
            📎 <a href="${file.dataUrl}" download="${name}" target="_blank">${name}</a>${escapeHTML(size)}
          </div>
        `;
      } else {
        html += `
          <div class="muted" style="margin-bottom:6px;">
            📄 ${name}${escapeHTML(size)} — (metadata only, will be downloadable after backend upload)
          </div>
        `;
      }
    }
  }
  return html || "<p class='muted'>No files uploaded.</p>";
}

function renderParagraphs(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return `<p class="muted">-</p>`;

  return raw
  .split(/\n\s*\n+/)
  .map(p => `<p>${escapeHTML(p).replace(/\n/g, "<br>")}</p>`)
  .join("");
}

function viewApplication(id) {
  const apps = loadList(LS_KEYS.APPS);
  const app = apps.find(a => a.id === id);
  if (!app) return;

  state.activeAppId = id;

  const data = app.submissionData || app.data || {};
  const files = app.documents || app.files || [];

  const html = `
    <h3 style="margin-top:0;">Organization Information</h3>
    <p><strong>Legal Name:</strong> ${escapeHTML(data.orgLegalName || "")}</p>
    <p><strong>Acronym:</strong> ${escapeHTML(data.orgAcronym || "")}</p>
    <p><strong>Year Established:</strong> ${escapeHTML(data.yearEstablished || "")}</p>
    <p><strong>Type:</strong> ${escapeHTML(data.orgType || "")}</p>
    <p><strong>HQ Address:</strong> ${escapeHTML(data.hqAddress || "")}</p>
    <p><strong>Org Email:</strong> ${escapeHTML(data.orgEmail || "")}</p>
    <p><strong>Org Phone:</strong> ${escapeHTML(data.orgPhone || "")}</p>
    <p><strong>Website:</strong> ${escapeHTML(data.orgWebsite || "")}</p>
    <p><strong>Socials:</strong> ${escapeHTML(data.orgSocials || "")}</p>
    <p><strong>Geo Focus:</strong> ${escapeHTML(data.geoFocus || "")}</p>

    <h3>Mission & Vision</h3>

    <h4 style="margin:10px 0 6px;">Mission</h4>
    <div class="longtext">${renderParagraphs(data.missionStatement)}</div>

    <h4 style="margin:10px 0 6px;">Vision</h4>
    <div class="longtext">${renderParagraphs(data.visionStatement)}</div>
    
    <h4 style="margin:10px 0 6px;">Core Values</h4>
    <div class="longtext">${renderParagraphs(data.coreValues)}</div>
    
    <h4 style="margin:10px 0 6px;">Key Projects</h4>
    <div class="longtext">${renderParagraphs(data.keyProjects)}</div>

    <div>
    <h3>Representative Information</h3>
    <p><strong>Name:</strong> ${escapeHTML(data.repFullName || "")}</p>
    <p><strong>Role:</strong> ${escapeHTML(data.repRole || "")}</p>
    <p><strong>Email:</strong> ${escapeHTML(data.repEmail || "")}</p>
    <p><strong>Phone:</strong> ${escapeHTML(data.repPhone || "")}</p>
    <p><strong>DOB:</strong> ${escapeHTML(data.repDob || "")}</p>
    <p><strong>Gender:</strong> ${escapeHTML(data.repGender || "")}</p>
    </div>

    <h3>Alignment & Engagement</h3>
    <h4 style="margin:10px 0 6px;">Mission Alignment</h4>
    <div class="longtext">${renderParagraphs(data.missionAlignment)}</div>
    
    <h4 style="margin:10px 0 6px;">Ethics</h4>
    <div class="longtext">${renderParagraphs(data.valuesEthics)}</div>
    
    <h4 style="margin:10px 0 6px;">Community Engagement</h4>
    <div class="longtext">${renderParagraphs(data.communityEngagement)}</div>
    
    <h4 style="margin:10px 0 6px;">Skills Contribution</h4>
    <div class="longtext">${renderParagraphs(data.skillsContribution)}</div>

    <h3>Commitment</h3>
    <h4 style="margin:10px 0 6px;">Learn/Grow</h4>
    <div class="longtext">${renderParagraphs(data.learnGrow)}</div>
    
    <h4 style="margin:10px 0 6px;">Participation Plan</h4>
    <div class="longtext">${renderParagraphs(data.participationPlan)}</div>
    
    <h4 style="margin:10px 0 6px;">Key Projects</h4>
    <div class="longtext">${renderParagraphs(data.keyProjects)}</div>
    <p><strong>Confirmed Participation:</strong> ${data.confirmParticipation ? "Yes" : "No"}</p>
    <p><strong>Declaration:</strong> ${data.declaration ? "Yes" : "No"}</p>

    <h3>Uploaded Documents</h3>
    ${renderFileLinks(files)}

    ${app.note ? `<p class="muted" style="margin-top:12px;">${escapeHTML(app.note)}</p>` : ""}
  `;

  $("applicationDetailsBody").innerHTML = html;
  openViewModal();
}

async function rejectApplicationWithEmail(id, message) {
  try {
    await api.updateApplicationStatus(id, "rejected", message);
    // Note: We don't have a backend endpoint specifically for rejection messages yet,
    // so we'll just open the email for the admin as before.
    
    // Still used for temporary cache if needed, but we should fetch again
    await renderAll(); // Refresh list from server

    // Find the app in the rendered list or fetch it specifically if needed
    // For now, let's just use the email link logic
    const datasets = await api.getAdminRecentApplications();
    const app = datasets.find(a => (a._id || a.id) === id);

    if (app) {
      const email = app.email || app.repEmail || "";
      const name = app.fullName || app.repFullName || "Applicant";
      const subject = "YAN Membership Application Update";
      const body = `Hello ${name},\n\nThank you for applying to YAN Rwanda. Unfortunately, your application was not successful.\n\nReason:\n${message || "(No reason provided)"}\n\nKind regards,\nYAN Admin Team`;

      if (email) {
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      }
    }
  } catch (err) {
    console.error("Reject failed:", err);
    alert(err.message);
  }

  closeRejectModal();
}

/* ===== Courses ===== */
function resetCourseForm() {
  $("courseId").value = "";
  $("courseTitle").value = "";
  $("courseQuarter").value = "Q1";
  $("courseDesc").value = "";
}

async function renderCourses() {
  const tbody = $("coursesTbody");
  const empty = $("coursesEmpty");
  tbody.innerHTML = "";

  try {
    const courses = await api.getCourses();
    if (!courses.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    for (const c of courses) {
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td style="font-weight:800;">${escapeHTML(c.title)}</td>
          <td>${escapeHTML(c.quarter || "-")}</td>
          <td>
            <div class="actions" style="margin:0;">
              <button class="btn-sm btn-soft" onclick="editCourse('${c._id || c.id}')">Edit</button>
              <button class="btn-sm btn-danger-sm" onclick="deleteCourse('${c._id || c.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `);
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Failed to load courses.</td></tr>`;
  }
}

async function editCourse(id) {
  try {
    const course = await api.getCourse(id);
    if (!course) return;
    $("courseId").value = course._id || course.id;
    $("courseTitle").value = course.title || "";
    $("courseQuarter").value = course.quarter || "Q1";
    $("courseDesc").value = course.description || "";
  } catch (err) { console.error("Failed to load course:", err); }
}

async function deleteCourse(id) {
  if (!confirm("Delete this course?")) return;
  try {
    await api.request(`/courses/${id}`, { method: "DELETE" });
    renderAll();
  } catch (err) { console.error("Failed to delete course:", err); }
}

/* ===== Assignments ===== */
function resetAssignmentForm() {
  $("assignmentId").value = "";
  $("assignmentTitle").value = "";
  $("assignmentDue").value = "";
  $("assignmentDesc").value = "";
}

async function populateAssignmentCourseDropdown() {
  const select = $("assignmentCourse");
  select.innerHTML = "";
  try {
    const courses = await api.getCourses();
    if (!courses.length) {
      select.innerHTML = '<option value="">No courses available</option>';
      return;
    }
    for (const c of courses) {
      select.insertAdjacentHTML("beforeend", `<option value="${c._id || c.id}">${escapeHTML(c.title)}</option>`);
    }
  } catch { select.innerHTML = '<option value="">Failed to load courses</option>'; }
}

function renderAssignments() {
  const tbody = $("assignmentsTbody");
  const empty = $("assignmentsEmpty");
  tbody.innerHTML = "";

  const assignments = loadList(LS_KEYS.ASSIGNMENTS);
  const courses = loadList(LS_KEYS.COURSES);

  if (!assignments.length) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  for (const a of assignments) {
    const course = courses.find(c => (c._id || c.id) === a.courseId);
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td style="font-weight:800;">${escapeHTML(a.title)}</td>
        <td>${escapeHTML(course?.title || a.courseId || "-")}</td>
        <td class="muted">${escapeHTML(formatDate(a.dueDate))}</td>
        <td>
          <div class="actions" style="margin:0;">
            <button class="btn-sm btn-danger-sm" onclick="deleteAssignment('${a.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `);
  }

  populateAssignmentCourseDropdown();
}

function deleteAssignment(id) {
  if (!confirm("Delete this assignment?")) return;
  saveList(LS_KEYS.ASSIGNMENTS, loadList(LS_KEYS.ASSIGNMENTS).filter(a => a.id !== id));
  renderAll();
}

/* ===== Opportunities ===== */
function resetOppForm() {
  $("oppId").value = "";
  $("oppTitle").value = "";
  $("oppType").value = "funding";
  $("oppLink").value = "";
  $("oppDesc").value = "";
}

async function renderOpps() {
  const tbody = $("oppsTbody");
  const empty = $("oppsEmpty");
  tbody.innerHTML = "";

  try {
    const opps = await api.getOpportunities();
    if (!opps.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    for (const o of opps) {
      const typeBadge = {
        funding: '<span class="badge b-accepted">Funding</span>',
        training: '<span class="badge b-pending">Training</span>',
        partnership: '<span class="badge" style="background:rgba(99,102,241,.12);color:#4338ca;border-color:rgba(99,102,241,.25);">Partnership</span>'
      };
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td style="font-weight:800;">${escapeHTML(o.title)}</td>
          <td>${typeBadge[o.type] || escapeHTML(o.type || "-")}</td>
          <td>
            <div class="actions" style="margin:0;">
              <button class="btn-sm btn-danger-sm" onclick="deleteOpp('${o._id || o.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `);
    }
  } catch (err) {
    console.error("Failed to load opportunities:", err);
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Failed to load opportunities.</td></tr>`;
  }
}

async function deleteOpp(id) {
  if (!confirm("Delete this opportunity?")) return;
  try {
    await api.request(`/opportunities/${id}`, { method: "DELETE" });
    renderAll();
  } catch (err) { console.error("Failed to delete opportunity:", err); }
}

/* ===== Events ===== */
function resetEventForm() {
  $("eventId").value = "";
  $("eventTitle").value = "";
  $("eventDate").value = "";
  $("eventLocation").value = "";
  $("eventDesc").value = "";
}

async function renderEvents() {
  const tbody = $("eventsTbody");
  const empty = $("eventsEmpty");
  tbody.innerHTML = "";

  try {
    const events = await api.getEvents();
    if (!events.length) { empty.style.display = "block"; return; }
    empty.style.display = "none";

    for (const e of events) {
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td style="font-weight:800;">${escapeHTML(e.title)}</td>
          <td class="muted">${escapeHTML(formatDate(e.date))}</td>
          <td>
            <div class="actions" style="margin:0;">
              <button class="btn-sm btn-danger-sm" onclick="deleteEvent('${e._id || e.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `);
    }
  } catch (err) {
    console.error("Failed to load events:", err);
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Failed to load events.</td></tr>`;
  }
}

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  try {
    await api.request(`/events/${id}`, { method: "DELETE" });
    renderAll();
  } catch (err) { console.error("Failed to delete event:", err); }
}

/* ===== Save Handlers ===== */
async function saveCourse() {
  const id = $("courseId").value;
  const data = {
    title: $("courseTitle").value.trim(),
    quarter: $("courseQuarter").value,
    description: $("courseDesc").value.trim(),
  };
  if (!data.title) return alert("Course title is required.");

  try {
    if (id) {
      await api.request(`/courses/${id}`, { method: "PUT", body: data });
    } else {
      await api.request('/courses', { method: "POST", body: data });
    }
    resetCourseForm();
    renderAll();
  } catch (err) { console.error("Save course failed:", err); alert(err.message); }
}

function saveAssignment() {
  const id = $("assignmentId").value;
  const data = {
    id: id || uid("asgn"),
    courseId: $("assignmentCourse").value,
    title: $("assignmentTitle").value.trim(),
    dueDate: $("assignmentDue").value,
    description: $("assignmentDesc").value.trim(),
  };
  if (!data.title) return alert("Assignment title is required.");

  const list = loadList(LS_KEYS.ASSIGNMENTS);
  const idx = list.findIndex(a => a.id === data.id);
  if (idx >= 0) list[idx] = data; else list.push(data);
  saveList(LS_KEYS.ASSIGNMENTS, list);
  resetAssignmentForm();
  renderAll();
}

async function saveOpp() {
  const id = $("oppId").value;
  const data = {
    title: $("oppTitle").value.trim(),
    type: $("oppType").value,
    link: $("oppLink").value.trim(),
    description: $("oppDesc").value.trim(),
  };
  if (!data.title) return alert("Opportunity title is required.");

  try {
    if (id) {
      await api.request(`/opportunities/${id}`, { method: "PUT", body: data });
    } else {
      await api.request('/opportunities', { method: "POST", body: data });
    }
    resetOppForm();
    renderAll();
  } catch (err) { console.error("Save opportunity failed:", err); alert(err.message); }
}

async function saveEvent() {
  const id = $("eventId").value;
  const data = {
    title: $("eventTitle").value.trim(),
    date: $("eventDate").value,
    location: $("eventLocation").value.trim(),
    description: $("eventDesc").value.trim(),
  };
  if (!data.title) return alert("Event title is required.");

  try {
    if (id) {
      await api.request(`/events/${id}`, { method: "PUT", body: data });
    } else {
      await api.request('/events', { method: "POST", body: data });
    }
    resetEventForm();
    renderAll();
  } catch (err) { console.error("Save event failed:", err); alert(err.message); }
}

/* ===== Seed Demo Core ===== */
async function seedDemoCore() {
  try {
    // Seed courses
    const sampleCourses = [
      { title: "Leadership Fundamentals", quarter: "Q1", description: "Master the basics of youth leadership." },
      { title: "Advocacy & Communication", quarter: "Q2", description: "Learn to advocate effectively for causes you care about." },
    ];
    for (const c of sampleCourses) {
      try { await api.request('/courses', { method: "POST", body: c }); } catch {}
    }

    // Seed events
    const sampleEvents = [
      { title: "YAN Annual Summit 2026", date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0], location: "Kigali Convention Center", description: "Annual gathering of youth leaders." },
      { title: "Community Leadership Workshop", date: new Date(Date.now() + 14*86400000).toISOString().split('T')[0], location: "Huye, Rwanda", description: "Workshop for community-level youth leaders." },
    ];
    for (const e of sampleEvents) {
      try { await api.request('/events', { method: "POST", body: e }); } catch {}
    }

    // Seed applications
    seedDemoApplications(2);

    renderAll();
    alert("Demo data seeded!");
  } catch (err) { console.error("Seed failed:", err); }
}

function seedDemoApplications(n = 2) {
  const apps = loadList(LS_KEYS.APPS);

  for (let i = 0; i < n; i++) {
    apps.push({
      id: uid("app"),
      fullName: i === 0 ? "Aline Mukamana" : "Jean Uwimana",
      email: i === 0 ? "aline@example.com" : "jean@example.com",
      organization: i === 0 ? "Youth Voices Rwanda" : "Green Future Initiative",
      status: "pending",
      createdAt: new Date(Date.now() - (i+1) * 86400000).toISOString(),
      data: {},
      files: {}
    });
  }

  saveList(LS_KEYS.APPS, apps);
}

async function renderAll() {
  if (typeof api === 'undefined') return;
  
  try {
    // 1. Sync System Stats (Users, Orgs, Apps, Opps)
    const stats = await api.getAdminSystemStats();
    if (stats) {
       updateStats(stats);
       // Sync events count if we had a dedicated card for it, otherwise it's in the background
    }

    // 2. Sync LMS Analytics (Courses, Assignments, Progress)
    const lms = await api.getAdminLmsAnalytics();
    if (lms && lms.summary) {
       if ($("statCourses")) $("statCourses").textContent = lms.summary.totalCourses ?? 0;
    }

    // 3. Render current view
    if (state.view === "applications") {
      const apps = await api.getAdminRecentApplications();
      // Ensure we always have an array
      const appArray = Array.isArray(apps) ? apps : (apps?.data || []);
      saveList(LS_KEYS.APPS, appArray); 
      renderApplications();
    }
    
    if (state.view === "courses") {
      // Courses might be fetched separately or come from lms analytics if full list is there
      // For now, let's keep it consistent
      renderCourses();
    }
    
    if (state.view === "assignments") renderAssignments();
    if (state.view === "opportunities") renderOpps();
    if (state.view === "events") renderEvents();
    if (state.view === "profile") renderProfile();
    
  } catch (err) {
    console.error("Failed to fetch admin data:", err);
  }
}

async function renderProfile() {
  try {
    const user = await api.getMe();
    if (!user) return;

    if ($("adminDispName")) $("adminDispName").textContent = user.name || "Admin User";
    if ($("adminDispEmail")) $("adminDispEmail").textContent = user.email || "";
    if ($("adminDispRole")) $("adminDispRole").textContent = (user.role || "ADMIN").toUpperCase();
    if ($("adminDispJoined")) $("adminDispJoined").textContent = formatDate(user.createdAt) || "March 2026";
    if ($("adminDispBio")) $("adminDispBio").textContent = user.bio || "No bio provided.";
    if ($("adminProfileInitial")) $("adminProfileInitial").textContent = (user.name || "A").charAt(0).toUpperCase();

    // Setup edit button
    if ($("adminEditProfileBtn")) {
      $("adminEditProfileBtn").onclick = () => openAdminProfileModal();
    }
  } catch (err) {
    console.error("Failed to render profile:", err);
  }
}

function openAdminProfileModal() {
  // We'll reuse the logic or create a simple prompt for now, 
  // or I could add a modal to admin.html. 
  // Given the complexity, let's add a simple modal to admin.html in the next step or use prompt.
  const name = prompt("Enter your new name:", $("adminDispName").textContent);
  if (name === null) return;
  const bio = prompt("Enter your new bio:", $("adminDispBio").textContent);
  if (bio === null) return;

  api.updateDetails(name, undefined, undefined, bio)
    .then(() => {
      renderProfile();
      alert("Profile updated successfully!");
    })
    .catch(err => alert("Update failed: " + err.message));
}

/* ===== Init ===== */
async function init() {
  await requireAdmin();
  setYear();
  initSidebarToggle();

  document.querySelectorAll(".admin-nav button").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  $("primaryActionBtn").addEventListener("click", () => VIEW_META[state.view].onPrimary());

  $("globalSearch").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    renderAll();
  });

  $("appStatusFilter").addEventListener("change", renderApplications);

  $("clearRejectedBtn").addEventListener("click", () => {
    saveList(LS_KEYS.APPS, loadList(LS_KEYS.APPS).filter(a => normalizeStatus(a.status) !== "rejected"));
    renderAll();
  });

  $("rejectCloseBtn").addEventListener("click", closeRejectModal);
  $("cancelRejectBtn").addEventListener("click", closeRejectModal);
  $("confirmRejectBtn").addEventListener("click", () => {
    const id = $("rejectAppId").value;
    const msg = $("rejectMessage").value.trim();
    closeRejectModal();
    rejectApplicationWithEmail(id, msg);
  });

  $("seedBtn").addEventListener("click", seedDemoCore);

  $("saveCourseBtn").addEventListener("click", saveCourse);
  $("resetCourseBtn").addEventListener("click", resetCourseForm);
  $("saveAssignmentBtn").addEventListener("click", saveAssignment);
  $("resetAssignmentBtn").addEventListener("click", resetAssignmentForm);
  $("saveOppBtn").addEventListener("click", saveOpp);
  $("resetOppBtn").addEventListener("click", resetOppForm);
  $("saveEventBtn").addEventListener("click", saveEvent);
  $("resetEventBtn").addEventListener("click", resetEventForm);

  $("goHomeBtn").addEventListener("click", () => window.location.href = "index.html");

  $("logoutBtn").addEventListener("click", async () => {
    if (typeof api !== 'undefined') await api.logout();
    window.location.href = "index.html";
  });

  // View modal close
  $("viewCloseBtn").addEventListener("click", closeViewModal);

  // Modal accept/reject actions
  $("modalAcceptBtn").addEventListener("click", () => {
    if (!state.activeAppId) return;
    acceptApplication(state.activeAppId);
    closeViewModal();
  });

  $("modalRejectBtn").addEventListener("click", () => {
    if (!state.activeAppId) return;
    closeViewModal();
    openRejectModal(state.activeAppId);
  });

  switchView("applications");
  await renderAll();
}

document.addEventListener("DOMContentLoaded", init);