import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Core
import Dashboard from '../pages/dashboard';
import Analytics from '../pages/analytics/Analytics';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/hooks/useAuth';
import { PROFILE } from '../services/varible';

// Analytics Reports
import PredictionsReport from '../components/layout/sidebar/analytics/PredictionsReport';
import FraudDetectReport from '../components/layout/sidebar/analytics/FraudDetectReport';
import AnalysisReport from '../components/layout/sidebar/analytics/AnalysisReport';
import RecommendorReport from '../components/layout/sidebar/analytics/RecommendorReport';
import DiscountOptimizerReport from '../components/layout/sidebar/analytics/DiscountOptimizerReport';

// Reports & Config
import ReportCost from '../components/reportcost/ReportCost';
import AdminReportCost from '../components/reportcost/AdminReportCost';
import Subscription from '../components/layout/sidebar/configuration/subscription';

// Pharmacy - Search
import AgeRestrictionTable from '../components/features/pharmacy/search/AgeRestriction';
import DateRangeTable from '../components/features/pharmacy/search/DateRange';
import FindMedicineTable from '../components/features/pharmacy/search/FindMedicine';
import MedicineTypeTable from '../components/features/pharmacy/search/MedicineType';
import PatientIndicationTable from '../components/features/pharmacy/search/PatientIndication';
import ManufacturerTable from '../components/features/pharmacy/search/Manufacturer';
import PrescriptionRequireTable from '../components/features/pharmacy/search/PrescriptionRequire';
import SideEffectTable from '../components/features/pharmacy/search/SideEffect';
import ExpireMedicineTable from '../components/features/pharmacy/search/ExpireMedicine';
import AdvanceSearchTable from '../components/features/pharmacy/search/AdvanceSearch';

// Pharmacy - Inventory
import AddMedicine from '../components/features/pharmacy/inventory/AddMedicine';
import DrugStock from '../components/features/pharmacy/inventory/DrugStock';
import MedicineSupplyHistory from '../components/features/pharmacy/inventory/MedicineSupplyHistory';
import UpcomingSupply from '../components/features/pharmacy/inventory/UpcomingSupply';
import TotalSupply from '../components/features/pharmacy/inventory/TotalSupply';
import Low from '../components/features/pharmacy/inventory/Low';
import Restock from '../components/features/pharmacy/inventory/Restock';
import Turnover from '../components/features/pharmacy/inventory/TurnOver';
import InventoryValuation from '../components/features/pharmacy/inventory/InventoryValuation';

// Pharmacy - Sales
import SalesForecast from '../components/features/pharmacy/sales/SalesForecast';
import SalesTrend from '../components/features/pharmacy/sales/SalesTrend';
import TopSellingMedicine from '../components/features/pharmacy/sales/TopSellingMedicine';
import ProductsRevenue from '../components/features/pharmacy/sales/ProductsRevenue';
import ProfitMargin from '../components/features/pharmacy/sales/ProfitMargin';
import MedicineAnalytics from '../components/features/pharmacy/sales/MedicineAnalytics';

// Pharmacy - POS (Sales Point)
import SellMedicine from '../components/features/pharmacy/salespoint/sellmedicine';
import ReturnMedicine from '../components/features/pharmacy/salespoint/returnmedicine';
import Allinvoices from '../components/features/pharmacy/salespoint/allinvoices';
import Returninvoice from '../components/features/pharmacy/salespoint/returninvoice';

// Branch Management
import AddBranch from '../components/features/branches/AddBranch';
import ViewSales from '../components/features/branches/viewsales';
import BranchDashboard from '../components/layout/sidebar/branch/BranchDashboard';
import BranchPermission from '../components/features/branches/BranchPermission';
import BranchPermissionView from '../components/features/branches/BranchPermissionView';

// Pharmacy Recommendation
import DrugPriceComparison from '../components/features/pharmacy/recommendation/DrugPriceComparison';
import AllergyAwareRecommendation from '../components/features/pharmacy/recommendation/AllergyAwareRecommendation';
import DrugSafetyCheck from '../components/features/pharmacy/recommendation/DrugSafetyCheck';
import PlaceOrder from '../components/features/pharmacy/order/placeorder';
import CheckOrder from '../components/features/pharmacy/order/checkorder';
import Payment from '../components/features/pharmacy/payments/payment';
import Payhistory from '../components/features/pharmacy/payments/payhistory';


