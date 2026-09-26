'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Sidebar = () => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: '📊 แดชบอร์ด' },
    { href: '/dashboard/categories', label: '📦 หมวดหมู่อะไหล่' },
    { href: '/dashboard/store', label: '🛒 หน้าร้าน (POS)' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        ☰
      </button>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 md:translate-x-0 md:static ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 bg-gray-950 font-bold text-lg">
          🏍️ ร้านซ่อมมอเตอร์ไซค์
        </div>
        <nav className="mt-6 px-4">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`block px-4 py-3 mb-2 rounded-md transition-colors ${isActive ? 'bg-primary-600' : 'hover:bg-gray-800'}`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {isMobileOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)}></div>}
    </>
  );
};
