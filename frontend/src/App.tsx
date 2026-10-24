import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { FlightAnalysisView } from './components/FlightAnalysis/FlightAnalysisView';
import { PredictDelayView } from './components/PredictDelay/PredictDelayView';
import { RouteIntelligenceView } from './components/RouteIntelligence/RouteIntelligenceView';
import { ModelEvaluationView } from './components/ModelEvaluation/ModelEvaluationView';
import { DataManagementView } from './components/DataManagement/DataManagementView';
import { aviationApi } from './services/api';
import { DashboardSummary } from './types/aviation';
import { Menu, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dashboard Data cache
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);

  // Selected flight pass-through from dashboard to analysis
  const [inspectedFlightId, setInspectedFlightId] = useState<string | null>(null);

  // Health check & Initial dashboard load
  const loadPlatformData = async () => {
    setIsRefreshing(true);
    try {
      const health = await aviationApi.getHealth();
      setIsBackendConnected(health.status === 'healthy');

      // Load dashboard summary
      const summary = await aviationApi.getDashboardSummary();
      setDashboardData(summary);
    } catch (err) {
      console.warn('Backend currently unreachable or booting, running in resilient mode:', err);
      setIsBackendConnected(false);
    } finally {
      setIsRefreshing(false);
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
    const interval = setInterval(async () => {
      try {
        const health = await aviationApi.getHealth();
        setIsBackendConnected(health.status === 'healthy');
      } catch {
        setIsBackendConnected(false);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectFlightFromDashboard = (flightId: string) => {
    setInspectedFlightId(flightId);
    setActiveTab('flight-analysis');
  };

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Operations Dashboard',
          subtitle: 'Fleet-wide delay indicators, disruption tracking, and carrier punctuality',
        };
      case 'flight-analysis':
        return {
          title: 'Flight Analysis & Log',
          subtitle: 'Searchable log of monitored flight telemetries, turnarounds, and root causes',
        };
      case 'predict-delay':
        return {
          title: 'AI Delay Prediction Engine',
          subtitle: 'Operational flight simulator running real Scikit-Learn baseline inference',
        };
      case 'route-intelligence':
        return {
          title: 'Route & Hub Intelligence',
          subtitle: 'Air corridor performance metrics, congestion ratings, and hub choke points',
        };
      case 'model-evaluation':
        return {
          title: 'Model Evaluation & Transparency',
          subtitle: 'Honest Scikit-Learn scorecard, confusion matrix, and feature importances',
        };
      case 'data-management':
        return {
          title: 'Data Management & Ingestion',
          subtitle: 'FAA benchmark schema inspection, data health audits, and synthetic controls',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="flex min-h-screen bg-[#090e1a] text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          isBackendConnected={isBackendConnected}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm">
          <div className="relative w-72 bg-[#0c1324] h-full">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              isBackendConnected={isBackendConnected}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between border-b border-[#1a2947] bg-[#0c1324] px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-sm tracking-tight text-white">AeroIntel AI</span>
          <div className={`h-2.5 w-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>

        <Header
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onRefresh={loadPlatformData}
          isRefreshing={isRefreshing}
          isBackendConnected={isBackendConnected}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              loading={dashboardLoading}
              onSelectFlight={handleSelectFlightFromDashboard}
            />
          )}

          {activeTab === 'flight-analysis' && (
            <FlightAnalysisView
              initialFlightId={inspectedFlightId}
              onClearInitialFlight={() => setInspectedFlightId(null)}
            />
          )}

          {activeTab === 'predict-delay' && <PredictDelayView />}

          {activeTab === 'route-intelligence' && <RouteIntelligenceView />}

          {activeTab === 'model-evaluation' && <ModelEvaluationView />}

          {activeTab === 'data-management' && <DataManagementView />}
        </main>
      </div>
    </div>
  );
};
