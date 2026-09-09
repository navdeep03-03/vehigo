const navToggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("[data-menu]");
const header = document.querySelector("[data-header]");

const setMenuState = (isOpen) => {
  if (!navToggle || !menu) return;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  menu.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
};

if (navToggle && menu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });
}

if (header) {
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
const tabPanels = Array.from(document.querySelectorAll("[data-panel]"));

const activateTab = (button) => {
  const selected = button.dataset.tab;

  tabButtons.forEach((tab) => {
    const isSelected = tab.dataset.tab === selected;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.setAttribute("tabindex", isSelected ? "0" : "-1");
  });

  tabPanels.forEach((panel) => {
    const isSelected = panel.dataset.panel === selected;
    panel.classList.toggle("is-active", isSelected);
    panel.hidden = !isSelected;
  });
};

tabButtons.forEach((button, index) => {
  button.setAttribute("tabindex", button.classList.contains("is-active") ? "0" : "-1");

  button.addEventListener("click", () => {
    activateTab(button);
  });

  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const lastIndex = tabButtons.length - 1;
    const nextIndex = {
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      ArrowRight: index === lastIndex ? 0 : index + 1,
      Home: 0,
      End: lastIndex,
    }[event.key];

    const nextButton = tabButtons[nextIndex];
    activateTab(nextButton);
    nextButton.focus();
  });
});

const checkForm = document.querySelector("[data-check-form]");
const statusLine = document.querySelector("[data-status-line]");

const demoVehicles = {
  MH12AB4581: { challans: 2, renewalDays: 18, risk: "review" },
  GJ05CK7710: { challans: 1, renewalDays: 64, risk: "payable" },
  DL01TR2244: { challans: 3, renewalDays: 9, risk: "blocked" },
  KA03FT9231: { challans: 0, renewalDays: 6, risk: "urgent" },
  HR55AA6567: { challans: 0, renewalDays: 42, risk: "valid" },
};

const normalizeVehicle = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);

if (checkForm && statusLine) {
  checkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(checkForm);
    const vehicle = normalizeVehicle(formData.get("vehicle")) || "MH12AB4581";
    const record = demoVehicles[vehicle];

    if (record) {
      const challanCopy = record.challans === 1 ? "1 pending challan" : `${record.challans} pending challans`;
      statusLine.textContent = `Demo vehicle ${vehicle} has ${challanCopy}, renewal due in ${record.renewalDays} days, and a ${record.risk} status.`;
      return;
    }

    statusLine.textContent = `Demo vehicle ${vehicle} is not in the sample fleet yet. Add it during onboarding to start challan and renewal checks.`;
  });
}

const copyButton = document.querySelector("[data-copy-code]");
const copyLabel = document.querySelector("[data-copy-label]");
const codeBlock = document.querySelector("[data-code]");

const setCopyLabel = (label) => {
  if (copyLabel) {
    copyLabel.textContent = label;
  }
};

if (copyButton && codeBlock) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(codeBlock.textContent.trim());
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    } catch {
      setCopyLabel("Select");
      window.setTimeout(() => setCopyLabel("Copy"), 1400);
    }
  });
}

const leadForm = document.querySelector("[data-lead-form]");
const formNote = document.querySelector("[data-form-note]");
const leadSummary = document.querySelector("[data-lead-summary]");
const exportButton = document.querySelector("[data-export-leads]");
const LEAD_STORAGE_KEY = "vehigo.demoLeads";

const storage = {
  read() {
    try {
      const leads = JSON.parse(window.localStorage.getItem(LEAD_STORAGE_KEY) || "[]");
      return Array.isArray(leads) ? leads : [];
    } catch {
      return [];
    }
  },
  write(leads) {
    try {
      window.localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leads));
      return true;
    } catch {
      return false;
    }
  },
};

const formatDate = (isoDate) =>
  Number.isNaN(new Date(isoDate).getTime())
    ? "recently"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(isoDate));

const escapeCsv = (value) => `"${String(value || "").replaceAll('"', '""')}"`;

const renderLeadSummary = () => {
  if (!leadSummary || !exportButton) return;

  const leads = storage.read();
  exportButton.disabled = leads.length === 0;
  leadSummary.replaceChildren();

  const title = document.createElement("strong");
  const detail = document.createElement("span");

  if (!leads.length) {
    title.textContent = "No saved demo requests yet.";
    detail.textContent = " Submissions will appear here for quick handoff.";
    leadSummary.append(title, detail);
    return;
  }

  const latest = leads[leads.length - 1];
  title.textContent = `${leads.length} saved demo ${leads.length === 1 ? "request" : "requests"}`;
  detail.textContent = ` Latest: ${latest.company} for ${latest.fleet} on ${formatDate(latest.createdAt)}.`;
  leadSummary.append(title, detail);
};

const createCsv = (leads) => {
  const columns = ["createdAt", "name", "email", "company", "phone", "fleet", "problem", "notes"];
  const rows = leads.map((lead) => columns.map((column) => escapeCsv(lead[column])).join(","));
  return [columns.join(","), ...rows].join("\n");
};

if (leadForm && formNote) {
  renderLeadSummary();

  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const lead = {
      createdAt: new Date().toISOString(),
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      fleet: String(formData.get("fleet") || "").trim(),
      problem: String(formData.get("problem") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };

    const leads = [...storage.read(), lead].slice(-100);
    const saved = storage.write(leads);

    formNote.textContent = saved
      ? `Saved ${lead.company}'s request locally. Export the CSV when you are ready to follow up.`
      : "Request captured for this session, but browser storage is unavailable.";

    leadForm.reset();
    renderLeadSummary();
  });
}

if (exportButton) {
  exportButton.addEventListener("click", () => {
    const leads = storage.read();
    if (!leads.length) return;

    const blob = new Blob([createCsv(leads)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehigo-demo-requests.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}
