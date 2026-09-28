import React from 'react';

export default function QuarterTabs({ tabs, activeId, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/70 p-1 shadow-sm backdrop-blur dark:bg-gray-900/60">
      {tabs.map((tab) => {
        const active = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-xl px-2.5 py-2.5 text-sm font-black transition sm:px-3 sm:py-3 sm:text-base ${
              active
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-white/80 dark:text-gray-200 dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
