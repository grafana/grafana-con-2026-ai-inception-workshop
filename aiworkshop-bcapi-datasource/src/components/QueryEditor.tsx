import React from 'react';
import { InlineField, Combobox } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { ComboboxOption } from '@grafana/ui/dist/types/components/Combobox/types';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

const ENDPOINT_OPTIONS: Array<ComboboxOption<string>> = [
  { value: 'station_status', label: 'Station Status' },
  { value: 'station_information', label: 'Station Information' },
];

export function QueryEditor({ query, onChange, onRunQuery, datasource }: Props) {
  const loadStations = async (): Promise<Array<ComboboxOption<string>>> => {
    const data = await datasource.getStations();
    return data.map((s) => ({ value: s.value, label: s.label }));
  };

  const onEndpointChange = (option: ComboboxOption<string>) => {
    onChange({ ...query, endpoint: option.value, stationId: undefined });
    onRunQuery();
  };

  const onStationChange = (option: ComboboxOption<string> | null) => {
    onChange({ ...query, stationId: option?.value });
    onRunQuery();
  };

  return (
    <>
      <InlineField label="Endpoint" labelWidth={14}>
        <Combobox
          id="query-editor-endpoint"
          options={ENDPOINT_OPTIONS}
          value={query.endpoint}
          onChange={onEndpointChange}
          width={30}
        />
      </InlineField>
      {query.endpoint === 'station_information' && (
        <InlineField label="Station" labelWidth={14}>
          <Combobox
            id="query-editor-station"
            options={loadStations}
            value={query.stationId ?? null}
            onChange={onStationChange}
            isClearable
            placeholder="All stations"
            width={40}
          />
        </InlineField>
      )}
    </>
  );
}
