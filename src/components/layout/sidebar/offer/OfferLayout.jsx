import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from '../../dashboard/MainLayout';

export default function OfferLayout() {
  return (
    <MainLayout>
      <div className="min-h-full">
        <Outlet />
      </div>
    </MainLayout>
  );
}
