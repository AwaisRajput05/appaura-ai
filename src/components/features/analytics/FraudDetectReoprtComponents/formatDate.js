export const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const formatDecimal = (val, digits = 2) => Number.isFinite(val) ? val.toFixed(digits) : "N/A";
