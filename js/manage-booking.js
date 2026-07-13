// ============================================================================
// Manage-booking page logic: search, edit, pricing feedback, and cancellation.
// ============================================================================

const API_URL = "https://paris-private-backend.onrender.com";

let currentBooking = null;

let manageState = {
  isRoundTrip: false,
  isNight: false,
  estimatedBase: 0,
  estimatedNight: 0,
  estimatedTotal: 0,
  estimatedRoundtrip: 0
};

// Basic presence check used before calling the backend.

function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function statusLabel(status) {
  const labels = {
    pending: "Pending confirmation",
    confirmed: "Confirmed",
    modified: "Modified",
    cancelled: "Cancelled",
    completed: "Completed"
  };
  return labels[status] || status || "Pending";
}

// Reuse the inline message box for loading, success, and error states.
function showMessage(message, type = "info") {
  const box = document.getElementById("searchError");
  if (!box) {
    alert(message);
    return;
  }

  box.className = `error-message ${type}`;
  box.textContent = message;
  box.style.display = "block";
}

// Reset the search feedback area before a new request.
function clearMessage() {
  const box = document.getElementById("searchError");
  if (!box) return;

  box.textContent = "";
  box.style.display = "none";
}

// Small DOM helpers to keep form mapping readable.
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

async function findBooking(e) {
  e.preventDefault();
  clearMessage();

  const customerEmail = getValue("emailInput").trim();
  const bookingNumber = getValue("refInput").trim();

  if (!required(customerEmail) || !customerEmail.includes("@") || !required(bookingNumber)) {
    showMessage("Please enter a valid email and booking reference.", "error");
    return;
  }

  showMessage("Searching reservation...", "info");

  try {
    const response = await fetch(`${API_URL}/api/manage/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        booking_number: bookingNumber,
        customer_email: customerEmail
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showMessage(data.message || "Booking not found.", "error");
      return;
    }

    currentBooking = data.booking;

    renderBooking(currentBooking);
    fillModifyForm(currentBooking);
    updateManagePriceSummary();

    showMessage("Reservation found successfully.", "success");

  } catch (error) {
    console.error(error);
    showMessage("Server error. Please try again.", "error");
  }
}

// Render the current booking summary returned by the backend.
function renderBooking(booking) {
  const bookingSection = document.getElementById("bookingSection");
  const details = document.getElementById("bookingDetails");
  const statusBadge = document.getElementById("statusBadge");
  const refDisplay = document.getElementById("refDisplay");

  if (!bookingSection || !details) return;

  bookingSection.hidden = false;

  if (statusBadge) {
    statusBadge.textContent = statusLabel(booking.status);
    statusBadge.className = `status ${booking.status || "pending"}`;
  }

  if (refDisplay) {
    refDisplay.textContent = booking.booking_number || "";
  }

  details.innerHTML = `
    <div class="booking-grid">
      <div class="booking-item"><span>Customer</span>${booking.customer_name || "-"}</div>
      <div class="booking-item"><span>Email</span>${booking.customer_email || "-"}</div>
      <div class="booking-item"><span>Phone</span>${booking.customer_phone || "-"}</div>
      <div class="booking-item"><span>Service</span>${booking.service_type || "-"}</div>
      <div class="booking-item"><span>Trip Type</span>${booking.trip_type === "round_trip" ? "Round Trip" : "One Way"}</div>
      <div class="booking-item"><span>Pickup</span>${booking.pickup_location || "-"}</div>
      <div class="booking-item"><span>Destination</span>${booking.destination || "-"}</div>
      <div class="booking-item"><span>Date</span>${booking.booking_date || "-"}</div>
      <div class="booking-item"><span>Time</span>${booking.booking_time || "-"}</div>
      <div class="booking-item"><span>Return</span>${
        booking.return_date || booking.return_time
          ? `${booking.return_date || "-"} ${booking.return_time || ""}`
          : "-"
      }</div>
      <div class="booking-item"><span>Vehicle</span>${booking.vehicle_type || "-"}</div>
      <div class="booking-item"><span>Passengers</span>${booking.passengers || "0"} adult(s), ${booking.children || "0"} child(ren)</div>
      <div class="booking-item"><span>Luggage</span>${booking.luggage || "0"}</div>
      <div class="booking-item"><span>Seats</span>Baby: ${booking.baby_seats || "0"} · Child: ${booking.child_seats || "0"}</div>
      <div class="booking-item"><span>Flight</span>${booking.flight_number || "-"}</div>
      <div class="booking-item"><span>Terminal</span>${booking.terminal || "-"}</div>
      <div class="booking-item"><span>Total</span>${booking.price ? formatPrice(booking.price) : "-"}</div>
    </div>
  `;

  const disabled = booking.status === "cancelled";

  const modifyBtn = document.getElementById("modifyBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  if (modifyBtn) modifyBtn.disabled = disabled;
  if (cancelBtn) cancelBtn.disabled = disabled;

  bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Prefill the editable form with the latest stored booking values.
function fillModifyForm(booking) {
  setValue("modService", booking.service_type || "");
  setValue("modPickup", booking.pickup_location || "");
  setValue("modDestination", booking.destination || "");

  setValue("modDate", booking.booking_date || "");
  setValue("modTime", booking.booking_time || "");

  setValue("modReturnDate", booking.return_date || "");
  setValue("modReturnTime", booking.return_time || "");

  setValue("modVehicle", booking.vehicle_type || "");

  setValue("modPassengers", booking.passengers || "");
  setValue("modChildren", booking.children || "0");
  setValue("modLuggage", booking.luggage || "");

  setValue("modBabySeats", booking.baby_seats || "0");
  setValue("modChildSeats", booking.child_seats || "0");

  setValue("modFlight", booking.flight_number || "");
  setValue("modTerminal", booking.terminal || "");
  setValue("modNotes", booking.notes || "");

  setManageTripMode(booking.trip_type === "round_trip");
  autoSelectManageVehicle();
}

// Keep the return-trip UI in sync with the underlying state flag.
function setManageTripMode(roundTrip) {
  manageState.isRoundTrip = roundTrip;

  const checkbox = document.getElementById("modRoundtrip");
  const row = document.getElementById("modReturnRow");
  const wrapper = document.getElementById("modRoundtripWrapper");
  const check = document.getElementById("modRtCheck");
  const badge = document.getElementById("modRtBadge");

  if (checkbox) checkbox.checked = roundTrip;
  if (row) row.style.display = roundTrip ? "grid" : "none";

  wrapper?.classList.toggle("checked", roundTrip);
  check?.classList.toggle("is-checked", roundTrip);
  badge?.classList.toggle("show", roundTrip);

  updateManagePriceSummary();
}

// Reuse the shared pricing grid so manage-booking stays aligned with reservation.
function calculateManagePrice() {
  const result = calculatePrice({
    service: getValue("modService"),
    passengers: Number(getValue("modPassengers")) || 1,
    children: Number(getValue("modChildren")) || 0,
    trip_type: manageState.isRoundTrip ? "round_trip" : "one_way",
    time: getValue("modTime"),
    return_time: getValue("modReturnTime")
  });

  manageState.estimatedBase = result.base;
  manageState.estimatedNight = result.night;
  manageState.estimatedTotal = result.total;
  manageState.estimatedRoundtrip = result.roundtrip ? result.base * 2 : 0;
  manageState.isNight = result.night > 0;
}

// Match the vehicle suggestion logic used on the reservation page.
function autoSelectManageVehicle() {
  const adults = Number(getValue("modPassengers")) || 0;
  const children = Number(getValue("modChildren")) || 0;
  const total = adults + children;
  const vehicleEl = document.getElementById("modVehicle");
  const hintEl = document.getElementById("modVehicleHint");
  const hintText = document.getElementById("modVehicleHintText");

  if (!vehicleEl) return;

  if (total <= 0) {
    hintEl?.classList.remove("show");
    return;
  }

  if (total <= 2) {
    vehicleEl.value = "Premium Sedan";
    if (hintText) hintText.textContent = `${total} passenger${total > 1 ? "s" : ""} — Premium Sedan selected.`;
  } else {
    vehicleEl.value = "Luxury Van 7 seats";
    if (hintText) hintText.textContent = `${total} passengers — Luxury Van 7 seats selected automatically.`;
  }

  hintEl?.classList.add("show");
}

// Refresh the summary card whenever a price-driving field changes.
function updateManagePriceSummary() {
  calculateManagePrice();

  const baseEl = document.getElementById("manageSummaryBase");
  const totalEl = document.getElementById("manageSummaryTotal");
  const passengersRow = document.getElementById("manageSummaryPassengersRow");
  const passengersVal = document.getElementById("manageSummaryPassengers");
  const roundRow = document.getElementById("manageSummaryRoundtripRow");
  const roundVal = document.getElementById("manageSummaryRoundtrip");
  const nightRow = document.getElementById("manageSummaryNightRow");
  const nightVal = document.getElementById("manageSummaryNight");
  const totalPassengers = (Number(getValue("modPassengers")) || 0) + (Number(getValue("modChildren")) || 0);

  if (baseEl) baseEl.textContent = formatPrice(manageState.estimatedBase);
  if (totalEl) totalEl.textContent = formatPrice(manageState.estimatedTotal);

  if (passengersRow) passengersRow.style.display = totalPassengers > 0 ? "flex" : "none";
  if (passengersVal && totalPassengers > 0) {
    passengersVal.textContent = `${totalPassengers} passenger${totalPassengers > 1 ? "s" : ""}`;
  }

  if (roundRow) roundRow.style.display = manageState.isRoundTrip ? "flex" : "none";
  if (roundVal) roundVal.textContent = formatPrice(manageState.estimatedRoundtrip);

  if (nightRow) nightRow.style.display = manageState.isNight ? "flex" : "none";
  if (nightVal) nightVal.textContent = "+" + formatPrice(manageState.estimatedNight);
}

// Submit the modified trip details and refresh the page state with the response.
async function saveModification(e) {
  e.preventDefault();

  if (!currentBooking) {
    showMessage("Please load a booking first.", "error");
    return;
  }

  const submitBtn = document.querySelector("#modifyForm .submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
  }

  showMessage("Saving your changes...", "info");

  const payload = {
    booking_number: currentBooking.booking_number,
    customer_email: currentBooking.customer_email,

    service_type: getValue("modService"),
    trip_type: manageState.isRoundTrip ? "round_trip" : "one_way",

    booking_date: getValue("modDate"),
    booking_time: getValue("modTime"),

    return_date: manageState.isRoundTrip ? getValue("modReturnDate") : null,
    return_time: manageState.isRoundTrip ? getValue("modReturnTime") : null,

    pickup_location: getValue("modPickup").trim(),
    destination: getValue("modDestination").trim(),

    vehicle_type: getValue("modVehicle"),

    passengers: Number(getValue("modPassengers")) || 1,
    children: Number(getValue("modChildren")) || 0,
    luggage: Number(getValue("modLuggage")) || 0,

    baby_seats: Number(getValue("modBabySeats")) || 0,
    child_seats: Number(getValue("modChildSeats")) || 0,

    flight_number: getValue("modFlight").trim(),
    terminal: getValue("modTerminal").trim(),
    notes: getValue("modNotes").trim()
  };

  try {
    const response = await fetch(`${API_URL}/api/manage/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showMessage(result.message || "Unable to update your booking.", "error");
      return;
    }

    currentBooking = result.booking;

    renderBooking(currentBooking);
    fillModifyForm(currentBooking);
    updateManagePriceSummary();

    const section = document.getElementById("modifySection");
    if (section) section.hidden = true;

    showMessage("Your booking has been successfully updated.", "success");

  } catch (err) {
    console.error(err);
    showMessage("Server error. Please try again later.", "error");

  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Changes";
    }
  }
}

