import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Activity, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function Reports() {
  const [reports, setReports] = useState<any[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [liveStats, setLiveStats] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetch("http://localhost:8000/api/campaigns/reports")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .catch((err) => console.error("Error fetching reports:", err))
  }, [])

  const handleExportCSV = () => {
    if (reports.length === 0) {
      alert("No data to export.")
      return
    }

    const headers = ["Campaign Name", "Date", "Total Sent", "Delivered", "Read", "Failed/Blocked", "Success Rate"]
    const csvRows = [headers.join(",")]

    reports.forEach(report => {
      const successRate = ((report.delivered / report.sent) * 100).toFixed(1) + "%"
      const values = [
        `"${report.campaign}"`,
        report.date,
        report.sent,
        report.delivered,
        report.read,
        report.failed,
        successRate
      ]
      csvRows.push(values.join(","))
    })

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "campaign_reports.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openLiveStats = (id: number) => {
    setSelectedCampaignId(id)
    fetchLiveStats(id)
  }

  const fetchLiveStats = (id: number) => {
    setIsRefreshing(true)
    fetch(`http://localhost:8000/api/campaigns/${id}/live-stats`)
      .then(res => res.json())
      .then(data => {
         setLiveStats(data)
         setIsRefreshing(false)
      })
      .catch(err => {
         console.error(err)
         setIsRefreshing(false)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Delivery Reports</h2>
          <p className="text-slate-500 mt-2">Analyze the performance of your WhatsApp campaigns.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total Sent</TableHead>
              <TableHead className="text-right text-emerald-600">Delivered</TableHead>
              <TableHead className="text-right text-blue-600">Read</TableHead>
              <TableHead className="text-right text-red-600">Failed/Blocked</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report, idx) => (
              <TableRow key={idx} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => openLiveStats(report.id)}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  {report.campaign}
                </TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell className="text-right">{report.sent.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600 font-medium">{report.delivered.toLocaleString()}</TableCell>
                <TableCell className="text-right text-blue-600 font-medium">{report.read.toLocaleString()}</TableCell>
                <TableCell className="text-right text-red-600 font-medium">{report.failed.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">
                  {((report.delivered / report.sent) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={selectedCampaignId !== null} onOpenChange={(open) => !open && setSelectedCampaignId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Live Campaign Status</DialogTitle>
            <DialogDescription>Real-time delivery statistics</DialogDescription>
          </DialogHeader>
          
          {liveStats ? (
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-medium text-slate-700">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${liveStats.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {liveStats.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  <div className="text-2xl font-bold text-slate-800">{liveStats.sent}</div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Sent</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{liveStats.delivered}</div>
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mt-1">Delivered</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                  <div className="text-2xl font-bold text-blue-700">{liveStats.read}</div>
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-1">Read</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <div className="text-2xl font-bold text-red-700">{liveStats.failed}</div>
                  <div className="text-xs font-medium text-red-600 uppercase tracking-wider mt-1">Failed</div>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex justify-between items-center">
                <span className="text-sm font-medium text-amber-800">Pending Delivery</span>
                <span className="text-lg font-bold text-amber-700">{liveStats.pending}</span>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => selectedCampaignId && fetchLiveStats(selectedCampaignId)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          ) : (
            <div className="py-12 flex justify-center items-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
