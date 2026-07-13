const API_URL = "https://paris-private-backend.onrender.com";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function confirmBooking() {
  if (!token) {
    console.error("Invalid confirmation link.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    const result = await response.json();

    if (!result.success) {
      console.error(result.message || "Confirmation failed.");
      return;
    }

    console.log("Booking confirmed:", result.booking_number);

  } catch (error) {
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", confirmBooking);
