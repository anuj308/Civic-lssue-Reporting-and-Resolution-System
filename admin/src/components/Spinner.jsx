import React from 'react';

const Spinner = ({ className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
  </div>
);

export default Spinner;