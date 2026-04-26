import { useState, useEffect } from 'react';
import { removeToken } from '../../../services/tokenUtils';
import {
  login,
  signup,
  signupViaFetch,
  checkUsernameExists,
} from '../../../services/AuthEndpoints';
import { AuthContext } from './AuthContextDef';
import apiService from '../../../services/apiService';
import { apiEndpoints } from '../../../services/apiEndpoints';

// ─── Module code → sidebar permission key mapping ────────────────────────────
// (Kept for branch sub-accounts / vendors — employees now use file-based permissions)
const MODULE_TO_PERMISSION = {
  POS: 'POS',
  SC: 'SEARCH',
  INV: 'INVENTORY',
  MI: 'INVENTORY', // Add Stock / Medicine Inventory — same sidebar section
  SR: 'SALES',
  OD: 'ORDER_MANAGEMENT',
  MS: 'ORDER_MANAGEMENT', // Supplier sits under Order Management section
  DB: 'DASHBOARD',
  PM: 'PAYMENTS',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore from localStorage on refresh ──────────────────────────────────
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');
    const businessType = localStorage.getItem('businessType');
    const currentBranch = localStorage.getItem('currentBranch');
    const applicationRoles = localStorage.getItem('applicationRoles');
    const isMaster = localStorage.getItem('isMaster');
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const emailAddress = localStorage.getItem('emailAddress');
    const subAccountType = localStorage.getItem('subAccountType');
    const businessName = localStorage.getItem('businessName');
    const branchId = localStorage.getItem('branchId');
    const subscriptionStatus = localStorage.getItem('subscriptionStatus');
    const organizationType = localStorage.getItem('organizationType');
    // Employee-specific
    const employeeId = localStorage.getItem('employeeId');
    const employeePermissions = localStorage.getItem('employeePermissions');
    const employeeModules = localStorage.getItem('employeeModules');
    const employeeName = localStorage.getItem('employeeName');
    const employeeEmail = localStorage.getItem('employeeEmail');

    if (accessToken && role) {
      setUser({
        userId: localStorage.getItem('userId'),
        role,
        businessType: businessType || 'GROCERY',
        vendorId: role === 'VENDOR' ? localStorage.getItem('vendorId') : null,
        companyName: businessName || localStorage.getItem('companyName'),
        accessToken,
        currentBranch: currentBranch ? JSON.parse(currentBranch) : null,
        defaultApplicationRoles: applicationRoles ? JSON.parse(applicationRoles) : [],
        isMaster: isMaster === 'true',
        firstName,
        lastName,
        subAccountType,
        emailAddress,
        branchId,
        subscriptionStatus,
        organizationType: organizationType || null,
        // Employee fields
        employeeId: employeeId || null,
        employeePermissions: employeePermissions ? JSON.parse(employeePermissions) : [],
        employeeModules: employeeModules ? JSON.parse(employeeModules) : [],
        employeeName: employeeName || null,
        employeeEmail: employeeEmail || null,
      });

      if (subAccountType === 'FINANCE') {
        const fetchFinanceData = async () => {
          try {
            const response = await apiService.get(apiEndpoints.financeDashboard, {
              params: { account_type: 'FINANCE' },
            });
            if (response.data?.vendor_child_ids)
              localStorage.setItem('vendor_child_ids', JSON.stringify(response.data.vendor_child_ids));
            if (response.data?.subscription) {
              localStorage.setItem('subscription_plan', response.data.subscription.plan);
              localStorage.setItem('subscription_status', response.data.subscription.status);
              localStorage.setItem('subscription_remaining_days', response.data.subscription.remaining_days);
            }
          } catch (err) {
            console.warn('Failed to load finance child vendors:', err);
          }
        };
        fetchFinanceData();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const normalizeSignupPayload = (v) => ({
    companyName: v.companyName || v.businessName,
    email: v.email || v.emailAddress,
    password: v.password,
    contactInfo: v.phoneNumber,
    contactNumber: v.phoneNumber,
    contact: v.phoneNumber,
    phone: v.phoneNumber,
    category: v.businessType,
    businessCategory: v.businessType,
    logoUrl: v.logoUrl,
    logo: v.logoImage,
    organizationType: v.organizationType,
    branchCode: v.pharmacyCode,
    branchId: v.branchId,
    subAccountCode: v.subAccountCode,
    subAccountType: v.subAccountType,
  });

  const signUp = async (vendor) => {
    setLoading(true);
    try {
      const isFormData = vendor instanceof FormData;
      let response;
      if (isFormData) {
        response = await signup(vendor, { isFormData: true }).catch(async (err) => {
          if (err.code === 'ECONNABORTED') return await signupViaFetch(vendor);
          throw err;
        });
      } else {
        response = await signup(normalizeSignupPayload(vendor));
      }
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  // ── Sign In ──────────────────────────────────────────────────────────────

  const signIn = async (credentials) => {
    setLoading(true);
    try {
      const response = await login(credentials);
      
      // 🔥 NEW: Check if CAPTCHA is required from backend response
      if (response.data.captchaRequired === true) {
        const error = new Error(response.data.message || "Captcha verification is required");
        error.captchaRequired = true;
        error.response = response; // Keep original response for debugging
        throw error;
      }
      
      const {
        userId, accessToken, refreshToken, expiresIn,
        role, vendorId, companyName, businessType,
        applicationRoles = [], isMaster, firstName, lastName,
        emailAddress, subAccountType, businessName,
        branchId, subscriptionStatus, organizationType,
        employeeId,
      } = response.data;

      const finalVendorId = role === 'VENDOR' && !vendorId ? userId : vendorId;
      if (!accessToken) return response.data;

      // ── Persist base auth ──
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);
      localStorage.setItem('businessType', businessType || 'GROCERY');
      if (finalVendorId) localStorage.setItem('vendorId', finalVendorId);
      if (companyName) localStorage.setItem('companyName', companyName);
      if (firstName) localStorage.setItem('firstName', firstName);
      if (lastName) localStorage.setItem('lastName', lastName);
      if (emailAddress) localStorage.setItem('emailAddress', emailAddress);
      if (businessName) localStorage.setItem('businessName', businessName);
      if (subAccountType) localStorage.setItem('subAccountType', subAccountType);
      localStorage.setItem('applicationRoles', JSON.stringify(applicationRoles));
      localStorage.setItem('isMaster', !!isMaster);
      if (branchId) localStorage.setItem('branchId', branchId);
      if (subscriptionStatus) localStorage.setItem('subscriptionStatus', subscriptionStatus);
      if (expiresIn) localStorage.setItem('expiresAt', (Date.now() + expiresIn * 1000).toString());
      if (organizationType) localStorage.setItem('organizationType', organizationType);

      // ── Employee: fetch & store permissions ──
      let employeePermissions = [];
      let employeeModules = [];
      let employeeName = null;
      let employeeEmail = null;

      if (employeeId) {
        localStorage.setItem('employeeId', employeeId);
        try {
          const permRes = await apiService.get(
            apiEndpoints.getEmployeePermissions(employeeId),
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              timeout: 15000,
            }
          );

          const fileInfo = permRes?.data?.data?.fileInfo || [];
          const employeeInfo = permRes?.data?.data?.employeeInfo || [];
          
          employeePermissions = fileInfo
            .map((item) => item?.fileName)
            .filter(Boolean);
          employeeModules = [];

          // Save employee name and email from employeeInfo array
          if (employeeInfo.length > 0) {
            employeeName = employeeInfo[0]?.name || null;
            employeeEmail = employeeInfo[0]?.emailAddress || null;
          }

          localStorage.setItem('employeePermissions', JSON.stringify(employeePermissions));
          localStorage.setItem('employeeModules', JSON.stringify(employeeModules));
          
          // Save employee name and email to localStorage
          if (employeeName) localStorage.setItem('employeeName', employeeName);
          if (employeeEmail) localStorage.setItem('employeeEmail', employeeEmail);
          
        } catch (err) {
          console.warn('Could not fetch employee permissions:', err);
          employeePermissions = [];
          employeeModules = [];
          localStorage.setItem('employeePermissions', JSON.stringify(employeePermissions));
          localStorage.setItem('employeeModules', JSON.stringify(employeeModules));
          localStorage.removeItem('employeeName');
          localStorage.removeItem('employeeEmail');
        }
      } else {
        localStorage.removeItem('employeeId');
        localStorage.removeItem('employeePermissions');
        localStorage.removeItem('employeeModules');
        localStorage.removeItem('employeeName');
        localStorage.removeItem('employeeEmail');
      }

      const userState = {
        userId,
        role,
        businessType: businessType || 'GROCERY',
        accessToken,
        vendorId: finalVendorId,
        companyName: companyName || businessName,
        currentBranch: null,
        defaultApplicationRoles: applicationRoles,
        isMaster: !!isMaster,
        firstName,
        lastName,
        subAccountType,
        emailAddress,
        branchId,
        subscriptionStatus,
        organizationType: organizationType || null,
        employeeId: employeeId || null,
        employeePermissions,
        employeeModules,
        employeeName,
        employeeEmail,
      };

      setUser(userState);

      if (window.apiService?.defaults?.headers) {
        window.apiService.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      if (subAccountType === 'FINANCE') {
        try {
          const financeResp = await apiService.get(apiEndpoints.financeDashboard, {
            params: { account_type: 'FINANCE' },
          });
          if (financeResp.data?.vendor_child_ids)
            localStorage.setItem('vendor_child_ids', JSON.stringify(financeResp.data.vendor_child_ids));
          if (financeResp.data?.subscription) {
            localStorage.setItem('subscription_plan', financeResp.data.subscription.plan);
            localStorage.setItem('subscription_status', financeResp.data.subscription.status);
            localStorage.setItem('subscription_remaining_days', financeResp.data.subscription.remaining_days);
          }
        } catch (err) {
          console.warn('Finance dashboard fetch failed after login:', err);
        }
      }

      return response.data;
    } catch (err) {
      // 🔥 NEW: Check if error response contains captchaRequired flag
      if (err.response?.data?.captchaRequired === true) {
        const captchaError = new Error(err.response.data.message || "Captcha verification is required");
        captchaError.captchaRequired = true;
        captchaError.response = err.response;
        throw captchaError;
      }
      
      // Handle regular errors
      const msg = err.response?.data?.message || err.message || 'Login failed';
      const error = new Error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ── Branch Selection ──────────────────────────────────────────────────────
  const selectBranch = (branch) => {
    if (!branch) {
      localStorage.removeItem('currentBranch');
      setUser((prev) => ({ ...prev, currentBranch: null }));
      return;
    }
    const branchData = {
      id: branch.branchId || branch.id,
      vendorId: branch.vendorId,
      applicationRoles: branch.applicationRoles || [],
    };
    localStorage.setItem('currentBranch', JSON.stringify(branchData));
    setUser((prev) => ({ ...prev, currentBranch: branchData }));
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    removeToken();
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  };

  // ── Derived permission helpers ────────────────────────────────────────────
  const isEmployee = !!user?.employeeId;

  /**
   * hasModulePermission("POS") → true/false
   * Works for branch sub-accounts (unchanged).
   * For employees: now file-based — you should use `hasFilePermission("Sell Medicine")` instead.
   */
  const hasModulePermission = (permissionKey) => {
    // For employees, ALWAYS return true - don't hide any modules from Auth
    // We'll handle permissions separately in sidebar later
    if (isEmployee) {
      return true; // ← SHOW EVERYTHING for employees
    }
    // Branch sub-account (existing behaviour)
    const branchPermissions =
      user?.currentBranch?.applicationRoles?.length > 0
        ? user.currentBranch.applicationRoles
        : user?.defaultApplicationRoles || [];
    return branchPermissions.includes(permissionKey);
  };
  
  /**
   * NEW: Check file-level permission for employees
   * Example: hasFilePermission("Sell Medicine") → true/false
   * Vendors see everything.
   */
  const hasFilePermission = (fileName) => {
    if (!isEmployee) return true; // vendors see everything
    return user?.employeePermissions?.includes(fileName) ?? false;
  };

  /**
   * hasPermissionById(3) → kept for backward compatibility but will always return false for new employees
   * (new backend uses fileNames instead of numeric permissionIds)
   */
  const hasPermissionById = (permissionId) => {
    if (!isEmployee) return true; // vendors see everything
    return user?.employeePermissions?.some((p) => p.permissionIds === permissionId) ?? false;
  };

  // ── Context Value ─────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    signUp,
    signIn,
    checkUsernameExists,
    logout,
    isAuthenticated: !!user,
    selectBranch,
    isEmployee,
    hasModulePermission,
    hasPermissionById,
    hasFilePermission, // ← new helper for the file-based system
    // Keep old key so nothing else breaks
    branchPermissions:
      user?.currentBranch?.applicationRoles?.length > 0
        ? user.currentBranch.applicationRoles
        : user?.defaultApplicationRoles || [],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};