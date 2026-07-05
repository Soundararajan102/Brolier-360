import { useState, useEffect } from "react"
import { Users, Megaphone, CheckCircle2, XCircle, TrendingUp } from "lucide-react"

export default function Dashboard() {
  const [data, setData] = useState({
    totalMembers: 0,
    campaignsSent: 0,
    deliveredMessages: 0,
    failedMessages: 0
  })

  useEffect(() => {
    fetch("http://localhost:8000/api/dashboard/stats")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching dashboard stats:", err))
  }, [])

  const stats = [
    {
      title: "Total Members",
      value: data.totalMembers,
      icon: Users,
      color: "text-blue-500 dark:text-blue-400",
      bgLight: "bg-blue-500/10",
      bgDark: "dark:bg-blue-500/20",
    },
    {
      title: "Campaigns Sent",
      value: data.campaignsSent,
      icon: Megaphone,
      color: "text-purple-500 dark:text-purple-400",
      bgLight: "bg-purple-500/10",
      bgDark: "dark:bg-purple-500/20",
    },
    {
      title: "Delivered Messages",
      value: data.deliveredMessages,
      icon: CheckCircle2,
      color: "text-emerald-500 dark:text-emerald-400",
      bgLight: "bg-emerald-500/10",
      bgDark: "dark:bg-emerald-500/20",
    },
    {
      title: "Failed Messages",
      value: data.failedMessages,
      icon: XCircle,
      color: "text-rose-500 dark:text-rose-400",
      bgLight: "bg-rose-500/10",
      bgDark: "dark:bg-rose-500/20",
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight heading-text text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">Monitor your WhatsApp marketing campaigns and audience growth.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Download Report
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div 
            key={stat.title} 
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden p-6"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Background Accent Gradient */}
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-current to-transparent opacity-[0.03] rounded-bl-full pointer-events-none" style={{ color: "currentColor" }} />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bgLight} ${stat.bgDark} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card rounded-2xl overflow-hidden group">
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white">Recent Campaigns</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your latest outreach efforts and their status.</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[300px] bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No campaigns yet</p>
              <p className="text-xs text-slate-400 mt-1">Start by creating your first campaign</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden group">
          <div className="p-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white">Audience Growth</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track how your member base is expanding.</p>
          </div>
          <div className="p-6 flex items-center justify-center min-h-[300px] bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Insufficient Data</p>
              <p className="text-xs text-slate-400 mt-1">Add more members to see growth analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
