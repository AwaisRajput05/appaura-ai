//new
// src/hooks/usePermissions.js
import { useContext } from 'react';
import { AuthContext } from '../components/auth/hooks/AuthContextDef';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);

  // If no user → deny everything
  if (!user) return { canAccessPath: () => false };

  const { role, applicationRoles = [], businessType } = user;

  const isAdmin = role === 'ADMIN';
  const hasAppRole = (appRole) => applicationRoles.includes(appRole);
  const isPharmacy = businessType === 'PHARMACY';

  const canAccessPath = (path) => {
    if (!path) return true;

    // ADMIN-only routes
    if (path.startsWith('/admin') && !isAdmin) return false;

    // Application-role gated routes
    const appGate = {
      '/admin-vendors/pharmacy-management/search/': 'SEARCH',
      '/admin-vendors/pharmacy-management/salespoint/': 'POS',
      '/admin-vendors/pharmacy-management/inventory/': 'INVENTORY',
      '/admin-vendors/pharmacy-management/sales/': 'SALES',
      '/admin-vendors/pharmacy-management/recommendation/': 'RECOMMENDATION',
    };

    for (const [prefix, required] of Object.entries(appGate)) {
      if (path.startsWith(prefix) && !hasAppRole(required)) return false;
    }

    // Business type gate
    if (path.includes('/pharmacy-management/') && !isPharmacy) return false;

    return true;
  };

  return { canAccessPath, isAdmin, hasAppRole, isPharmacy };
};
