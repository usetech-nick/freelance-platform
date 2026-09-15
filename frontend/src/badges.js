export function riskBadgeClass(category) {
  if (category === "Low") return "badge badge-low";
  if (category === "Medium") return "badge badge-medium";
  if (category === "High") return "badge badge-high";
  return "badge";
}

export function statusBadgeClass(statusIndex) {
  const classes = [
    "badge badge-pending",
    "badge badge-submitted",
    "badge badge-approved",
  ];
  return classes[statusIndex] || "badge";
}
