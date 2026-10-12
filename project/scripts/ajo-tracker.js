
const STORAGE_KEY = "ajoTrackerMembersV1";
const SETTINGS_KEY = "ajoTrackerSettingsV1";

const sampleMembers = [
  { id: "m1", name: "Amaka Okafor", contact: "Sample member", expected: 10000, paid: 10000 },
  { id: "m2", name: "Bisi Adeyemi", contact: "Sample member", expected: 10000, paid: 6000 },
  { id: "m3", name: "Chidi Eze", contact: "Sample member", expected: 10000, paid: 10000 },
  { id: "m4", name: "Dara Bello", contact: "Sample member", expected: 10000, paid: 0 }
];

const defaultSettings = {
  firstPayoutDate: "",
  roundFrequency: 7,
  roundsCompleted: 0
};

function loadMembers() {
  try {
    const savedMembers = localStorage.getItem(STORAGE_KEY);

    if (savedMembers === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleMembers));
      return sampleMembers.map((member) => ({ ...member }));
    }

    const parsedMembers = JSON.parse(savedMembers);

    if (Array.isArray(parsedMembers)) {
      return parsedMembers.filter((member) =>
        member &&
        typeof member.id === "string" &&
        typeof member.name === "string" &&
        Number.isFinite(Number(member.expected)) &&
        Number.isFinite(Number(member.paid))
      );
    }
  } catch (error) {
    console.warn("Ajo Tracker could not read saved members.", error);
  }

  return sampleMembers.map((member) => ({ ...member }));
}

function saveMembers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.warn("Ajo Tracker could not save members.", error);
    showMessage(
      "form-message",
      "Your browser could not save these records. Check its storage settings.",
      true
    );
  }
}

function loadSettings() {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);

      return {
        firstPayoutDate:
          typeof parsed.firstPayoutDate === "string"
            ? parsed.firstPayoutDate
            : "",

        roundFrequency: [7, 14, 30].includes(Number(parsed.roundFrequency))
          ? Number(parsed.roundFrequency)
          : 7,

        roundsCompleted:
          Number.isInteger(Number(parsed.roundsCompleted)) &&
          Number(parsed.roundsCompleted) >= 0
            ? Number(parsed.roundsCompleted)
            : 0
      };
    }
  } catch (error) {
    console.warn("Ajo Tracker could not read saved settings.", error);
  }

  return { ...defaultSettings };
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.warn("Ajo Tracker could not save settings.", error);
    showMessage(
      "schedule-message",
      "Your browser could not save the schedule settings.",
      true
    );
    return false;
  }
}

let members = loadMembers();
let settings = loadSettings();

function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function getOutstanding(member) {
  return Math.max(0, Number(member.expected) - Number(member.paid));
}

function getTotals() {
  return members.reduce((totals, member) => {
    totals.received += Number(member.paid);
    totals.outstanding += getOutstanding(member);
    return totals;
  }, { received: 0, outstanding: 0 });
}

function showMessage(elementId, message, isError = false) {
  const target = document.querySelector(`#${elementId}`);

  if (!target) return;

  target.textContent = message;
  target.classList.toggle("message-error", isError);
  target.classList.toggle("message-success", !isError);
}

function renderSummaries() {
  const totals = getTotals();

  document.querySelectorAll("#total-contributions").forEach((element) => {
    element.textContent = formatMoney(totals.received);
  });

  document.querySelectorAll("#total-outstanding").forEach((element) => {
    element.textContent = formatMoney(totals.outstanding);
  });

  document.querySelectorAll("#member-count").forEach((element) => {
    element.textContent = `${members.length}`;
  });
}

function getPaymentStatus(member) {
  const outstanding = getOutstanding(member);

  if (outstanding === 0) {
    return { label: "Paid", className: "status-paid" };
  }

  if (Number(member.paid) > 0) {
    return { label: "Part-paid", className: "status-due" };
  }

  return { label: "Not paid", className: "status-none" };
}