// Cancel the booking after the user confirms the modal dialog.
async function cancelBooking() {
  if (!currentBooking) {
    showMessage("Please load a booking first.", "error");
    return;
  }

  const btn = document.getElementById("modalConfirmBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Cancelling...";
  }

  try {
    const response = await fetch(`${API_URL}/api/manage/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        booking_number: currentBooking.booking_number,
        customer_email: currentBooking.customer_email
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showMessage(data.message || "Cancellation failed.", "error");
      return;
    }

    currentBooking = data.booking;
    renderBooking(currentBooking);

    const modal = document.getElementById("cancelModal");
    if (modal) modal.hidden = true;

    showMessage("Booking cancelled successfully. Emails have been sent.", "success");

  } catch (error) {
    console.error(error);
    showMessage("Server error. Please try again.", "error");

  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Yes, Cancel Booking";
    }
  }
}

// Bind all fields that should trigger a live price refresh.
function initManageEvents() {
  const ids = [
    "modService",
    "modPassengers",
    "modChildren",
    "modLuggage",
    "modDate",
    "modTime",
    "modReturnDate",
    "modReturnTime",
    "modVehicle",
    "modBabySeats",
    "modChildSeats"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      if (id === "modPassengers" || id === "modChildren") autoSelectManageVehicle();
      updateManagePriceSummary();
    });
    el.addEventListener("change", () => {
      if (id === "modPassengers" || id === "modChildren") autoSelectManageVehicle();
      updateManagePriceSummary();
    });
  });

  const roundtrip = document.getElementById("modRoundtrip");
  if (roundtrip) {
    roundtrip.addEventListener("change", () => {
      setManageTripMode(roundtrip.checked);
    });
  }

  document.getElementById("modVehicle")?.addEventListener("change", () => {
    document.getElementById("modVehicleHint")?.classList.remove("show");
  });
}

// Wire the page once the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const modifyForm = document.getElementById("modifyForm");

  const modifyBtn = document.getElementById("modifyBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const cancelModifyBtn = document.getElementById("cancelModifyBtn");

  const cancelModal = document.getElementById("cancelModal");
  const modalKeepBtn = document.getElementById("modalKeepBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");

  if (searchForm) searchForm.addEventListener("submit", findBooking);
  if (modifyForm) modifyForm.addEventListener("submit", saveModification);

  if (modifyBtn) {
    modifyBtn.addEventListener("click", () => {
      const section = document.getElementById("modifySection");
      if (section) {
        section.hidden = false;
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (cancelModifyBtn) {
    cancelModifyBtn.addEventListener("click", () => {
      const section = document.getElementById("modifySection");
      if (section) section.hidden = true;
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (cancelModal) cancelModal.hidden = false;
    });
  }

  if (modalKeepBtn) {
    modalKeepBtn.addEventListener("click", () => {
      if (cancelModal) cancelModal.hidden = true;
    });
  }

  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener("click", cancelBooking);
  }

  initManageEvents();
});
