(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ============ Schemas (drives table + form + CRUD) ============ */
  const SCHEMAS = {
    members: {
      title: "Members",
      viewTitle: "Members Registry",
      addLabel: "Add Member",
      searchKey: "fullName",
      icon: "◉", color: "cyan",
      endpoint: "/api/admin/members",
      columns: [
        { key: "photo", label: "Photo", photo: true },
        { key: "ingameName", label: "In-Game Name" },
        { key: "fullName", label: "Full Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "team", label: "Team" },
        { key: "status", label: "Status", badge: true },
        { key: "joinedAt", label: "Joined" },
      ],
      fields: [
        { key: "ingameName", label: "In-Game Name", type: "text", required: true, placeholder: "NRX.Skyline" },
        { key: "fullName", label: "Full Name", type: "text", required: true, placeholder: "Juan Dela Cruz" },
        { key: "email", label: "Email", type: "email", required: true, placeholder: "name@nrx.gg" },
        { key: "role", label: "Role", type: "select", required: true, options: ["Player", "Coach", "Manager", "Creator", "Staff"] },
        { key: "team", label: "Team", type: "text", placeholder: "Valorant" },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive", "Pending"] },
        { key: "joinedAt", label: "Joined Date", type: "date" },
        { key: "photo", label: "Member Photo", type: "photo", full: true },
      ],
    },
    teams: {
      title: "Teams",
      viewTitle: "Teams Roster",
      addLabel: "Add Team",
      searchKey: "name",
      icon: "▣", color: "violet",
      endpoint: "/api/admin/teams",
      columns: [
        { key: "name", label: "Team Name" },
        { key: "game", label: "Game" },
        { key: "region", label: "Region" },
        { key: "manager", label: "Manager" },
        { key: "roster", label: "Members" },
        { key: "status", label: "Status", badge: true },
      ],
      fields: [
        { key: "name", label: "Team Name", type: "text", required: true, placeholder: "NRX Valorant" },
        { key: "game", label: "Game / Title", type: "select", required: true, options: ["Valorant", "CS2", "Mobile Legends", "Dota 2", "League of Legends", "Apex Legends"] },
        { key: "region", label: "Region", type: "text", placeholder: "SEA / PH" },
        { key: "manager", label: "Team Manager", type: "text", placeholder: "Full name" },
        { key: "roster", label: "Team Members (comma-separated)", type: "textarea", full: true, placeholder: "NRX.Vyper, NRX.Orbit, NRX.Kaze, ..." },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Academy", "Inactive"] },
      ],
    },
    championships: {
      title: "Championships",
      viewTitle: "Championship Records",
      addLabel: "Add Championship",
      searchKey: "name",
      icon: "♛", color: "magenta",
      endpoint: "/api/admin/championships",
      columns: [
        { key: "name", label: "Tournament" },
        { key: "game", label: "Game" },
        { key: "team", label: "Team" },
        { key: "placement", label: "Placement" },
        { key: "prize", label: "Prize" },
        { key: "date", label: "Date" },
        { key: "status", label: "Result", badge: true },
      ],
      fields: [
        { key: "name", label: "Tournament Name", type: "text", required: true, placeholder: "SEA Masters Season 4" },
        { key: "game", label: "Game", type: "select", required: true, options: ["Valorant", "CS2", "Mobile Legends", "Dota 2", "League of Legends", "Apex Legends"] },
        { key: "team", label: "NRX Team", type: "text", required: true, placeholder: "NRX Valorant" },
        { key: "placement", label: "Placement", type: "select", required: true, options: ["1st Place", "2nd Place", "3rd Place", "4th Place", "Top 8", "Group Stage"] },
        { key: "prize", label: "Prize", type: "text", placeholder: "₱1,500,000" },
        { key: "venue", label: "Venue / Location", type: "text", placeholder: "Manila / Online" },
        { key: "date", label: "Date", type: "date" },
        { key: "status", label: "Result Badge", type: "select", required: true, options: ["Champion", "Runner-up", "Qualified", "Participated"] },
      ],
    },
    sponsorships: {
      title: "Sponsors",
      viewTitle: "Sponsorships & Partnerships",
      addLabel: "Add Sponsor / Partner",
      searchKey: "name",
      icon: "✦", color: "green",
      endpoint: "/api/admin/sponsorships",
      columns: [
        { key: "name", label: "Company / Brand" },
        { key: "type", label: "Type" },
        { key: "tier", label: "Tier", badge: true },
        { key: "contactPerson", label: "Contact Person" },
        { key: "email", label: "Email" },
        { key: "amount", label: "Value" },
        { key: "status", label: "Status", badge: true },
      ],
      fields: [
        { key: "name", label: "Company / Brand Name", type: "text", required: true, placeholder: "Voidline Peripherals" },
        { key: "type", label: "Engagement Type", type: "select", required: true, options: ["Sponsor", "Partner", "Co-Brand", "Affiliate"] },
        { key: "tier", label: "Tier", type: "select", required: true, options: ["Platinum", "Gold", "Silver", "Bronze"] },
        { key: "contactPerson", label: "Contact Person", type: "text", placeholder: "Ella Torres" },
        { key: "email", label: "Contact Email", type: "email", placeholder: "partners@brand.co" },
        { key: "amount", label: "Deal Value", type: "text", placeholder: "₱2,000,000" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Pending", "Expired"] },
      ],
    },
    contracts: {
      title: "Contracts",
      viewTitle: "Contracts & Agreements",
      addLabel: "Add Contract",
      searchKey: "party",
      icon: "✎", color: "amber",
      endpoint: "/api/admin/contracts",
      columns: [
        { key: "party", label: "Party / Signatory" },
        { key: "type", label: "Contract Type" },
        { key: "position", label: "Role / Position" },
        { key: "value", label: "Value" },
        { key: "startDate", label: "Start" },
        { key: "endDate", label: "End" },
        { key: "status", label: "Status", badge: true },
      ],
      fields: [
        { key: "party", label: "Party / Signatory", type: "text", required: true, placeholder: "NRX.Vyper / Voidline Inc." },
        { key: "type", label: "Contract Type", type: "select", required: true, options: ["Player Contract", "Sponsorship Contract", "Staff Contract", "Tryout Agreement", "Partnership Agreement"] },
        { key: "position", label: "Role / Position", type: "text", placeholder: "Duelist / Valorant" },
        { key: "value", label: "Value / Salary", type: "text", placeholder: "₱85,000 / month" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Expiring", "Expired", "Draft"] },
      ],
    },
    users: {
      title: "Users",
      viewTitle: "User Accounts",
      addLabel: "Add User",
      searchKey: "username",
      icon: "♟", color: "cyan",
      endpoint: "/api/admin/users",
      columns: [
        { key: "username", label: "Username" },
        { key: "displayName", label: "Display Name" },
        { key: "role", label: "Role", userRole: true },
        { key: "lastLogin", label: "Last Login", when: true },
        { key: "createdAt", label: "Created", when: true },
      ],
      fields: [
        { key: "username", label: "Username", type: "text", required: true, placeholder: "coach.ruel" },
        { key: "displayName", label: "Display Name", type: "text", placeholder: "Ruel Bautista" },
        { key: "role", label: "Role", type: "select", required: true, options: [{ v: "staff", l: "Staff" }, { v: "admin", l: "Admin" }] },
        { key: "password", label: "Password", type: "password", required: true, placeholder: "Min 8 characters" },
      ],
    },

    /* ---- Landing page records (independent sa user accounts) ---- */
    games: {
      title: "Games",
      viewTitle: "Landing Page · Games",
      addLabel: "Add Game",
      searchKey: "name",
      icon: "▤", color: "cyan",
      endpoint: "/api/admin/games",
      columns: [
        { key: "image", label: "Logo", photo: true },
        { key: "name", label: "Game" },
        { key: "description", label: "Description" },
        { key: "tag", label: "Tag" },
        { key: "order", label: "Order" },
      ],
      fields: [
        { key: "name", label: "Game Name", type: "text", required: true, placeholder: "Mobile Legends: Bang Bang" },
        { key: "description", label: "Short Description", type: "textarea", full: true, placeholder: "Fast-paced MOBA dominance..." },
        { key: "tag", label: "Tag", type: "text", placeholder: "Active Roster" },
        { key: "order", label: "Display Order", type: "number", placeholder: "1" },
        { key: "image", label: "Game Logo", type: "photo", full: true },
      ],
    },
    matches: {
      title: "Matches",
      viewTitle: "Landing Page · Matches",
      addLabel: "Add Match",
      searchKey: "teamA",
      icon: "≡", color: "violet",
      endpoint: "/api/admin/matches",
      columns: [
        { key: "meta", label: "Status / Info" },
        { key: "teamA", label: "Team A" },
        { key: "teamB", label: "Team B" },
        { key: "scoreA", label: "Score A" },
        { key: "scoreB", label: "Score B" },
        { key: "order", label: "Order" },
      ],
      fields: [
        { key: "teamA", label: "Team A", type: "text", required: true, placeholder: "NRX" },
        { key: "teamB", label: "Team B (kalaban)", type: "text", required: true, placeholder: "Voidline" },
        { key: "meta", label: "Status / Info", type: "text", placeholder: "LIVE • BO3 o UPCOMING • 20:00 PHT" },
        { key: "scoreA", label: "Score A", type: "text", placeholder: "1" },
        { key: "scoreB", label: "Score B", type: "text", placeholder: "1" },
        { key: "order", label: "Display Order", type: "number", placeholder: "1" },
      ],
    },
    admins: {
      title: "Admins",
      viewTitle: "Landing Page · Admins",
      addLabel: "Add Admin",
      searchKey: "name",
      icon: "★", color: "magenta",
      endpoint: "/api/admin/admins",
      columns: [
        { key: "photo", label: "Photo", photo: true },
        { key: "name", label: "Name" },
        { key: "title", label: "Title" },
        { key: "role", label: "Role" },
        { key: "order", label: "Order" },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true, placeholder: "Paul Gonowon" },
        { key: "title", label: "Title (lalabas sa landing page)", type: "text", placeholder: "Founder & CEO" },
        { key: "role", label: "Role", type: "text", placeholder: "Platform Admin / Staff / Founder" },
        { key: "order", label: "Display Order", type: "number", placeholder: "1" },
        { key: "photo", label: "Photo", type: "photo", full: true },
      ],
    },
  };

  const BADGE_MAP = {
    Active: "green", Champion: "green", Platinum: "green",
    Pending: "amber", Qualified: "amber", Gold: "amber", Academy: "amber", Expiring: "amber",
    Expired: "red", Inactive: "red", "Runner-up": "magenta",
    Silver: "cyan", Bronze: "amber", "Participated": "violet",
    Draft: "violet", Renewed: "cyan",
  };

  /* ============ State ============ */
  let user = null;
  let currentView = "overview";
  let editing = null;          // { type, id }
  let pendingDelete = null;    // { type, id }
  let stagedPhoto = null;      // newly uploaded, not yet saved
  const dataCache = { members: [], teams: [], championships: [], sponsorships: [], contracts: [], users: [], logs: [], games: [], matches: [], admins: [] };

  /* ============ Session guard ============ */
  // Which sidebar views each role may open.
  //  webadmin (NRX Web Admin): everything.
  //  admin: lahat maliban sa Landing Page category, Users at Activity Logs.
  //  staff: Members at Teams lang.
  const VIEW_ACCESS = {
    overview: ["webadmin", "admin", "staff"],
    members: ["webadmin", "admin", "staff"],
    teams: ["webadmin", "admin", "staff"],
    championships: ["webadmin", "admin"],
    sponsorships: ["webadmin", "admin"],
    contracts: ["webadmin", "admin"],
    content: ["webadmin"],
    games: ["webadmin"],
    matches: ["webadmin"],
    admins: ["webadmin"],
    announcements: ["webadmin", "admin"],
    users: ["webadmin"],
    logs: ["webadmin"],
    settings: ["webadmin", "admin", "staff"],
  };
  function canView(view) {
    const roles = VIEW_ACCESS[view];
    return !roles || (user && roles.includes(user.role));
  }

  async function guard() {
    try {
      const r = await fetch("/api/session");
      const d = await r.json();
      if (!d.authenticated) { window.location.href = "/"; return false; }
      user = d.user;
      applyUserUI();
      applyNavAccess();
      return true;
    } catch { window.location.href = "/"; return false; }
  }

  function applyUserUI() {
    const label = user.displayName || user.username;
    $("#userName").textContent = label;
    $("#userAvatar").textContent = label.charAt(0).toUpperCase();
    const roleEl = $(".topbar__role");
    if (roleEl) roleEl.textContent = roleLabel(user.role);
  }

  // Hides sidebar items (and now-empty group headings) the role cannot open.
  function applyNavAccess() {
    $$(".nav-item").forEach((b) => { b.hidden = !canView(b.dataset.view); });
    $$(".sidebar__group").forEach((group) => {
      let node = group.nextElementSibling;
      let anyVisible = false;
      while (node && !node.classList.contains("sidebar__group")) {
        if (node.classList.contains("nav-item") && !node.hidden) anyVisible = true;
        node = node.nextElementSibling;
      }
      group.hidden = !anyVisible;
    });
    $$("[data-quick]").forEach((b) => { b.hidden = !canView(b.dataset.quick); });
    const titlesHead = $("#recentTitlesHead");
    const titlesList = $("#recentTitles");
    const showTitles = canView("championships");
    if (titlesHead) titlesHead.hidden = !showTitles;
    if (titlesList) titlesList.hidden = !showTitles;
  }

  /* ============ Toast ============ */
  let toastTimer;
  function toast(msg, type) {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast is-show" + (type ? " is-" + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 3200);
  }

  /* ============ Navigation ============ */
  function switchView(view) {
    if (!canView(view)) view = "overview";
    currentView = view;
    $$(".nav-item").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
    $$(".view").forEach((v) => {
      const on = v.dataset.view === view;
      v.hidden = !on;
      if (on) { v.style.animation = "none"; v.offsetHeight; v.style.animation = ""; }
    });

    const titles = {
      overview: "Overview",
      members: SCHEMAS.members.viewTitle,
      teams: SCHEMAS.teams.viewTitle,
      championships: SCHEMAS.championships.viewTitle,
      sponsorships: SCHEMAS.sponsorships.viewTitle,
      contracts: SCHEMAS.contracts.viewTitle,
      content: "Landing Page Content",
      games: SCHEMAS.games.viewTitle,
      matches: SCHEMAS.matches.viewTitle,
      admins: SCHEMAS.admins.viewTitle,
      announcements: "Announcements",
      users: SCHEMAS.users.viewTitle,
      logs: "Activity Logs",
      settings: "Settings",
    };
    $("#viewTitle").textContent = titles[view] || view;

    closeSidebar();
    if (view === "overview") loadOverview();
    else if (SCHEMAS[view]) loadRecordView(view);
    else if (view === "content") loadContentView();
    else if (view === "announcements") loadAnnouncements();
    else if (view === "logs") loadLogsView();
    else if (view === "settings") loadSettings();
  }

  $$(".nav-item").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));

  function closeSidebar() {
    $("#sidebar").classList.remove("is-open");
    $("#scrim").classList.remove("is-open");
  }
  $("#burger").addEventListener("click", () => {
    $("#sidebar").classList.toggle("is-open");
    $("#scrim").classList.toggle("is-open");
  });
  $("#scrim").addEventListener("click", closeSidebar);

  /* ============ Overview ============ */
  async function loadOverview() {
    try {
      const r = await fetch("/api/admin/summary");
      const d = await r.json();
      if (!d.ok) return;
      const s = d.summary;

      // sidebar counts
      $('[data-count="members"]').textContent = s.members;
      $('[data-count="teams"]').textContent = s.teams;
      $('[data-count="championships"]').textContent = s.championships;
      $('[data-count="sponsorships"]').textContent = s.sponsorships;
      $('[data-count="contracts"]').textContent = s.contracts;
      if ($('[data-count="users"]')) $('[data-count="users"]').textContent = s.users;

      // stat cards — filtered to what this role may see
      const cards = [
        { view: "members", ico: "◉", color: "cyan", val: s.members, lbl: "Total Members", sub: s.activeMembers + " active" },
        { view: "teams", ico: "▣", color: "violet", val: s.teams, lbl: "Active Teams" },
        { view: "championships", ico: "♛", color: "magenta", val: s.championships, lbl: "Tournaments", sub: s.titles + " titles won" },
        { view: "sponsorships", ico: "✦", color: "green", val: s.sponsorships, lbl: "Sponsors", sub: s.activeSponsors + " active" },
      ].filter((x) => canView(x.view));
      $("#statsGrid").innerHTML = cards.map((x) => `
        <div class="stat">
          <div class="stat__ico ${x.color}">${x.ico}</div>
          <div class="stat__val">${x.val}</div>
          <div class="stat__lbl">${x.lbl}${x.sub ? " · " + x.sub : ""}</div>
        </div>`).join("");

      // recent members table
      $("#recentMembers").innerHTML = renderSimpleTable(d.recentMembers, [
        { key: "photo", label: "Photo", photo: true },
        { key: "ingameName", label: "In-Game Name" },
        { key: "fullName", label: "Full Name" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status", badge: true },
      ]);

      // recent titles (Admin and above only)
      if (canView("championships")) {
        $("#recentTitles").innerHTML = d.recentChampionships.map((c) => `
          <li>
            <span class="activity__medal">♛</span>
            <span class="activity__txt"><b>${esc(c.name)}</b><span>${esc(c.team)} · ${esc(c.placement)} · ${esc(c.date || "")}</span></span>
          </li>`).join("") || `<li style="justify-content:center;color:var(--muted)">No championships yet.</li>`;
      }
    } catch (e) { console.error(e); }
  }

  function cellHTML(col, row) {
    if (col.photo) return thumbHTML(row[col.key], row);
    if (col.badge) return badge(row[col.key]);
    if (col.userRole) return userRoleBadge(row[col.key]);
    if (col.when) {
      const v = row[col.key];
      return v
        ? esc(new Date(v).toLocaleString())
        : `<span style="color:var(--muted)">Never</span>`;
    }
    return esc(row[col.key] || "—");
  }

  const ROLE_LABELS = { webadmin: "NRX Web Admin", admin: "Admin", staff: "Staff" };
  function roleLabel(role) {
    return ROLE_LABELS[role] || role || "—";
  }

  function userRoleBadge(role) {
    if (role === "webadmin") return `<span class="badge badge--magenta">NRX Web Admin</span>`;
    if (role === "admin") return `<span class="badge badge--violet">Admin</span>`;
    if (role === "staff") return `<span class="badge badge--cyan">Staff</span>`;
    return esc(role || "—");
  }

  function thumbHTML(url, row) {
    if (url) return `<img class="thumb" src="${esc(url)}" alt="" loading="lazy" />`;
    const src = row.fullName || row.ingameName || "?";
    return `<span class="thumb thumb--empty">${esc(String(src).trim().charAt(0).toUpperCase() || "?")}</span>`;
  }

  function renderSimpleTable(rows, cols) {
    if (!rows || !rows.length) return `<div class="empty"><b>Nothing here yet</b>Create your first record to get started.</div>`;
    return `<table><thead><tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${cols.map((c) => `<td>${cellHTML(c, row)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  /* ============ Record views ============ */
  async function loadRecordView(type) {
    const schema = SCHEMAS[type];
    const section = $(`.view[data-view="${type}"]`);
    try {
      const r = await fetch(schema.endpoint);
      const d = await r.json();
      dataCache[type] = d.ok ? d.items : [];
    } catch { dataCache[type] = []; }

    section.innerHTML = `
      <div class="panel">
        <div class="toolbar">
          <div class="search"><input type="text" id="search_${type}" placeholder="Search ${schema.title.toLowerCase()}..." /></div>
          <button class="btn btn--primary" data-add="${type}">+ ${esc(schema.addLabel)}</button>
        </div>
        <div class="table-wrap" id="table_${type}"></div>
      </div>`;

    renderRecordTable(type);
    $("#search_" + type).addEventListener("input", (e) => renderRecordTable(type, e.target.value));
    section.querySelector("[data-add]").addEventListener("click", () => openForm(type));
    $('[data-count="' + type + '"]').textContent = dataCache[type].length;
  }

  function renderRecordTable(type, query) {
    const schema = SCHEMAS[type];
    const q = (query || "").toLowerCase();
    let rows = dataCache[type];
    if (q) rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));

    const wrap = $("#table_" + type);
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty"><b>No ${schema.title.toLowerCase()} found</b>${q ? "Try a different search term." : "Click \"" + esc(schema.addLabel) + "\" to add one."}</div>`;
      return;
    }

    wrap.innerHTML = `<table><thead><tr>
      ${schema.columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}
      <th style="text-align:right">Actions</th>
    </tr></thead><tbody>
      ${rows.map((r) => `<tr>
        ${schema.columns.map((c) => `<td>${cellHTML(c, r)}</td>`).join("")}
        <td style="text-align:right">
          <div class="cell-actions" style="justify-content:flex-end">
            ${type === "users" && r.primary
              ? `<span class="act" style="opacity:.45;cursor:not-allowed" title="The NRX Web Admin account is fixed">&#128274; Locked</span>`
              : `<button class="act act--edit" data-edit="${r.id}">Edit</button>
                 ${type === "users" && user && r.id === user.id
                   ? `<span class="act" style="opacity:.45;cursor:not-allowed" title="You cannot delete your own account">Delete</span>`
                   : `<button class="act act--del" data-del="${r.id}">Delete</button>`}`}
          </div>
        </td>
      </tr>`).join("")}
    </tbody></table>`;

    $$("[data-edit]", wrap).forEach((b) => b.addEventListener("click", () => openForm(type, b.dataset.edit)));
    $$("[data-del]", wrap).forEach((b) => b.addEventListener("click", () => openConfirm(type, b.dataset.del)));
  }

  function badge(v) {
    if (!v) return "—";
    const color = BADGE_MAP[v] || "cyan";
    return `<span class="badge badge--${color}">${esc(v)}</span>`;
  }

  /* ============ Form modal ============ */
  function openForm(type, id) {
    const schema = SCHEMAS[type];
    const record = id ? dataCache[type].find((r) => r.id === id) : null;
    editing = record ? { type, id } : { type, id: null };
    stagedPhoto = null;

    $("#modalFormTitle").textContent = (record ? "Edit " : "Add ") + schema.title.replace(/s$/, "");
    $("#formError").classList.remove("is-show");

    $("#formFields").innerHTML = schema.fields.map((f) => {
      const val = record ? esc(record[f.key] ?? "") : "";
      const cls = f.full ? "field fw" : "field";
      let input;
      if (f.type === "photo") {
        input = `
        <div class="photo-picker">
          <span class="photo-picker__preview" id="photoPreview">${val ? `<img src="${val}" alt="" />` : "👤"}</span>
          <div class="photo-picker__meta">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-photo-file />
            <span class="photo-picker__hint">PNG, JPG, WebP or GIF — max 5MB</span>
            <span class="photo-picker__status" id="photoStatus"></span>
            ${val ? `<button type="button" class="photo-picker__remove" data-photo-remove>Remove photo</button>` : ""}
          </div>
        </div>
        <input type="hidden" name="photo" value="${val}" />`;
      } else if (f.type === "select") {
        input = `<select name="${f.key}" ${f.required ? "required" : ""}>
          ${f.options.map((o) => {
            const v = typeof o === "object" ? o.v : o;
            const l = typeof o === "object" ? o.l : o;
            const selected = record && record[f.key] === v;
            return `<option value="${esc(v)}" ${selected ? "selected" : ""}>${esc(l)}</option>`;
          }).join("")}
        </select>`;
      } else if (f.type === "textarea") {
        input = `<textarea name="${f.key}" placeholder="${esc(f.placeholder || "")}" ${f.required ? "required" : ""}>${val}</textarea>`;
      } else {
        input = `<input type="${f.type}" name="${f.key}" value="${val}" placeholder="${esc(f.placeholder || "")}" ${f.required ? "required" : ""} />`;
      }
      const tag = f.type === "photo" ? "div" : "label";
      return `<${tag} class="${cls}"><span class="field__label">${esc(f.label)}${f.required ? " *" : ""}</span>${input}</${tag}>`;
    }).join("");

    bindPhotoPicker(record ? record.photo || "" : "");

    if (type === "users") {
      const uField = $('#formFields [name="username"]');
      const pField = $('#formFields [name="password"]');
      if (record && uField) {
        uField.disabled = true;
        uField.title = "Username cannot be changed";
      }
      if (record && pField) {
        pField.required = false;
        pField.placeholder = "Leave blank to keep current password";
      }
    }

    const modal = $("#recordModal");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#formFields input, #formFields select")?.focus(), 300);
  }

  /* ============ Photo upload inside form ============ */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function bindPhotoPicker(original) {
    const fileInput = $("#formFields [data-photo-file]");
    if (!fileInput) return;

    const status = $("#photoStatus");
    const preview = $("#photoPreview");
    const hidden = $('#formFields input[name="photo"]');

    function setStatus(text, ok) {
      status.className = "photo-picker__status " + (ok ? "ok" : "err");
      status.textContent = text;
    }

    function ensureRemoveButton() {
      if ($("#formFields [data-photo-remove]")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "photo-picker__remove";
      btn.setAttribute("data-photo-remove", "");
      btn.textContent = "Remove photo";
      btn.addEventListener("click", onRemove);
      $("#formFields .photo-picker__meta").appendChild(btn);
    }

    async function onRemove() {
      const current = hidden.value;
      if (current === stagedPhoto && current) {
        discardPhoto(current);
        stagedPhoto = null;
      }
      // original photo: server deletes it on save (merged.photo differs)
      hidden.value = "";
      preview.innerHTML = "👤";
      status.className = "photo-picker__status";
      status.textContent = "";
      $("#formFields [data-photo-remove]")?.remove();
    }

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      status.className = "photo-picker__status";
      status.textContent = "Uploading…";

      if (!/^image\//.test(file.type)) {
        setStatus("Image files only.", false);
        fileInput.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setStatus("Max 5MB only.", false);
        fileInput.value = "";
        return;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const r = await fetch("/api/admin/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        const d = await r.json();
        if (!d.ok) {
          setStatus(d.error || "Upload failed.", false);
          return;
        }
        if (stagedPhoto && stagedPhoto !== original) discardPhoto(stagedPhoto);
        stagedPhoto = d.url;
        hidden.value = d.url;
        preview.innerHTML = `<img src="${d.url}" alt="" />`;
        setStatus("Photo uploaded.", true);
        ensureRemoveButton();
      } catch {
        setStatus("Upload failed. Is the server running?", false);
      } finally {
        fileInput.value = "";
      }
    });

    const existingRemove = $("#formFields [data-photo-remove]");
    if (existingRemove) existingRemove.addEventListener("click", onRemove);
  }

  function closeRecordModal() {
    $("#recordModal").classList.remove("is-open");
    $("#recordModal").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (stagedPhoto) discardPhoto(stagedPhoto);
    stagedPhoto = null;
    editing = null;
  }

  function discardPhoto(url) {
    fetch("/api/admin/upload-photo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  }
  $$('#recordModal [data-close]').forEach((el) => el.addEventListener("click", closeRecordModal));

  $("#recordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!editing) return;
    const schema = SCHEMAS[editing.type];
    const formData = new FormData(e.target);
    const payload = {};
    schema.fields.forEach((f) => {
      if (f.type === "password") {
        const v = (formData.get(f.key) || "").toString().trim();
        if (v) payload.password = v; // blank = keep current password
        return;
      }
      payload[f.key] = (formData.get(f.key) || "").toString().trim();
    });

    const type = editing.type;
    const isEdit = !!editing.id;
    const btn = $("#recordSubmit");
    btn.disabled = true;
    try {
      const url = editing.id ? schema.endpoint + "/" + editing.id : schema.endpoint;
      const method = isEdit ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!d.ok) {
        $("#formError").textContent = d.error || "Failed to save.";
        $("#formError").classList.add("is-show");
        return;
      }
      stagedPhoto = null; // photo is now part of the saved record
      closeRecordModal();
      toast(isEdit ? "Record updated." : "Record added.", "success");
      if (currentView === type) await loadRecordView(type);
      if (currentView === "overview") loadOverview();
    } catch (err) {
      $("#formError").textContent = "Network error. Could not reach the server.";
      $("#formError").classList.add("is-show");
    } finally { btn.disabled = false; }
  });

  /* ============ Delete confirm ============ */
  function openConfirm(type, id) {
    pendingDelete = { type, id };
    const record = dataCache[type].find((r) => r.id === id);
    const schema = SCHEMAS[type];
    const label = record?.[schema.searchKey] || "this record";
    $("#confirmText").textContent = `Delete "${label}" permanently? This cannot be undone.`;
    const m = $("#confirmModal");
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeConfirm() {
    $("#confirmModal").classList.remove("is-open");
    $("#confirmModal").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    pendingDelete = null;
  }
  $$('#confirmModal [data-close]').forEach((el) => el.addEventListener("click", closeConfirm));

  $("#confirmDelete").addEventListener("click", async () => {
    if (!pendingDelete) return;
    const schema = SCHEMAS[pendingDelete.type];
    try {
      const r = await fetch(schema.endpoint + "/" + pendingDelete.id, { method: "DELETE" });
      const d = await r.json();
      if (d.ok) {
        const type = pendingDelete.type;
        closeConfirm();
        toast("Record deleted.", "success");
        if (currentView === type) loadRecordView(type);
        if (currentView === "overview") loadOverview();
      } else {
        closeConfirm();
        toast(d.error || "Delete failed.", "error");
      }
    } catch {
      closeConfirm();
      toast("Network error.", "error");
    }
  });

  /* ============ Quick actions ============ */
  $$("[data-quick]").forEach((b) => b.addEventListener("click", () => {
    const type = b.dataset.quick;
    switchView(type);
    setTimeout(() => openForm(type), 350);
  }));
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.goto)));

  /* ============ Announcements ============ */
  async function loadAnnouncements() {
    try {
      const r = await fetch("/api/admin/announcements");
      const d = await r.json();
      $("#annList").innerHTML = d.announcements.map((a) => `<li><span>${esc(a)}</span></li>`).join("");
    } catch (e) { console.error(e); }
  }

  $("#annForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = $("#annInput").value.trim();
    if (!message) return;
    try {
      const r = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const d = await r.json();
      if (d.ok) {
        $("#annInput").value = "";
        $("#annList").innerHTML = d.announcements.map((a) => `<li><span>${esc(a)}</span></li>`).join("");
        toast("Announcement published.", "success");
      } else toast(d.error || "Failed.", "error");
    } catch { toast("Network error.", "error"); }
  });

  /* ============ Activity logs ============ */
  const ACTION_COLOR = {
    login: "cyan", logout: "violet",
    create: "green", update: "amber", delete: "red",
    upload: "cyan", announce: "magenta", password: "amber",
  };

  async function loadLogsView() {
    const section = $('.view[data-view="logs"]');
    try {
      const r = await fetch("/api/admin/activity");
      const d = await r.json();
      dataCache.logs = d.ok ? d.items : [];
    } catch { dataCache.logs = []; }

    section.innerHTML = `
      <div class="panel">
        <div class="toolbar">
          <div class="search"><input type="text" id="search_logs" placeholder="Search logs by user, action, or detail..." /></div>
          <button class="btn btn--primary" id="logsRefresh">&#8635; Refresh</button>
        </div>
        <div class="table-wrap" id="table_logs"></div>
      </div>`;

    renderLogsTable();
    $("#search_logs").addEventListener("input", (e) => renderLogsTable(e.target.value));
    $("#logsRefresh").addEventListener("click", () => loadLogsView());
  }

  function renderLogsTable(query) {
    const wrap = $("#table_logs");
    if (!wrap) return;
    const q = (query || "").toLowerCase();
    let rows = dataCache.logs;
    if (q) rows = rows.filter((l) => JSON.stringify(l).toLowerCase().includes(q));

    if (!rows.length) {
      wrap.innerHTML = `<div class="empty"><b>No activity found</b>${q ? "Try a different search term." : "Actions performed on the site will appear here."}</div>`;
      return;
    }

    wrap.innerHTML = `<table><thead><tr>
      <th>Time</th><th>User</th><th>Action</th><th>Details</th>
    </tr></thead><tbody>
      ${rows.map((l) => {
        const act = String(l.action || "");
        const actLabel = act.charAt(0).toUpperCase() + act.slice(1);
        return `<tr>
          <td style="white-space:nowrap">${esc(new Date(l.ts).toLocaleString())}</td>
          <td><b>${esc(l.user || "guest")}</b></td>
          <td><span class="badge badge--${ACTION_COLOR[act] || "cyan"}">${esc(actLabel)}</span></td>
          <td>${esc(l.detail || "—")}</td>
        </tr>`;
      }).join("")}
    </tbody></table>`;
  }

  /* ============ Settings — my account ============ */
  async function loadSettings() {
    const section = $('.view[data-view="settings"]');
    let me = null;
    try {
      const r = await fetch("/api/me");
      const d = await r.json();
      if (d.ok) me = d.user;
    } catch {}

    if (!me) {
      section.innerHTML = `<div class="panel"><div class="empty"><b>Account unavailable</b>Please sign in again.</div></div>`;
      return;
    }

    const fmt = (v) => (v ? esc(new Date(v).toLocaleString()) : "\u2014");
    section.innerHTML = `
      <div class="settings-grid">
        <div class="panel">
          <div class="panel__head"><h3>My Account</h3></div>
          <div class="acct">
            <div class="acct__row"><span>Username</span><b>${esc(me.username)}</b></div>
            <div class="acct__row"><span>Display Name</span><b>${esc(me.displayName)}</b></div>
            <div class="acct__row"><span>Role</span><span>${userRoleBadge(me.role)}</span></div>
            <div class="acct__row"><span>Last Sign-in</span><b>${fmt(me.lastLogin)}</b></div>
            <div class="acct__row"><span>Account Created</span><b>${fmt(me.createdAt)}</b></div>
            <div class="acct__row"><span>Password Changed</span><b>${fmt(me.passwordChangedAt)}</b></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>Personal Details</h3></div>
          ${me.primary
            ? `<p class="hint-fixed">Ang NRX Web Admin account ay fixed \u2014 hindi mababago ang username at display name.</p>`
            : `<p class="hint-fixed">Pwede mong palitan ang sarili mong username at display name.</p>`}
          <form id="profileForm" novalidate>
            <div class="form-grid">
              <label class="field fw"><span class="field__label">Username *</span>
                <input type="text" name="username" value="${esc(me.username)}" minlength="3" maxlength="24" autocapitalize="none" autocomplete="username" ${me.primary ? "disabled" : ""} /></label>
              <label class="field fw"><span class="field__label">Display Name *</span>
                <input type="text" name="displayName" value="${esc(me.displayName)}" maxlength="48" ${me.primary ? "disabled" : ""} /></label>
            </div>
            <div class="form-error" id="profileError"></div>
            <div class="form-actions">
              <button type="submit" class="btn btn--primary" id="profileSubmit" ${me.primary ? "disabled" : ""}>Save Changes</button>
            </div>
          </form>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>Change Password</h3></div>
          <form id="pwForm" novalidate>
            <div class="form-grid">
              <label class="field fw"><span class="field__label">Current Password *</span>
                <input type="password" name="current" required autocomplete="current-password" /></label>
              <label class="field fw"><span class="field__label">New Password *</span>
                <input type="password" name="next" required minlength="8" autocomplete="new-password" placeholder="Min 8 characters" /></label>
              <label class="field fw"><span class="field__label">Confirm New Password *</span>
                <input type="password" name="confirm" required minlength="8" autocomplete="new-password" /></label>
            </div>
            <div class="form-error" id="pwError"></div>
            <div class="form-actions">
              <button type="submit" class="btn btn--primary" id="pwSubmit">Update Password</button>
            </div>
          </form>
        </div>
      </div>`;

    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const cur = String(fd.get("current") || "");
      const next = String(fd.get("next") || "");
      const conf = String(fd.get("confirm") || "");
      const err = $("#pwError");
      err.classList.remove("is-show");
      const fail = (m) => { err.textContent = m; err.classList.add("is-show"); };

      if (!cur || !next || !conf) return fail("All fields are required.");
      if (next.length < 8) return fail("New password must be at least 8 characters.");
      if (next !== conf) return fail("New passwords do not match.");
      if (next === cur) return fail("New password must be different from the current one.");

      const btn = $("#pwSubmit");
      btn.disabled = true;
      try {
        const r = await fetch("/api/me/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: cur, newPassword: next }),
        });
        const d = await r.json();
        if (!d.ok) { fail(d.error || "Failed to update password."); return; }
        toast("Password updated.", "success");
        loadSettings();
      } catch { fail("Network error. Could not reach the server."); }
      finally { btn.disabled = false; }
    });

    const profileForm = $("#profileForm");
    if (profileForm) profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const username = String(fd.get("username") || "").trim();
      const displayName = String(fd.get("displayName") || "").trim();
      const err = $("#profileError");
      err.classList.remove("is-show");
      const fail = (m) => { err.textContent = m; err.classList.add("is-show"); };

      if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) {
        return fail("Username must be 3-24 characters (letters, numbers, . _ -).");
      }
      if (!displayName) return fail("Display name is required.");

      const btn = $("#profileSubmit");
      btn.disabled = true;
      try {
        const r = await fetch("/api/me/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, displayName }),
        });
        const d = await r.json();
        if (!d.ok) { fail(d.error || "Failed to update profile."); return; }
        user.username = d.user.username;
        user.displayName = d.user.displayName;
        applyUserUI();
        toast("Personal details updated.", "success");
        loadSettings();
      } catch { fail("Network error. Could not reach the server."); }
      finally { btn.disabled = false; }
    });
  }

  /* ============ Landing page content (singleton) ============ */
  async function loadContentView() {
    const section = $(`.view[data-view="content"]`);
    let content = null;
    try {
      const r = await fetch("/api/admin/content");
      const d = await r.json();
      if (d.ok) content = d.content;
    } catch {}

    if (!content) {
      section.innerHTML = `<div class="panel"><div class="empty"><b>Content unavailable</b>Please refresh and try again.</div></div>`;
      return;
    }

    const h = content.hero || {};
    const a = content.about || {};
    const c = content.cta || {};
    const f = content.footer || {};
    const stats = Array.isArray(content.stats) ? content.stats : [];
    const statRows = stats
      .map(
        (s, i) => `
        <label class="field"><span class="field__label">Stat ${i + 1} — Number</span><input type="number" name="stat_${i}_value" value="${esc(s.value)}" /></label>
        <label class="field"><span class="field__label">Stat ${i + 1} — Suffix</span><input type="text" name="stat_${i}_suffix" value="${esc(s.suffix || "")}" placeholder="+ o K" /></label>
        <label class="field"><span class="field__label">Stat ${i + 1} — Label</span><input type="text" name="stat_${i}_label" value="${esc(s.label || "")}" placeholder="Match Wins" /></label>`
      )
      .join("");

    section.innerHTML = `
      <form id="contentForm" class="content-form">
        <div class="panel">
          <div class="panel__head"><h3>Hero</h3></div>
          <div class="form-grid">
            <label class="field fw"><span class="field__label">Badge</span><input type="text" name="hero_badge" value="${esc(h.badge || "")}" /></label>
            <label class="field"><span class="field__label">Title (una)</span><input type="text" name="hero_titleBefore" value="${esc(h.titleBefore || "")}" /></label>
            <label class="field"><span class="field__label">Title (accent / kulay)</span><input type="text" name="hero_titleAccent" value="${esc(h.titleAccent || "")}" /></label>
            <label class="field"><span class="field__label">Tagline</span><input type="text" name="hero_tagline" value="${esc(h.tagline || "")}" /></label>
            <label class="field fw"><span class="field__label">Subtitle</span><textarea name="hero_subtitle" rows="3">${esc(h.subtitle || "")}</textarea></label>
            <label class="field"><span class="field__label">Primary button text</span><input type="text" name="hero_ctaPrimaryLabel" value="${esc((h.ctaPrimary || {}).label || "")}" /></label>
            <label class="field"><span class="field__label">Primary button link</span><input type="text" name="hero_ctaPrimaryHref" value="${esc((h.ctaPrimary || {}).href || "")}" /></label>
            <label class="field"><span class="field__label">Secondary button text</span><input type="text" name="hero_ctaSecondaryLabel" value="${esc((h.ctaSecondary || {}).label || "")}" /></label>
            <label class="field"><span class="field__label">Secondary button link</span><input type="text" name="hero_ctaSecondaryHref" value="${esc((h.ctaSecondary || {}).href || "")}" /></label>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>Stats Strip</h3></div>
          <div class="form-grid">${statRows}</div>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>About Us</h3></div>
          <div class="form-grid">
            <label class="field"><span class="field__label">Kicker</span><input type="text" name="about_kicker" value="${esc(a.kicker || "")}" /></label>
            <label class="field"><span class="field__label">Title (una)</span><input type="text" name="about_titleBefore" value="${esc(a.titleBefore || "")}" /></label>
            <label class="field"><span class="field__label">Title (accent)</span><input type="text" name="about_titleAccent" value="${esc(a.titleAccent || "")}" /></label>
            <label class="field fw"><span class="field__label">Paragraphs — isang linya kada paragraph</span><textarea name="about_paragraphs" rows="6">${esc((a.paragraphs || []).join("\n"))}</textarea></label>
            <label class="field fw"><span class="field__label">Facts / badges — isang linya kada isa</span><textarea name="about_facts" rows="3">${esc((a.facts || []).join("\n"))}</textarea></label>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>Call To Action &amp; Footer</h3></div>
          <div class="form-grid">
            <label class="field"><span class="field__label">CTA title (una)</span><input type="text" name="cta_titleBefore" value="${esc(c.titleBefore || "")}" /></label>
            <label class="field"><span class="field__label">CTA accent</span><input type="text" name="cta_titleAccent" value="${esc(c.titleAccent || "")}" /></label>
            <label class="field"><span class="field__label">CTA title (huli)</span><input type="text" name="cta_titleAfter" value="${esc(c.titleAfter || "")}" /></label>
            <label class="field fw"><span class="field__label">CTA subtitle</span><input type="text" name="cta_subtitle" value="${esc(c.subtitle || "")}" /></label>
            <label class="field"><span class="field__label">CTA button text</span><input type="text" name="cta_button" value="${esc(c.button || "")}" /></label>
            <label class="field fw"><span class="field__label">Footer text</span><input type="text" name="footer_text" value="${esc(f.text || "")}" /></label>
          </div>
        </div>

        <div class="form-error" id="contentError"></div>
        <div class="form-actions"><button class="btn btn--primary" type="submit" id="contentSubmit">Save Landing Page</button></div>
      </form>`;

    $("#contentForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const g = (k) => String(fd.get(k) || "").trim();
      const newStats = [];
      for (let i = 0; i < stats.length; i++) {
        newStats.push({ value: Number(g(`stat_${i}_value`)) || 0, suffix: g(`stat_${i}_suffix`), label: g(`stat_${i}_label`) });
      }
      const payload = {
        hero: {
          badge: g("hero_badge"),
          titleBefore: g("hero_titleBefore"),
          titleAccent: g("hero_titleAccent"),
          tagline: g("hero_tagline"),
          subtitle: g("hero_subtitle"),
          ctaPrimary: { label: g("hero_ctaPrimaryLabel"), href: g("hero_ctaPrimaryHref") },
          ctaSecondary: { label: g("hero_ctaSecondaryLabel"), href: g("hero_ctaSecondaryHref") },
        },
        stats: newStats,
        about: {
          kicker: g("about_kicker"),
          titleBefore: g("about_titleBefore"),
          titleAccent: g("about_titleAccent"),
          paragraphs: g("about_paragraphs").split("\n").map((x) => x.trim()).filter(Boolean),
          facts: g("about_facts").split("\n").map((x) => x.trim()).filter(Boolean),
        },
        cta: {
          titleBefore: g("cta_titleBefore"),
          titleAccent: g("cta_titleAccent"),
          titleAfter: g("cta_titleAfter"),
          subtitle: g("cta_subtitle"),
          button: g("cta_button"),
        },
        footer: { text: g("footer_text") },
      };

      const btn = $("#contentSubmit");
      const err = $("#contentError");
      err.classList.remove("is-show");
      btn.disabled = true;
      try {
        const r = await fetch("/api/admin/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!d.ok) {
          err.textContent = d.error || "Failed to save.";
          err.classList.add("is-show");
          return;
        }
        toast("Landing page updated.", "success");
      } catch {
        err.textContent = "Network error. Could not reach the server.";
        err.classList.add("is-show");
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ============ Realtime updates (SSE) ============ */
  let liveSource = null;
  let refreshTimer = null;
  let deferTimer = null;
  let pendingRefresh = false;

  // Huwag mag-refresh habang nagta-type ang user (modal o inline form), para
  // hindi mabura ang sinulat. Ipagpaliban at isagawa pagkatapos.
  function shouldDeferRefresh() {
    const rec = $("#recordModal");
    const conf = $("#confirmModal");
    if ((rec && rec.classList.contains("is-open")) || (conf && conf.classList.contains("is-open"))) return true;
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function refreshCurrentView() {
    if (currentView === "overview") loadOverview();
    else if (SCHEMAS[currentView]) loadRecordView(currentView);
    else if (currentView === "content") loadContentView();
    else if (currentView === "announcements") loadAnnouncements();
    else if (currentView === "logs") loadLogsView();
    else if (currentView === "settings") loadSettings();
  }

  function refreshAll() {
    loadOverview();
    refreshCurrentView();
  }

  function checkPending() {
    if (!pendingRefresh) {
      clearInterval(deferTimer);
      deferTimer = null;
      return;
    }
    if (shouldDeferRefresh()) return;
    pendingRefresh = false;
    clearInterval(deferTimer);
    deferTimer = null;
    refreshAll();
  }

  function scheduleRefresh() {
    if (shouldDeferRefresh()) {
      pendingRefresh = true;
      if (!deferTimer) deferTimer = setInterval(checkPending, 1000);
      return;
    }
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshAll, 300);
  }

  function pulseLive() {
    const dot = $("#liveDot");
    if (!dot) return;
    dot.classList.remove("is-pulse");
    void dot.offsetWidth;
    dot.classList.add("is-pulse");
  }

  function setLive(on) {
    const dot = $("#liveDot");
    if (!dot) return;
    dot.classList.toggle("is-offline", !on);
    dot.title = on ? "Live updates: naka-connect" : "Live updates: offline, nagre-reconnect...";
  }

  function startLive() {
    if (liveSource || !window.EventSource) return;
    liveSource = new EventSource("/api/events");
    liveSource.addEventListener("open", () => setLive(true));
    liveSource.addEventListener("error", () => setLive(false));
    liveSource.addEventListener("change", () => {
      pulseLive();
      scheduleRefresh();
    });
  }

  function stopLive() {
    if (!liveSource) return;
    liveSource.close();
    liveSource = null;
    setLive(false);
  }

  // I-pause kapag nakatago ang tab (tipid sa Render instance-hours), tapos
  // i-refresh pagbalik ng focus.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLive();
    else {
      startLive();
      scheduleRefresh();
    }
  });

  /* ============ Logout ============ */
  $("#logoutBtn").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  });

  /* ============ Escape closes modals ============ */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeRecordModal();
    closeConfirm();
  });

  /* ============ Init ============ */
  $("#viewDate").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  (async () => {
    const ok = await guard();
    if (ok) {
      switchView("overview");
      startLive();
      // Safety net kung naka-block ang SSE (hal. corporate proxy).
      setInterval(() => {
        if (!document.hidden) scheduleRefresh();
      }, 60000);
    }
  })();
})();
