"use client";

import { useAppStore } from "@/store";

type PageType = ReturnType<typeof useAppStore.getState>["currentPage"];

const NAV_ITEMS: { page: PageType; label: string; icon: string }[] = [
  { page: "landing", label: "Home", icon: "🏠" },
  { page: "search", label: "Search", icon: "🔍" },
  { page: "interpretation", label: "AI Interpretation", icon: "🤖" },
  { page: "results", label: "Results Map", icon: "🗺️" },
  { page: "details", label: "Restaurant Details", icon: "🍽️" },
  { page: "evidence", label: "Evidence & Trust", icon: "✅" },
  { page: "saved", label: "Saved & Recent", icon: "⭐" },
];

export function Navigation() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-between">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 transition-colors ${
                currentPage === item.page
                  ? "text-primary-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium truncate w-full text-center mt-0.5">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
