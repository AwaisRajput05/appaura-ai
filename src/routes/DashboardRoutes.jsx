import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/dashboard/MainLayout";
import LandingPage from "../pages/LandingPage";
import Inventory from "../components/features/inventory/Inventory";
import LowStock from "../components/features/inventory/LowStock";
import BestSelling from "../components/features/inventory/BestSelling";
import PriceRecommendation from "../components/features/inventory/PriceRecommendation";
import RecommendDiscounts from "../components/features/inventory/RecommendDiscounts";
import { useAuth } from "../components/auth/hooks/useAuth";
import Dashboard from "../pages/dashboard/Dashboard";
import PartnerManagementWrapper from "../pages/admin/wrappers/PartnerManagementWrapper";
import HomePage from "../pages/HomePage";
import Chat from "../components/features/pharmacy/chat/call/chat"



import PermissionManagement from "../pages/admin/permroles";
import PaymentWrapper from "../components/features/pharmacy/payments/wrappers/paymentwrapper";
import InventoryReportWrapper from "../components/features/pharmacy/inventory/wrappers/InventoryReportsWrapper";
import Chatbot from "../pages/sidebar/vendor/chatbot/index";
import PredictionsReport from "../components/layout/sidebar/analytics/PredictionsReport";
import FraudDetectReport from "../components/layout/sidebar/analytics/FraudDetectReport";
import AnalysisReport from "../components/layout/sidebar/analytics/AnalysisReport";
import AnomalyReports from "../components/layout/sidebar/analytics/AnomalyReport";
import RecommendorReport from "../components/layout/sidebar/analytics/RecommenderReport";
import SalesReportsWrapper from "../components/features/pharmacy/sales/wrappers/SalesReportsWrapper";
import DiscountOptimizerReport from "../components/layout/sidebar/analytics/DiscountOptimizerReport";
import Customers from "../components/features/analytics/PredictionsReportComponents/Customers";
import ChurnReport from "../components/layout/sidebar/analytics/ChurnReport";
import NextProductPurchase from "../components/layout/sidebar/analytics/NextProductReport";
import CustomersJourney from "../components/layout/sidebar/analytics/CustomerJourney";
import DemographicReport from "../components/layout/sidebar/analytics/DemographicReport";
import SegementationReports from "../components/layout/sidebar/analytics/SegementationReports";
import GeographicSalesReport from "../components/layout/sidebar/analytics/GeographicSalesReport";
import VendorProfile from "../pages/sidebar/profile/VendorProfile";
import ProductRecommendationsReport from "../components/layout/sidebar/analytics/ProductRcommendReport";
import CustomerBehaviourReport from "../components/layout/sidebar/analytics/CustomerBehaviourReport";
import SalesPerformance from "../components/layout/sidebar/analytics/StorePerformance";
import MarketBasket from "../components/layout/sidebar/analytics/MarketBasket";
import TransactionTrend from "../components/layout/sidebar/analytics/TransactionTrend";
import Logout from "../components/auth/Logout";
import ProtectedRoute from "./ProtectedRoute";
import AdminVendor from "../pages/sidebar/vendor/AdminVendor";
import OfferForm from "../components/features/offer/OfferForm";
import OfferDashboard from "../components/layout/sidebar/offer/OfferDashboard";
import OfferTemplates from "../components/features/offer/OfferTemplates";
import TemplateForm from "../components/features/offer/TemplateForm";
import DataIngestion from "../pages/sidebar/vendor/DataIngestion";
import CsvUpload from "../components/features/dataingestion/CsvUpload";
import ConnectApi from "../components/features/dataingestion/ConnectApi";
import SetupWebhook from "../components/features/dataingestion/SetupWebhook";
import ReportingandSharing from "../pages/sidebar/vendor/Reporting&Sharing";
// import { SalesDashboard } from "../components/features/reporting/SalesDashboard";
import VendorAccounts from "../pages/admin/VendorAccounts";
import SubscriptionPayments from "../pages/admin/Vendorpayment";
import VendorView from "../pages/admin/VendorView";
import ReportCost from "../components/features/reportcost/ReportCost";
import SupplierManagementWrapper from "../components/features/pharmacy/supplier/wrappers/SupplierManagementWrapper";
import AdminReportCost from "../pages/admin/AdminReportCost";
import TopSelling from "../components/features/inventory/TopSelling";
import FinanceDashboard from "../components/layout/sidebar/finance/FinanceDashoard";
import InventoryTransferWrapper from "../components/features/pharmacy/inventory/wrappers/transferwrapper";
import AccountsTable from "../components/features/finance/Account";
import AccountForm from "../components/features/finance/AcountForm";
import ClaimsTable from "../components/features/finance/Claim";
import ClaimForm from "../components/features/finance/ClaimForm";
import TaxRecordsTable from "../components/features/finance/TaxReport";
import TaxRecordForm from "../components/features/finance/TaxReportForm";
import StatementsTable from "../components/features/finance/Statement";
import StatementForm from "../components/features/finance/StatementForm";
import Subscription from "../components/features/configuration/subscription";
import Signup from "../components/auth/Signup";
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import { PROFILE } from "../services/varible";
import AllGeneral from "../components/features/pharmacy/inventory/allgenral";
import InvoicesWrapper from "../components/features/pharmacy/salespoint/wrappers/invoicewrapper";
import SearchWrapper from "../components/features/pharmacy/search/wrappers/SearchWrapper";
import SettingsWrapper from "../components/features/pharmacy/settings/wrappers/SettingsWrapper";
// Pharmacy imports
import AgeRestrictionTable from "../components/features/pharmacy/search/AgeRestriction";
import Ingredient from "../components/features/pharmacy/search/ingredient";
import PharmacyDashboard from "../components/layout/sidebar/pharmacy/PharmacyDashboard";
import DateRangeTable from "../components/features/pharmacy/search/DateRange";
import FindMedicineTable from "../components/features/pharmacy/search/FindMedicine";
import MedicineTypeTable from "../components/features/pharmacy/search/MedicineType";
import PatientIndicationTable from "../components/features/pharmacy/search/PatientIndication";
import ManufacturerTable from "../components/features/pharmacy/search/Manufacturer";
import PrescriptionRequireTable from "../components/features/pharmacy/search/PrescriptionRequire";
import SideEffectTable from "../components/features/pharmacy/search/SideEffect";
import ExpireMedicineTable from "../components/features/pharmacy/search/ExpireMedicine";
import AdvanceSearchTable from "../components/features/pharmacy/search/AdvanceSearch";
import MedicineInfo from "../components/features/pharmacy/search/medicineinfo";
import MedicineStock from "../components/features/pharmacy/inventory/MedicineStock";
import AddMedicine from "../components/features/pharmacy/inventory/AddMedicine";
import MedicineSupplyHistory from "../components/features/pharmacy/inventory/MedicineSupplyHistory";
import UpcomingSupply from "../components/features/pharmacy/inventory/UpcomingSupply";
import TotalSupply from "../components/features/pharmacy/inventory/TotalSupply";
import Restock from "../components/features/pharmacy/inventory/Restock";
import InventoryValuation from "../components/features/pharmacy/inventory/InventoryValuation";
import Turnover from "../components/features/pharmacy/inventory/TurnOver";
import Low from "../components/features/pharmacy/inventory/Low";
import BranchStock from "../components/features/pharmacy/inventory/branchstock";
import GeneralStock from "../components/features/pharmacy/inventory/allgenral";
import SalesForecast from "../components/features/pharmacy/sales/SalesForecast";
import SalesTrend from "../components/features/pharmacy/sales/SalesTrend";
import TopSellingMedicine from "../components/features/pharmacy/sales/TopSellingMedicine";
import ProductsRevenue from "../components/features/pharmacy/sales/ProductsRevenue";
import ProfitMargin from "../components/features/pharmacy/sales/ProfitMargin";
import MedicineAnalytics from "../components/features/pharmacy/sales/MedicineAnalytics";
import TransCompare from "../components/features/pharmacy/sales/transactioncompare";
import AddBranch from "../components/features/branches/AddBranch";
import ViewSales from "../components/features/pharmacy/sales/viewsales";
import Viewbranchsales from "../components/features/financeui/viewsales";
import AddGeneral from "../components/features/pharmacy/inventory/addgeneral";
import BranchPermission from "../components/features/branches/BranchPermisssion";
import BranchDashboard from "../components/layout/sidebar/branch/BranchDashboard";
import BranchPermissionView from "../components/features/branches/BranchPermissionnView";
import AddUser from "../components/features/branches/AddUser";
import ActiveSubaccounts from "../components/features/branches/ActiveSubAcc";
import TransferHistory from "../components/features/pharmacy/inventory/transferhistory";
import SellMedicine from "../components/features/pharmacy/salespoint/sellmedicine";
import ReturnMedicine from "../components/features/pharmacy/salespoint/returnmedicine";
import Allinvoices from "../components/features/pharmacy/salespoint/allinvoices";
import Returninvoice from "../components/features/pharmacy/salespoint/returninvoice";
import TransferRequest from "../components/features/pharmacy/inventory/transfercreate";
import DrugPriceComparison from "../components/features/pharmacy/recommendation/DrugPriceComparison";
import AllergyAwareRecommendation from "../components/features/pharmacy/recommendation/AllergyAwareRecommendation";
import DrugSafetyCheck from "../components/features/pharmacy/recommendation/DrugSafetyCheck";
import DrugRecommend from "../components/features/pharmacy/recommendation/drugrecommend";
import SalesPointWrapper from "../components/features/pharmacy/salespoint/wrappers/poswrapper";
//Order imports---------------------------------------------
import PlaceOrder from "../components/features/pharmacy/order/placeorder";
import CheckOrder from "../components/features/pharmacy/order/checkorder";
import AllSupplierOrder from "../components/features/pharmacy/supplier/allsuppliersorders";
import ShiftStart from "../components/features/pharmacy/cashflow/shiftstart";
import MovementRecord from "../components/features/pharmacy/cashflow/movementrecord";
import CreateSupplier from "../components/features/pharmacy/supplier/createsupplier";
import SupplierOrder from "../components/features/pharmacy/supplier/supplierorder";
import AddCategory from "../components/features/pharmacy/inventory/addcategory";
import CompanyDetails from "../pages/admin/companycollaborators";
import CompanyHistory from "../pages/admin/companyreport";
import CompanyCurrent from "../pages/admin/companycurrent";
import InventoryWrapper from "../components/features/pharmacy/inventory/wrappers/restockWrapper";
import CashFlowWrapper from "../components/features/pharmacy/cashflow/wrappers/cashflowwrapper";
import  RecommendationWrapper from "../components/features/pharmacy/recommendation/wrappers/RecommendationWrapper";
import PermissionsWrapper from "../pages/admin/wrappers/permrolwrapper";
// Add this import for the new page
import EmployeeManagement from "../components/features/pharmacy/emproles/assignemployee";
import RolesManagement from "../pages/admin/pharmroles";
import StartFreeTrial from "../pages/StartFreeTrial";
import CustomerDetails from "../components/features/pharmacy/salespoint/customerdetails";
import Payment from "../components/features/pharmacy/payments/payment";
import Payhistory from "../components/features/pharmacy/payments/payhistory";
import NearExpirySchedule from "../components/features/pharmacy/settings/nearexpiryreminder";
import Lowstockactive from "../components/features/pharmacy/settings/lowstockreminder";
import AddStockWrapper from "../components/features/pharmacy/inventory/wrappers/addstockwrapper";
import BranchManagementWrapper from "../components/features/branches/wrappers/BranchManagementWrapper";
import UserManagementWrapper from "../components/features/branches/wrappers/UserManagementWrapper";
import OrderManagementWrapper from "../components/features/pharmacy/order/wrapper/orderwrapper";
import EmployeeManagementWrapper from "../components/features/pharmacy/emproles/wrappers/EmployeeManagementWrapper";
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

