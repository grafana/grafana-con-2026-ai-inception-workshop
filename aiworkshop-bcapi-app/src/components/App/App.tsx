import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
const StationsPage = React.lazy(() => import('../../pages/StationsPage'));
const MapPage = React.lazy(() => import('../../pages/MapPage'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path={ROUTES.Map} element={<MapPage />} />
      <Route path="*" element={<StationsPage />} />
    </Routes>
  );
}

export default App;
