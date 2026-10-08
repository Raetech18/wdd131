const params = new URLSearchParams(window.location.search);

// Increment review counter once the confirmation page loads
let count = 0;
try {
  count = Number(localStorage.getItem("reviewCount")) || 0;
  count += 1;
  localStorage.setItem("reviewCount", count);
} catch (e) { /* storage unavailable */ }
document.querySelector("#count-msg").textContent =
  count ? `You've submitted ${count} review${count === 1 ? "" : "s"} so far.` : "";

const product = products.find(p => p.id === params.get("product"));
const rating = Number(params.get("rating")) || 0;
const features = params.getAll("features");

const rows = [
  ["Product", product ? product.name : params.get("product")],
  ["Rating", rating ? "★".repeat(rating) + "☆".repeat(5 - rating) + ` (${rating} of 5)` : ""],
  ["Installed", params.get("installdate")],
  ["Useful features", features.join(", ")],
  ["Review", params.get("review")],
  ["Name", params.get("username")]
];

const dl = document.querySelector("#summary");
rows.forEach(([label, value]) => {
  if (!value) return;
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value;   // textContent avoids injecting user HTML
  dl.append(dt, dd);
});

document.querySelector("#year").textContent = new Date().getFullYear();
document.querySelector("#modified").textContent = document.lastModified;