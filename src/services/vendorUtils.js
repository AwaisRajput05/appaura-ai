// src/services/vendorUtils.js
export const getVendorChildIds = () => {
  try {
    const stored = localStorage.getItem("vendor_child_ids");
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Error reading vendor_child_ids:", err);
    return [];
  }
};
