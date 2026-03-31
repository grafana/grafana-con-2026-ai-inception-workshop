import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('../../utils/datasource', () => ({
  getDatasourceInstances: () => [],
  fetchStationList: () => Promise.resolve([]),
  fetchStationDetail: () => Promise.resolve(null),
  clearDetailCache: () => {},
}));

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      basename: 'a/sample-app',
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  test('renders without an error', async () => {
    const { container } = render(
      <MemoryRouter>
        <Suspense fallback={null}>
          <App {...props} />
        </Suspense>
      </MemoryRouter>
    );

    await waitFor(() => expect(container.querySelector('[data-testid="data-testid pg-stations-container"]')).toBeInTheDocument(), { timeout: 2000 });
  });
});
