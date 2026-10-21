import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'
import { AppLayout } from '@components/layout/AppLayout'
import { PageSkeleton } from '@components/ui/Skeleton'
import { ErrorBoundary } from '@components/common/ErrorBoundary'

// Lazy-loaded Page Components for Optimized Code-Splitting
const Login = lazy(() => import('@pages/auth/Login').then((m) => ({ default: m.Login })))
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const Dashboard = lazy(() => import('@pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const MasterHub = lazy(() => import('@pages/master/MasterHub').then((m) => ({ default: m.MasterHub })))
const Transports = lazy(() => import('@pages/master/Transports').then((m) => ({ default: m.Transports })))
const AddTransaction = lazy(() => import('@pages/inventory/AddTransaction').then((m) => ({ default: m.AddTransaction })))
const ViewTransactions = lazy(() => import('@pages/inventory/ViewTransactions').then((m) => ({ default: m.ViewTransactions })))
const EditTransaction = lazy(() => import('@pages/inventory/EditTransaction').then((m) => ({ default: m.EditTransaction })))
const AddDispatch = lazy(() => import('@pages/dispatch/AddDispatch').then((m) => ({ default: m.AddDispatch })))
const ViewDispatches = lazy(() => import('@pages/dispatch/ViewDispatches').then((m) => ({ default: m.ViewDispatches })))
const EditDispatch = lazy(() => import('@pages/dispatch/EditDispatch').then((m) => ({ default: m.EditDispatch })))
const AddBillEntry = lazy(() => import('@pages/billing/AddBillEntry').then((m) => ({ default: m.AddBillEntry })))
const ViewBills = lazy(() => import('@pages/billing/ViewBills').then((m) => ({ default: m.ViewBills })))
const EditBillEntry = lazy(() => import('@pages/billing/EditBillEntry').then((m) => ({ default: m.EditBillEntry })))
const PendingRTGS = lazy(() => import('@pages/billing/PendingRTGS').then((m) => ({ default: m.PendingRTGS })))
const DailyReport = lazy(() => import('@pages/reports/DailyReport').then((m) => ({ default: m.DailyReport })))
const ItemWiseSaudaReport = lazy(() => import('@pages/reports/ItemWiseSaudaReport').then((m) => ({ default: m.ItemWiseSaudaReport })))
const StockReport = lazy(() => import('@pages/reports/StockReport').then((m) => ({ default: m.StockReport })))
const PartyReport = lazy(() => import('@pages/reports/PartyReport').then((m) => ({ default: m.PartyReport })))
const VehicleReport = lazy(() => import('@pages/reports/VehicleReport').then((m) => ({ default: m.VehicleReport })))
const UserManagement = lazy(() => import('@pages/settings/UserManagement').then((m) => ({ default: m.UserManagement })))
const AppSettings = lazy(() => import('@pages/settings/AppSettings').then((m) => ({ default: m.AppSettings })))
const NotFound = lazy(() => import('@pages/NotFound').then((m) => ({ default: m.NotFound })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Application Routes with AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Master Data Routes */}
              <Route path="/master" element={<MasterHub />} />
              <Route path="/master/parties" element={<Navigate to="/master?tab=parties" replace />} />
              <Route path="/master/transporters" element={<Navigate to="/master?tab=transporters" replace />} />
              <Route path="/master/qualities" element={<Navigate to="/master?tab=grades" replace />} />
              <Route path="/master/transports" element={<Transports />} />
              <Route path="/master/vehicles" element={<Transports />} />

              {/* Inventory Routes */}
              <Route path="/inventory/add" element={<AddTransaction />} />
              <Route path="/inventory/list" element={<ViewTransactions />} />
              <Route path="/inventory/edit/:id" element={<EditTransaction />} />

              {/* Dispatch Routes */}
              <Route path="/dispatch/add" element={<AddDispatch />} />
              <Route path="/dispatch/list" element={<ViewDispatches />} />
              <Route path="/dispatch/edit/:id" element={<EditDispatch />} />

              {/* Billing Routes */}
              <Route path="/billing/add" element={<AddBillEntry />} />
              <Route path="/billing/list" element={<ViewBills />} />
              <Route path="/billing/edit/:id" element={<EditBillEntry />} />
              <Route path="/billing/pending" element={<PendingRTGS />} />

              {/* Reports Routes */}
              <Route path="/reports" element={<Navigate to="/reports/daily" replace />} />
              <Route path="/reports/daily" element={<DailyReport />} />
              <Route path="/reports/sauda" element={<ItemWiseSaudaReport />} />
              <Route path="/reports/item-wise-sauda" element={<ItemWiseSaudaReport />} />
              <Route path="/reports/stock" element={<StockReport />} />
              <Route path="/reports/party" element={<PartyReport />} />
              <Route path="/reports/vehicle" element={<VehicleReport />} />

              {/* Settings Routes */}
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/settings/app" element={<AppSettings />} />
            </Route>

            {/* Root Redirect to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all Wildcard Route -> 404 NotFound */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
