import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Analytics() {
  return (
    <div className="p-6">
      <Outlet /> {/* nested route will show here */}
    </div>
  );
}
