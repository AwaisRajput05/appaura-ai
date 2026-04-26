// ========================= allApi.js =========================

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ADMIN_SERVICE = `${BASE_URL}/admin/api/permission`;
const EMPLOYEE_SERVICE = `${BASE_URL}/employee`;

// ✅ Renamed to adminApiEndpoints so existing imports don't break
export const adminApiEndpoints = {

  // 1) SAVE PERMISSION — requires fileName query param
  savePermission: (fileName = "") =>
    `${ADMIN_SERVICE}/save${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ""}`,

  // 2) UPDATE PERMISSION
  // status: "updateName" | "updateFileName" | "both"
  updatePermission: (status) =>
    `${ADMIN_SERVICE}/update?status=${status}`,

  // 3) SAVE / UPDATE MODULE PERMISSIONS
  // status: "save" | "update"
  saveOrUpdateModules: (status) =>
    `${ADMIN_SERVICE}/save-modules?status=${status}`,

  // 4) GET GLOBAL PERMISSIONS
  // Pass employeePermissions=true with vendorId+employeeId for employee-specific perms
  // Pass employeePermissions=false (or omit) for all global permissions
 getGlobalPermissions: (
  vendorId = "",
  employeeId = "",
  employeePermissions = "",
  status = "",
  module = "",
  fileName = ""
) => {
  const params = new URLSearchParams();

  if (vendorId) params.append("vendorId", vendorId);
  if (employeeId) params.append("employeeId", employeeId);
  if (employeePermissions !== "") params.append("employeePermissions", employeePermissions);
  if (status) params.append("status", status);
  if (module) params.append("module", module);
  if (fileName) params.append("fileName", fileName);

  return `${EMPLOYEE_SERVICE}/global-permissions${
    params.toString() ? `?${params.toString()}` : ""
  }`;
},
  // 5) CHANGE PERMISSION STATUS
  // Body: { ids: [1,2,3], status: "active" | "inactive" }
  changePermissionStatus: () =>
    `${EMPLOYEE_SERVICE}/change-status`,

};

// ✅ Separate named export for employee-side APIs
export const employeeApiEndpoints = {

  // 6) SAVE / UPDATE EMPLOYEE
  saveEmployee: (employeeId = "") =>
    `${EMPLOYEE_SERVICE}/save${employeeId ? `?employeeId=${employeeId}` : ""}`,

  // 7) RESEND VERIFICATION
  resendVerification: (email) =>
    `${EMPLOYEE_SERVICE}/verification/resend?email=${encodeURIComponent(email)}`,

  // 8) GET EMPLOYEES
  getEmployees: (status = "", search = "", fromDate = "", toDate = "", page = 1, page_size = 10) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    params.append("page", page);
    params.append("page_size", page_size);
    return `${EMPLOYEE_SERVICE}?${params.toString()}`;
  },

  // 9) UPDATE PASSWORD
  updatePassword: (employeeId, newPassword) =>
    `${EMPLOYEE_SERVICE}/update-password?employeeId=${employeeId}&newPassword=${encodeURIComponent(newPassword)}`,
  // 9.5) CHECK IF EMAIL EXISTS
  emailcheck: (email) =>
    `${EMPLOYEE_SERVICE}/email-exist?email=${encodeURIComponent(email)}`,
  // 10) UPDATE EMPLOYEE PERMISSIONS
  // status: "FILENAME_UPDATE" | "PHARMA_ROLE_UPDATE"
  updatePermissions: (employeeId, status) =>
    `${EMPLOYEE_SERVICE}/update-permissions?employeeId=${employeeId}&status=${status}`,

  // 11) GET EMPLOYEE PERMISSIONS
  // type: "all" | "filenames" | "roles"
  getEmployeePermissions: (employeeId, includeNote = false, type = "all") => {
    const params = new URLSearchParams();
    params.append("employeeId", employeeId);
    params.append("includeNote", includeNote);
    if (type) params.append("type", type);
    return `${EMPLOYEE_SERVICE}/permissions?${params.toString()}`;
  },

  // 12) GET PHARMA ROLES
  // type: "all" | "global" | "custom"
  getPharmaRoles: (type = "") =>
    `${EMPLOYEE_SERVICE}/pharma-roles${type ? `?type=${type}` : ""}`,

  // 13) SAVE / UPDATE PHARMA ROLE
  // status: "save" | "UPDATE"
  savePharmaRole: (status = "save") =>
    `${EMPLOYEE_SERVICE}/pharma-role?status=${status}`,

  // 14) GET GLOBAL MODULES
  getGlobalModules: () =>
    `${EMPLOYEE_SERVICE}/global-modules`,

  // 15) GET EMPLOYEES BY PHARMA ROLE
  getEmployeesByPharmaRole: (pharmaRole = "") =>
    `${EMPLOYEE_SERVICE}/by-pharma-role${
      pharmaRole ? `?pharmaRole=${encodeURIComponent(pharmaRole)}` : ""
    }`,

  // 16) GET PHARMA ROLE DETAILS (or specific role data)
  deletePharmaRoleByName: (pharmaRole = "") =>
    `${EMPLOYEE_SERVICE}/pharma-role${
      pharmaRole ? `?pharmaRole=${encodeURIComponent(pharmaRole)}` : ""
    }`,

};