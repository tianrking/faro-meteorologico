import { useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import FocusStrip from './components/FocusStrip.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import WeatherChart from './components/WeatherChart.jsx';
import PredictionPanel from './components/PredictionPanel.jsx';
import ForecastTable from './components/ForecastTable.jsx';
import ObservationTable from './components/ObservationTable.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import FetchLogTable from './components/FetchLogTable.jsx';
import useWeatherDashboard from './hooks/useWeatherDashboard.js';
import useWeatherInsights from './hooks/useWeatherInsights.js';
import useWeatherRecords from './hooks/useWeatherRecords.js';

const defaultCity = { id: 'busan-rkpk', name: 'Busan' };

function currentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeTab, setActiveTab] = useState('forecast');
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(currentTimeLabel());
  const [isLightMode, setIsLightMode] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const dashboard = useWeatherDashboard(selectedCity.id, refreshToken);
  const records = useWeatherRecords(selectedCity.id, selectedDate, refreshToken);
  const insights = useWeatherInsights(selectedCity.id, records.date, refreshToken);
  const hasRealData = records.realData || insights.realData;

  function selectCity(city) {
    setSelectedCity({ id: city.id ?? city.cityId, name: city.name });
    setSelectedDate('');
    setActiveTab('forecast');
  }

  function refresh() {
    setLastUpdated(currentTimeLabel());
    setRefreshToken((value) => value + 1);
  }

  return (
    <div className={`app-shell ${isLightMode ? 'light-mode' : ''} ${sidebarHidden ? 'sidebar-collapsed' : ''}`}>
      <Header
        apiOnline={dashboard.apiOnline}
        loading={dashboard.loading || records.loading || insights.loading}
        lastUpdated={lastUpdated}
        isLightMode={isLightMode}
        isEnglish={isEnglish}
        onRefresh={refresh}
        onToggleTheme={() => setIsLightMode((value) => !value)}
        onToggleLanguage={() => setIsEnglish((value) => !value)}
        onClosePanel={() => setSidebarHidden((value) => !value)}
      />
      <div className="layout">
        <Sidebar cities={dashboard.cities} hidden={sidebarHidden} onCitySelect={selectCity} />
        <main className="content">
          <FocusStrip focusCities={dashboard.focusCities} onCitySelect={selectCity} />
          <ControlPanel
            activeTab={activeTab}
            date={records.date}
            availableDates={records.availableDates}
            onDateChange={setSelectedDate}
            onTabChange={setActiveTab}
            sourceStatus={dashboard.sourceStatus}
          />
          {(dashboard.error || records.error || insights.error) && <div className="api-notice">后端暂未连接或部分官方数据源失败，当前显示可用数据。</div>}
          {hasRealData && <div className="api-success">Forecast / METAR / Historical / Prediction 已接入官方真实数据源。</div>}

          {activeTab === 'forecast' && (
            <>
              <WeatherChart
                cityName={selectedCity.name}
                date={records.date}
                hourlySeries={records.hourlySeries}
                accuracy={insights.accuracy}
                diffStats={insights.diffStats}
                peakMarker={insights.peakMarker}
              />
              <PredictionPanel prediction={insights.prediction} />
              <ForecastTable cityName={selectedCity.name} date={records.date} forecastRows={records.forecastRows} />
            </>
          )}

          {activeTab === 'metar' && <ObservationTable cityName={selectedCity.name} date={records.date} rows={records.metarRows} type="METAR" />}
          {activeTab === 'historical' && <ObservationTable cityName={selectedCity.name} date={records.date} rows={records.historicalRows} type="历史观测" />}
          {activeTab === 'stats' && <StatsPanel accuracy={insights.accuracy} diffStats={insights.diffStats} />}
          {activeTab === 'logs' && <FetchLogTable fetchLogs={insights.fetchLogs} />}
        </main>
      </div>
    </div>
  );
}
