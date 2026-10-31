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
  const dataCache = { members: [], teams: [], championships: [], sponsorships: [] };

  /* ============ Session guard ============ */
  async function guard() {
    try {
      const r = await fetch("/api/session");
      const d = await r.json();
      if (!d.authenticated) { window.location.href = "/"; return false; }
      user = d.user;
      $("#userName").textContent = user.displayName || user.username;
      $("#userAvatar").textContent = (user.displayName || user.username).charAt(0).toUpperCase();
      return true;
    } catch { window.location.href = "/"; return false; }
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
      announcements: "Announcements",
    };
    $("#viewTitle").textContent = titles[view] || view;

    closeSidebar();
    if (view === "overview") loadOverview();
    else if (SCHEMAS[view]) loadRecordView(view);
    else if (view === "announcements") loadAnnouncements();
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

      // stat cards
      $("#statsGrid").innerHTML = [
        { ico: "◉", color: "cyan", val: s.members, lbl: "Total Members", sub: s.activeMembers + " active" },
        { ico: "▣", color: "violet", val: s.teams, lbl: "Active Teams" },
        { ico: "♛", color: "magenta", val: s.championships, lbl: "Tournaments", sub: s.titles + " titles won" },
        { ico: "✦", color: "green", val: s.sponsorships, lbl: "Sponsors", sub: s.activeSponsors + " active" },
      ].map((x) => `
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

      // recent titles
      $("#recentTitles").innerHTML = d.recentChampionships.map((c) => `
        <li>
          <span class="activity__medal">♛</span>
          <span class="activity__txt"><b>${esc(c.name)}</b><span>${esc(c.team)} · ${esc(c.placement)} · ${esc(c.date || "")}</span></span>
        </li>`).join("") || `<li style="justify-content:center;color:var(--muted)">No championships yet.</li>`;
    } catch (e) { console.error(e); }
  }

  function cellHTML(col, row) {
    if (col.photo) return thumbHTML(row[col.key], row);
    if (col.badge) return badge(row[col.key]);
    return esc(row[col.key] || "—");
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
            <button class="act act--edit" data-edit="${r.id}">Edit</button>
            <button class="act act--del" data-del="${r.id}">Delete</button>
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
          ${f.options.map((o) => `<option value="${esc(o)}" ${record && record[f.key] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
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
    schema.fields.forEach((f) => { payload[f.key] = (formData.get(f.key) || "").toString().trim(); });

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
    if (ok) switchView("overview");
  })();
})();
