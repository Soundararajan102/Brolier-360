import { useState } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Users, Megaphone, LayoutDashboard, LogOut, BarChart3, MessageSquare, Image as ImageIcon, Mail, Search, Bell, Settings, Menu } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

export default function Layout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, prefetch: () => import("../pages/Dashboard") },
    { name: "Members", href: "/members", icon: Users, prefetch: () => import("../pages/Members") },
    { name: "Inbox", href: "/inbox", icon: Mail, prefetch: () => import("../pages/Inbox") },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone, prefetch: () => import("../pages/Campaigns") },
    { name: "Reports", href: "/reports", icon: BarChart3, prefetch: () => import("../pages/Reports") },
    { name: "Templates", href: "/templates", icon: MessageSquare, prefetch: () => import("../pages/Templates") },
    { name: "Media", href: "/media", icon: ImageIcon, prefetch: () => import("../pages/Media") },
  ]

  const handlePrefetch = (item: typeof navigation[0]) => {
    // Triggers the dynamic import chunk to download in the background
    item.prefetch().catch(() => {
      // Ignore prefetch errors (e.g. offline), ErrorBoundary will catch actual navigation errors
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Modern & Glassmorphic */}
      <aside className={`w-72 flex-shrink-0 flex flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 md:bg-white/60 md:dark:bg-slate-900/40 md:backdrop-blur-xl transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-50 md:static md:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="h-20 flex items-center px-8 border-b border-transparent">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold font-heading text-slate-800 dark:text-slate-100 tracking-tight">
              Brolier 360 <span className="text-primary font-black">WA</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                onMouseEnter={() => handlePrefetch(item)}
                onFocus={() => handlePrefetch(item)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <item.icon
                  className={`mr-4 h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-primary group-hover:scale-110"
                  }`}
                />
                {item.name}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <button className="flex items-center px-4 py-3 w-full text-sm font-medium text-slate-600 dark:text-slate-400 rounded-xl hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-colors group">
            <LogOut className="mr-4 h-5 w-5 text-slate-400 group-hover:text-destructive transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 flex-shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10 gap-2 sm:gap-4">
          
          {/* Hamburger Menu (Mobile) */}
          <button 
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search anything..."
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="ml-4 flex items-center gap-4">
            <ThemeToggle />
            
            <button className="p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-white dark:ring-slate-900" />
            </button>
            
            <button className="p-2 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="ml-1 sm:ml-2 flex items-center gap-3 cursor-pointer p-1.5 sm:pr-3 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm font-heading">
                A
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto animate-fade-in custom-scrollbar">
          <div className="p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