// Data Ingestion
import CsvUpload from '../components/features/dataingestion/CsvUpload';
import DataIngestion from '../pages/sidebar/vendor/DataIngestion';
export default function SidebarRoutes() {
  const { user } = useAuth();
  const isProd = PROFILE === 'prod';
  const isPharmacy = user?.businessType === 'PHARMACY';

  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<Navigate to="/dashboard" />} />

        <Route path="dashboard" element={<MainLayout />}>
          {/* Analytics Section */}
          <Route path="analytics" element={<Analytics />}>
            <Route
              path="predictions-report"
              element={<PredictionsReport profile={PROFILE} />}
            />
            <Route path="fraud-detect-report" element={<FraudDetectReport />} />
            <Route path="analysis-report" element={<AnalysisReport />} />
            <Route path="recommender-report" element={<RecommendorReport />} />
            <Route
              path="discount-optimizer-report"
              element={<DiscountOptimizerReport />}
            />
          </Route>

          {/* Admin Vendors */}
          <Route path="admin-vendors">
            <Route index element={<Navigate to="report-cost" />} />
            <Route path="report-cost" element={<ReportCost />} />
            {!isProd && (
              <Route path="configuration" element={<Subscription />} />
            )}

            {/* Pharmacy Management (if businessType is PHARMACY) */}
            {isPharmacy && (
              <Route path="pharmacy-management">
                {/* Point of Sales */}
                <Route path="salespoint">
                  <Route index element={<div>Sale Points Dashboard</div>} />
                  <Route path="sellmedicine" element={<SellMedicine />} />
                  <Route path="returnmedicine" element={<ReturnMedicine />} />
                  <Route path="allinvoices" element={<Allinvoices />} />
                  <Route path="returninvoice" element={<Returninvoice />} />
                </Route>

                {/* Search */}
                <Route path="search">
                  <Route
                    path="age-restriction"
                    element={<AgeRestrictionTable />}
                  />
                  <Route path="date-range" element={<DateRangeTable />} />
                  <Route path="find-medicine" element={<FindMedicineTable />} />
                  <Route path="medicine-type" element={<MedicineTypeTable />} />
                  <Route
                    path="patient-indication"
                    element={<PatientIndicationTable />}
                  />
                  <Route path="manufacturer" element={<ManufacturerTable />} />
                  <Route
                    path="prescription-require"
                    element={<PrescriptionRequireTable />}
                  />
                  <Route path="side-effect" element={<SideEffectTable />} />
                  <Route
                    path="expire-medicine"
                    element={<ExpireMedicineTable />}
                  />
                  <Route
                    path="advance-search"
                    element={<AdvanceSearchTable />}
                  />
                </Route>

                 {/* ORDER */}
                              <Route path="order">
                                <Route index element={<div>Order Management</div>} />
                                <Route path="placeorder" element={<PlaceOrder />} />
                                <Route path="checkorder" element={<CheckOrder />} />
                              </Route>

                {/* Inventory */}
                <Route path="inventory">
                  <Route path="add-medicine" element={<AddMedicine />} />
                  <Route path="drug-stock" element={<DrugStock />} />
                  <Route
                    path="medicine-supply-history"
                    element={<MedicineSupplyHistory />}
                  />
                  <Route path="total-supply" element={<TotalSupply />} />
                  <Route path="low" element={<Low />} />
                  <Route path="restock" element={<Restock />} />
                  <Route path="turn-over" element={<Turnover />} />
                  <Route
                    path="inventory-valuation"
                    element={<InventoryValuation />}
                  />
                </Route>

                {/* Sales */}
                <Route path="sales">
                  <Route path="sales-forecast" element={<SalesForecast />} />
                  <Route path="sales-trend" element={<SalesTrend />} />
                  <Route
                    path="top-selling-medicine"
                    element={<TopSellingMedicine />}
                  />
                  <Route
                    path="products-revenue"
                    element={<ProductsRevenue />}
                  />
                  <Route path="profit-margin" element={<ProfitMargin />} />
                  <Route
                    path="medicine-analytics"
                    element={<MedicineAnalytics />}
                  />
                  <Route
                    index
                    element={<Navigate to="sales-forecast" replace />}
                  />
                </Route>

                <Route path="recommendation">
                  <Route
                    path="drug-price-comparison"
                    element={<DrugPriceComparison />}
                  />
                  <Route
                    path="allergy-aware-recommendation"
                    element={<AllergyAwareRecommendation />}
                  />
                  <Route
                    path="drug-safety-check"
                    element={<DrugSafetyCheck />}
                  />
                </Route>
              </Route>
            )}
            {/* -------------------- DATA INGESTION -------------------- */}
            <Route path="data-ingestion">
              <Route index element={<DataIngestion />} />
              <Route path="csv-upload" element={<CsvUpload />} />
            </Route>
            <Route path="payments">
              <Route path="payment" element={<Payment />} />
              <Route path="payhistory" element={<Payhistory />} />
            </Route>
            {/* Branch Management */}
            <Route path="manage-branches">
              <Route index element={<BranchDashboard />} />
              <Route path="add-branch" element={<AddBranch />} />
              <Route path="branch-permission" element={<BranchPermission />} />
              <Route path="View Sales" element={<ViewSales/>} />

              <Route
                path="branch-permission/view/:id"
                element={<BranchPermissionView />}
              />
              <Route index element={<Navigate to="add-branch" replace />} />
            </Route>
          </Route>

          {/* Admin Section */}
          <Route path="admin">
            <Route index element={<Navigate to="report-cost-admin" />} />
            <Route path="report-cost-admin" element={<AdminReportCost />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