function renderMembers(searchTerm = "") {
  const body = document.querySelector("#members-table-body");

  if (!body) return;

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleMembers = members.filter((member) =>
    member.name.toLowerCase().includes(normalizedSearch) ||
    String(member.contact || "").toLowerCase().includes(normalizedSearch)
  );

  if (visibleMembers.length === 0) {
    body.innerHTML = `<tr><td colspan="6">${
      members.length
        ? "No members match your search."
        : "No members yet. Use the form above to add one."
    }</td></tr>`;
    return;
  }

  body.innerHTML = visibleMembers.map((member) => {
    const status = getPaymentStatus(member);

    return `<tr>
      <td>
        <strong>${escapeHTML(member.name)}</strong><br>
        <span class="muted small">${escapeHTML(member.contact || "No contact detail")}</span>
      </td>
      <td>${formatMoney(member.expected)}</td>
      <td>${formatMoney(member.paid)}</td>
      <td>${formatMoney(getOutstanding(member))}</td>
      <td><span class="status ${status.className}">${status.label}</span></td>
      <td>
        <button class="table-action" type="button" data-action="payment" data-id="${escapeHTML(member.id)}">Record payment</button>
        <button class="table-action danger" type="button" data-action="delete" data-id="${escapeHTML(member.id)}">Remove</button>
      </td>
    </tr>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function makePayoutDate(index) {
  if (!settings.firstPayoutDate) return "Not set";

  const date = new Date(`${settings.firstPayoutDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Not set";

  date.setDate(date.getDate() + index * Number(settings.roundFrequency));

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getPotAmount() {
  return members.reduce((sum, member) => sum + Number(member.expected), 0);
}

function renderSchedule() {
  const tableBody = document.querySelector("#schedule-table-body");
  const homeSchedule = document.querySelector("#home-schedule");
  const nextName = document.querySelector("#next-member");
  const nextDetail = document.querySelector("#next-payout-detail");
  const nextHeading = document.querySelector("#next-payout-heading");
  const nextSummary = document.querySelector("#next-payout-summary");
  const emptyNote = document.querySelector("#schedule-empty-note");

  if (members.length === 0) {
    if (tableBody) {
      tableBody.innerHTML =
        `<tr><td colspan="5">No members have been added yet.</td></tr>`;
    }

    if (homeSchedule) {
      homeSchedule.innerHTML =
        `<p class="empty-state">Add members to see the payout rotation here.</p>`;
    }

    if (nextName) nextName.textContent = "No members added yet.";

    if (nextDetail) {
      nextDetail.textContent =
        "Add members on the Member Tracker page to start a rotation.";
    }

    if (nextHeading) {
      nextHeading.textContent = "Add members to build your schedule";
    }

    if (nextSummary) {
      nextSummary.textContent = "Your payout rotation will appear here.";
    }

    if (emptyNote) emptyNote.hidden = false;

    return;
  }

  const pot = getPotAmount();

  // Select the next member using the number of completed rounds.
  const nextIndex = settings.roundsCompleted % members.length;
  const nextMember = members[nextIndex];

  if (nextName) {
    nextName.textContent = nextMember.name;
  }

  if (nextDetail) {
    nextDetail.textContent =
      `Estimated pot per round: ${formatMoney(pot)}.`;
  }

  if (nextHeading) {
    nextHeading.textContent = `${nextMember.name} is next in line`;
  }

  if (nextSummary) {
    nextSummary.textContent =
      `Round ${settings.roundsCompleted + 1} · Estimated pot ${formatMoney(pot)} · Planned date ${makePayoutDate(settings.roundsCompleted)}.`;
  }

  if (emptyNote) emptyNote.hidden = true;

  if (homeSchedule) {
    homeSchedule.innerHTML = members.slice(0, 3).map((member, index) => `
      <div class="preview-row">
        <div>
          <span class="preview-round">Round ${index + 1}</span><br>
          <strong>${escapeHTML(member.name)}</strong>
        </div>
        <span>${makePayoutDate(index)}</span>
      </div>
    `).join("");
  }

  if (tableBody) {
    tableBody.innerHTML = members.map((member, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHTML(member.name)}</strong></td>
        <td>${formatMoney(pot)}</td>
        <td>${makePayoutDate(index)}</td>
        <td>
          <button
            class="table-action"
            type="button"
            data-action="up"
            data-id="${escapeHTML(member.id)}"
            ${index === 0 ? "disabled" : ""}
            aria-label="Move ${escapeHTML(member.name)} up one position"
          >Move up</button>

          <button
            class="table-action"
            type="button"
            data-action="down"
            data-id="${escapeHTML(member.id)}"
            ${index === members.length - 1 ? "disabled" : ""}
            aria-label="Move ${escapeHTML(member.name)} down one position"
          >Move down</button>
        </td>
      </tr>
    `).join("");
  }
}

function renderAll(searchTerm = "") {
  renderSummaries();
  renderMembers(searchTerm);
  renderSchedule();
}

function addMember(event) {
  event.preventDefault();

  const form = event.currentTarget;

  if (!form.reportValidity()) return;

  const nameInput = document.querySelector("#member-name");
  const contactInput = document.querySelector("#member-contact");
  const expectedInput = document.querySelector("#expected-amount");
  const paidInput = document.querySelector("#paid-amount");

  const expected = Number(expectedInput.value);
  const paid = Number(paidInput.value || 0);

  if (
    !nameInput.value.trim() ||
    !Number.isFinite(expected) ||
    expected <= 0 ||
    !Number.isFinite(paid) ||
    paid < 0
  ) {
    showMessage(
      "form-message",
      "Enter a name, a positive expected contribution, and a payment of zero or more.",
      true
    );
    return;
  }

  if (paid > expected) {
    showMessage(
      "form-message",
      "The amount paid cannot exceed the expected contribution for this demo round.",
      true
    );
    return;
  }

  const duplicate = members.some(
    (member) =>
      member.name.toLowerCase() === nameInput.value.trim().toLowerCase()
  );

  if (duplicate) {
    showMessage(
      "form-message",
      "A member with that name is already on the list. Use a distinct name for each person.",
      true
    );
    return;
  }

  const memberName = nameInput.value.trim();

  members.push({
    id: `m${Date.now()}${Math.floor(Math.random() * 1000)}`,
    name: memberName,
    contact: contactInput.value.trim(),
    expected,
    paid
  });

  saveMembers();
  renderAll(document.querySelector("#member-search")?.value || "");
  form.reset();

  showMessage("form-message", `${memberName} has been added to the group.`);
  document.querySelector("#member-name")?.focus();
}

function handleMemberTableClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const member = members.find((item) => item.id === button.dataset.id);

  if (!member) return;

  if (button.dataset.action === "payment") {
    const amountDue = getOutstanding(member);

    if (amountDue <= 0) {
      showMessage(
        "form-message",
        `${member.name} has already paid the expected contribution.`
      );
      return;
    }

    const payment = window.prompt(
      `Enter the additional payment from ${member.name} (up to ${formatMoney(amountDue)}):`,
      `${amountDue}`
    );

    if (payment === null) return;

    const amount = Number(payment);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > amountDue
    ) {
      showMessage(
        "form-message",
        `Enter an amount greater than zero and no more than ${formatMoney(amountDue)}.`,
        true
      );
      return;
    }

    member.paid = Number(member.paid) + amount;

    saveMembers();
    renderAll(document.querySelector("#member-search")?.value || "");

    showMessage("form-message", `Payment recorded for ${member.name}.`);
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(
      `Remove ${member.name} from this demo group? This cannot be undone unless you restore the sample data.`
    );

    if (!confirmed) return;

    members = members.filter((item) => item.id !== member.id);

    saveMembers();
    renderAll(document.querySelector("#member-search")?.value || "");

    showMessage("form-message", `${member.name} has been removed.`);
  }
}

function handleScheduleClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button || button.disabled) return;

  const index = members.findIndex(
    (member) => member.id === button.dataset.id
  );

  if (index < 0) return;

  if (button.dataset.action === "up" && index > 0) {
    [members[index - 1], members[index]] =
      [members[index], members[index - 1]];
  } else if (
    button.dataset.action === "down" &&
    index < members.length - 1
  ) {
    [members[index + 1], members[index]] =
      [members[index], members[index + 1]];
  }

  saveMembers();
  renderAll(document.querySelector("#member-search")?.value || "");
}

function updateScheduleSettings(event) {
  event.preventDefault();

  const dateInput = document.querySelector("#first-payout-date");
  const frequencyInput = document.querySelector("#round-frequency");

  settings.firstPayoutDate = dateInput.value;
  settings.roundFrequency = Number(frequencyInput.value);

  if (saveSettings()) {
    renderSchedule();
    showMessage("schedule-message", "Your payout schedule has been updated.");
  }
}

function completePayoutRound() {
  if (members.length === 0) {
    showMessage(
      "schedule-message",
      "Add members before completing a payout round.",
      true
    );
    return;
  }

  settings.roundsCompleted += 1;

  if (saveSettings()) {
    renderSchedule();

    showMessage(
      "schedule-message",
      `Round ${settings.roundsCompleted} completed. The next payout has been updated.`
    );
  } else {
    // Restore the count if the browser could not save it.
    settings.roundsCompleted -= 1;
  }
}

function restoreSampleData() {
  const confirmed = window.confirm(
    "Restore the original sample members? Your current demo member list will be replaced."
  );

  if (!confirmed) return;

  members = sampleMembers.map((member) => ({ ...member }));

  saveMembers();
  renderAll("");

  const searchInput = document.querySelector("#member-search");

  if (searchInput) searchInput.value = "";

  showMessage("form-message", "Sample data restored.");
}

function setupNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", `${!isExpanded}`);
    nav.classList.toggle("is-open", !isExpanded);
  });
}

function setupPage() {
  document.querySelectorAll("#current-year").forEach((element) => {
    element.textContent = `${new Date().getFullYear()}`;
  });

  setupNavigation();

  const memberForm = document.querySelector("#member-form");

  if (memberForm) {
    memberForm.addEventListener("submit", addMember);
  }

  const memberTable = document.querySelector("#members-table-body");

  if (memberTable) {
    memberTable.addEventListener("click", handleMemberTableClick);
  }

  const searchInput = document.querySelector("#member-search");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderMembers(searchInput.value);
    });
  }

  const resetButton = document.querySelector("#reset-demo");

  if (resetButton) {
    resetButton.addEventListener("click", restoreSampleData);
  }

  const settingsForm = document.querySelector("#schedule-settings-form");

  if (settingsForm) {
    const dateInput = document.querySelector("#first-payout-date");
    const frequencyInput = document.querySelector("#round-frequency");

    dateInput.value = settings.firstPayoutDate;
    frequencyInput.value = `${settings.roundFrequency}`;

    settingsForm.addEventListener("submit", updateScheduleSettings);
  }

  const scheduleBody = document.querySelector("#schedule-table-body");

  if (scheduleBody) {
    scheduleBody.addEventListener("click", handleScheduleClick);
  }

  // Listen for the button that completes the current payout round.
  const completeRoundButton = document.querySelector("#complete-payout-round");

  if (completeRoundButton) {
    completeRoundButton.addEventListener("click", completePayoutRound);
  }

  renderAll();
}

document.addEventListener("DOMContentLoaded", setupPage);
