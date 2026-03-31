import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
const StationsPage = React.lazy(() => import('../../pages/StationsPage'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path="*" element={<StationsPage />} />
    </Routes>
  );
}

export default App;
