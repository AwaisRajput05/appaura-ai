import { useContext } from 'react';
import { AuthContext } from './AuthContextDef';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const branchRoles = context.user?.currentBranch?.applicationRoles || [];
  const defaultRoles = context.user?.defaultApplicationRoles || [];

  // Use branch roles when a branch is selected, otherwise fall back to default
  const effectivePermissions =
    branchRoles.length > 0 ? branchRoles : defaultRoles;

  return {
    ...context,
    branchPermissions: effectivePermissions,
  };
};
