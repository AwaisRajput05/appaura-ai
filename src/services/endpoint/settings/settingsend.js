const BASE_URL = import.meta.env.VITE_BASE_URL;
const Settings_Service = `${BASE_URL}/pharmacy/api/schedule`;
export const apiEndpoints = {

 getSchedule: () =>
    `${Settings_Service}/get`,
    activateSchedule: () =>
    `${Settings_Service}/activate`,

  deactivateSchedule: () =>
    `${Settings_Service}/deactivate`,
  saveSchedule: () =>
    `${Settings_Service}/save`,

  historySchedule: () =>
    `${Settings_Service}/history`,
};