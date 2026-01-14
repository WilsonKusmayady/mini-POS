import React from 'react';
import { DataItem, DataSection, StatusBadge, DateDisplay } from '@/components/ui/data-display';

export type FieldType =
  | 'text'
  | 'code'
  | 'date'
  | 'boolean-label'
  | 'status';

export interface ViewField {
  label: string;
  key: string;
  type?: FieldType;
  options?: {
    trueLabel?: string;
    falseLabel?: string;
    labels?: Record<string, string>;
  };
  value?: (data: any) => any;
}

export interface ViewSection {
  title: string;
  fields: ViewField[];
}

export interface ViewSchema {
  title: (data: any) => string;
  description?: (data: any) => string;
  sections: ViewSection[];
}

export function renderViewSchema(schema: ViewSchema, data: any) {
  return (
    <div className="space-y-6">
      {schema.sections.map((section, i) => (
        <DataSection key={i} title={section.title}>
          {section.fields.map((field, j) => {
            const value = field.value ? field.value(data) : data[field.key];

            switch (field.type) {
              case 'code':
                return (
                  <DataItem
                    key={j}
                    label={field.label}
                    value={<code>{value}</code>}
                  />
                );

              case 'date':
                return (
                  <DataItem
                    key={j}
                    label={field.label}
                    value={<DateDisplay date={value} />}
                  />
                );

              case 'boolean-label':
                return (
                  <DataItem
                    key={j}
                    label={field.label}
                    value={
                      value
                        ? field.options?.trueLabel
                        : field.options?.falseLabel
                    }
                  />
                );

              case 'status':
                return (
                  <DataItem
                    key={j}
                    label={field.label}
                    value={
                      <StatusBadge
                        status={value}
                        labels={field.options?.labels}
                      />
                    }
                  />
                );

              default:
                return (
                  <DataItem
                    key={j}
                    label={field.label}
                    value={value ?? '-'}
                  />
                );
            }
          })}
        </DataSection>
      ))}
    </div>
  );
}
