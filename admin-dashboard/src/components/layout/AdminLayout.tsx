import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard Analytics', subtitle: 'Live sales, orders, and produce metrics' };
      case '/products':
        return { title: 'Produce Products', subtitle: 'Catalog pricing, availability, and packaging' };
      case '/categories':
        return { title: 'Produce Categories', subtitle: 'Category taxonomy, photos, and active status' };
      case '/orders':
        return { title: 'Customer Orders', subtitle: 'Fulfillment workflow, statuses, and delivery addresses' };
      case '/customers':
        return { title: 'Customer Directory', subtitle: 'Registered customer accounts, orders, and spend' };
      case '/inventory':
        return { title: 'Inventory Management', subtitle: 'Stock monitoring, batch adjustment, and low-stock alerts' };
      default:
        if (location.pathname.startsWith('/customers/')) {
          return { title: 'Customer Inspection', subtitle: 'Account details, address book, and order history' };
        }
        return { title: 'Admin Console', subtitle: 'FreshDash Store Management' };
    }
  };

  const { title, subtitle } = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