export default function DashboardRoutes() {
  const { user } = useAuth();
  const isProd = PROFILE === "prod";
  const isPharmacy = user?.businessType === "PHARMACY";

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/start-trial" element={<StartFreeTrial />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* -------------------- ADMIN -------------------- */}
        <Route path="admin" element={<Dashboard />}>
          <Route path="vendor-accounts" element={<VendorAccounts />} />
          <Route path="permission-management" element={<PermissionsWrapper/>} />
          <Route path="payment-requests" element={<SubscriptionPayments />} />
          <Route path="partner-management" element={<PartnerManagementWrapper />} />
           <Route path="vendor-view" element={<VendorView />} />
          <Route path="report-cost-admin" element={<AdminReportCost />} />
        </Route>

        {/* -------------------- PROFILE -------------------- */}
        <Route path="profile" element={<VendorProfile />} />

        {/* -------------------- ADMIN VENDOR -------------------- */}
        <Route path="admin-vendors">
          <Route index element={<AdminVendor />} />
          <Route path="customers" element={<Customers />} />
          <Route path="report-cost" element={<ReportCost />} />
          {!isProd && <Route path="configuration" element={<Subscription />} />}
          <Route path="chatbot" element={<Chatbot />} />

          {/* -------------------- PHARMACY -------------------- */}
          {isPharmacy && (
            <Route path="pharmacy-management" element={<PharmacyDashboard />}>
              <Route index element={<div>Pharmacy Overview</div>} />

              {/* POS */}
              <Route path="salespoint">
                <Route index element={<div>Sales Point Dashboard</div>} />
                <Route path="poswrapper" element={<SalesPointWrapper />} />
              
                <Route path="customer-details" element={<CustomerDetails />} />
                <Route path="invoicewrapper" element={<InvoicesWrapper />} />
              </Route>

              {/* ORDER */}
              <Route path="order">
                <Route index element={<div>Order Management</div>} />
                <Route path="orderwrapper" element={<OrderManagementWrapper />} />
                
                <Route path="supplierwrapper" element={<SupplierManagementWrapper />} />
              </Route>

              {/* SEARCH */}
              <Route path="search">
                <Route path="search-wrapper" element={<SearchWrapper />} />
              
                <Route path="medicine-info" element={<MedicineInfo />} />
                
                <Route path="advance-search" element={<AdvanceSearchTable />} />
              </Route>

              {/* INVENTORY */}
              <Route path="inventory">
                <Route path="add-medicine" element={<AddMedicine />} />
                <Route path="add-general" element={<AddGeneral />} />
                <Route path="add-category" element={<AddCategory />} />
          
                 <Route path="general-stock" element={<AllGeneral/>} />
                <Route path="medicine-stock" element={<MedicineStock />} />
                <Route
                  path="medicine-supply-history"
                  element={<MedicineSupplyHistory />}
                />
                  <Route
                  path="restock"
                  element={<InventoryWrapper />} 
                />
                 
                  <Route
                  path="add-stock"
                  element={<AddStockWrapper />} 
                />
                <Route path="upcoming-supply" element={<UpcomingSupply />} />
                <Route path="total-supply" element={<TotalSupply />} />
                <Route path="reportwrapper" element={<InventoryReportWrapper />} />
                <Route path="branch-stock" element={<BranchStock />} />
                <Route path="restock" element={<Restock />} />
                
                <Route
                  path="transfer-wrapper"
                  element={<InventoryTransferWrapper />}
                />
               
               
              </Route>
              {/* SALES */}
              <Route path="sales">
                <Route path="sales-wrapper" element={<SalesReportsWrapper/>} />
              
                <Route path="transaction-compare" element={<TransCompare />} />
                <Route path="viewsales" element={<ViewSales />} />
               
              </Route>

              <Route path="recommendation">
               
                <Route path="recommendwrapper" element={<RecommendationWrapper />} />
               
              </Route>
            </Route>
          )}

          {/* BRANCH MANAGEMENT */}
          <Route path="manage-branches">
            <Route index element={<BranchDashboard />} />
            <Route path="branchwrapper" element={<BranchManagementWrapper />} />
          

            <Route path="userwrapper" element={<UserManagementWrapper />} />
            <Route path="active-subaccount" element={<ActiveSubaccounts />} />
            <Route
              path="branch-permission/view/:id"
              element={<BranchPermissionView />}
            />
          </Route>

          {/* -------------------- DATA INGESTION -------------------- */}
          <Route path="data-ingestion">
            <Route index element={<DataIngestion />} />
            <Route path="csv-upload" element={<CsvUpload />} />
            <Route path="connect-api" element={<ConnectApi />} />
            <Route path="webhooks" element={<SetupWebhook />} />
          </Route>
          <Route path="payments">
  <Route path="payment" element={<PaymentWrapper/>} />
  <Route path="chat" element={<Chat/>} />
  <Route path="pharmaroles" element={<EmployeeManagementWrapper/>} />
</Route>
          <Route path="settings">
            
            <Route path="settingwrapper" element={<SettingsWrapper />} />
          </Route>
          <Route path="cashflow">

           
             <Route path="cashwrapper" element={<CashFlowWrapper />} />
          </Route>
          <Route path="manage-sales">
            <Route index element={<BranchDashboard />} />
            <Route path="viewsales" element={<Viewbranchsales />} />
          </Route>
        </Route>

        {/* -------------------- INVENTORY -------------------- */}
        {!isProd && <Route path="inventory-optimize" element={<Inventory />} />}
        <Route path="inventory-low-stock" element={<LowStock />} />
        <Route path="best-selling-products" element={<BestSelling />} />
        <Route path="top-selling-products" element={<TopSelling />} />
        <Route path="price-recommendations" element={<PriceRecommendation />} />
        <Route path="recommend-discounts" element={<RecommendDiscounts />} />

        {/* -------------------- OFFERS -------------------- */}
        {!isProd && (
          <Route path="offers-management">
            <Route path="offers">
              <Route index element={<OfferDashboard />} />
              <Route path="new" element={<OfferForm />} />
              <Route path="edit/:id" element={<OfferForm />} />
            </Route>
            <Route path="templates">
              <Route index element={<OfferTemplates />} />
              <Route path="new" element={<TemplateForm />} />
              <Route path="edit/:id" element={<TemplateForm />} />
            </Route>
          </Route>
        )}

        {/* -------------------- FINANCE -------------------- */}
        {!isProd && (
          <Route path="finance-management">
            <Route path="account">
              <Route index element={<FinanceDashboard />} />
              <Route path="new" element={<AccountForm />} />
              <Route path="edit/:id" element={<AccountForm />} />
            </Route>
            <Route path="claim">
              <Route index element={<ClaimsTable />} />
              <Route path="new" element={<ClaimForm />} />
              <Route path="edit/:id" element={<ClaimForm />} />
            </Route>
            <Route path="taxrecord">
              <Route index element={<TaxRecordsTable />} />
              <Route path="new" element={<TaxRecordForm />} />
              <Route path="edit/:id" element={<TaxRecordForm />} />
            </Route>
            <Route path="statement">
              <Route index element={<StatementsTable />} />
              <Route path="new" element={<StatementForm />} />
              <Route path="edit/:id" element={<StatementForm />} />
            </Route>
          </Route>
        )}

        {/* -------------------- REPORTING -------------------- */}
        {!isPharmacy && (
          <Route path="reporting-sharing">
            <Route index element={<ReportingandSharing />} />
            {/* <Route path="sales-dashboard" element={<SalesDashboard />} /> */}
            <Route path="analysis-report" element={<AnalysisReport />} />
            <Route path="fraud-detect-report" element={<FraudDetectReport />} />
            <Route
              path="anomaly-detect-transaction-pattern"
              element={<AnomalyReports />}
            />
            <Route
              path="predictions-report"
              element={<PredictionsReport profile={PROFILE} />}
            />
            {!isProd && <Route path="churn-report" element={<ChurnReport />} />}
            {!isProd && (
              <Route
                path="next-product-purchase-predictions"
                element={<NextProductPurchase />}
              />
            )}
            {!isProd && (
              <Route
                path="customer-journey-mapping"
                element={<CustomersJourney />}
              />
            )}
            {!isProd && (
              <Route
                path="demographic-report"
                element={<DemographicReport />}
              />
            )}
            {!isProd && (
              <Route
                path="personalized-product-recommendations"
                element={<ProductRecommendationsReport />}
              />
            )}
            <Route
              path="segmentation-report"
              element={<SegementationReports />}
            />
            <Route
              path="geographic-sales-analysis"
              element={<GeographicSalesReport />}
            />
            <Route
              path="store-performance-analysis"
              element={<SalesPerformance />}
            />
            <Route path="market-basket-analysis" element={<MarketBasket />} />
            <Route path="transaction-trend" element={<TransactionTrend />} />
            <Route path="recommender-report" element={<RecommendorReport />} />
            <Route
              path="impact-of-promotion-on-customer-behavior"
              element={<CustomerBehaviourReport />}
            />
            <Route
              path="discount-report"
              element={<DiscountOptimizerReport />}
            />
          </Route>
        )}

        {/* -------------------- COMPANY -------------------- */}
        <Route path="company/logout" element={<Logout />} />

        {/* -------------------- 404 -------------------- */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
