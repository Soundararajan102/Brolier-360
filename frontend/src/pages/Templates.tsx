import { useState, useEffect } from "react"
import { MessageSquare, RefreshCw, Loader2, Image as ImageIcon, Video, FileText } from "lucide-react"
import { Button } from "../components/ui/button"

interface Template {
  id: number
  name: string
  language: string
  category: string
  status: string
  body_text: string
  header_type: string | null
  buttons: any
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch("/api/templates/sync", { method: "POST" })
      if (res.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error("Error syncing templates:", error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight heading-text text-slate-900 dark:text-white">WhatsApp Templates</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your approved message templates from Meta.</p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncing}
          className="w-full sm:w-auto rounded-xl shadow-md shadow-primary/20"
        >
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {syncing ? "Syncing with Meta..." : "Sync Templates"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No templates found</h3>
          <p className="text-slate-500">Sync with Meta Business Suite to load your templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="glass-card rounded-2xl overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate max-w-[200px]" title={template.name}>
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-500 uppercase">{template.language}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="text-xs text-slate-500">{template.category}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  template.status === 'APPROVED' 
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}>
                  {template.status}
                </span>
              </div>
              
              <div className="p-5 flex-1 flex flex-col bg-slate-100/30 dark:bg-slate-800/20 relative">
                {/* Visual Header Representation */}
                {template.header_type && template.header_type !== 'TEXT' && (
                  <div className="mb-4 h-32 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300/50 dark:border-slate-700/50">
                    {template.header_type === 'IMAGE' && <ImageIcon className="w-8 h-8 text-slate-400" />}
                    {template.header_type === 'VIDEO' && <Video className="w-8 h-8 text-slate-400" />}
                    {template.header_type === 'DOCUMENT' && <FileText className="w-8 h-8 text-slate-400" />}
                    <span className="ml-2 text-sm font-medium text-slate-500">{template.header_type} HEADER</span>
                  </div>
                )}
                
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap flex-1 font-mono">
                  {template.body_text}
                </p>
                
                {/* Buttons Representation */}
                {template.buttons && template.buttons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    {template.buttons.map((btn: any, i: number) => (
                      <div key={i} className="w-full py-2 flex items-center justify-center text-sm font-medium text-primary bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
