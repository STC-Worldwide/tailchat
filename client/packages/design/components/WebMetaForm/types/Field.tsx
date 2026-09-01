import React from 'react';

export const MetaFormField: React.FC<{
  label?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="space-y-2">
    {label && (
      <div className="text-sm font-medium text-foreground">{label}</div>
    )}
    {children}
    {error && (
      <div role="alert" className="text-xs text-destructive">
        {error}
      </div>
    )}
  </div>
);
