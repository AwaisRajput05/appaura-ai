const BASE_URL = import.meta.env.VITE_BASE_URL;

const CBS_SERVICE = `${BASE_URL}/cbs`;

export const cashBookEndpoints = {

  dayAction: (status = "start") =>
    `${CBS_SERVICE}/day?status=${status}`,

  shiftAction: (status = "start") =>
    `${CBS_SERVICE}/shift?status=${status}`,

  addMovementRecord: `${CBS_SERVICE}/movement-record`,


  dayresume: () => `${CBS_SERVICE}/day-resume`,

 dayStatus: (businessDate = "", shiftId = "") => {
  const params = new URLSearchParams();

  if (businessDate) params.append("businessDate", businessDate);
  if (shiftId) params.append("shiftId", shiftId);

  return `${CBS_SERVICE}/day-status${params.toString() ? `?${params.toString()}` : ""}`;
},
cashFlowReport: (
  date = "",
  staffId = "",
  ledgerKey = "",
  category = ""
) => {
  const params = new URLSearchParams();

  if (date) params.append("date", date);
  if (staffId) params.append("staffId", staffId);
  if (ledgerKey) params.append("ledgerKey", ledgerKey);
  if (category) params.append("category", category);

  return `${CBS_SERVICE}/cash-flow-report${
    params.toString() ? `?${params.toString()}` : ""
  }`;
},
  currentBalance: (date = "") => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);

    return `${CBS_SERVICE}/current-balance${params.toString() ? `?${params.toString()}` : ""}`;
  },

  cashFlowShifts: (
    staffId = "",
    ledgerKey = "",
    category = "",
    fromDate = "",
    toDate = "",
    page = 1,
    pageSize = 10
  ) => {

    const params = new URLSearchParams();

    if (staffId) params.append("staffId", staffId);
    if (ledgerKey) params.append("ledgerKey", ledgerKey);
    if (category) params.append("category", category);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    params.append("page", page);
    params.append("pageSize", pageSize);

    return `${CBS_SERVICE}/cash-flow-shifts?${params.toString()}`;
  }

};