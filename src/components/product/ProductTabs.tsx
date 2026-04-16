'use client';
import { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface ProductTabsProps {
  tabs: Tab[];
}

export default function ProductTabs({ tabs }: ProductTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${i === active ? 'border-[#FF6600] text-[#FF6600]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-6">{tabs[active]?.content}</div>
    </div>
  );
}
