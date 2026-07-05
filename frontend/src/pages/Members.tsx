import { useState, useEffect, useRef } from "react"
import { Search, Plus, Filter, Download, Upload, Loader2, Edit2, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"

interface Member {
  id: number
  name: string
  phone: string
  gender: string | null
  community: string | null
  district: string | null
  membership_type: string | null
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    community: "",
    district: "",
    membership_type: "free",
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members")
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    window.location.href = "/api/members/export"
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setLoading(true)
      const res = await fetch("/api/members/upload", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        fetchMembers()
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: "", phone: "", gender: "", community: "", district: "", membership_type: "free" })
    setIsModalOpen(true)
  }

  const openEditModal = (member: Member) => {
    setEditingId(member.id)
    setFormData({
      name: member.name || "",
      phone: member.phone || "",
      gender: member.gender || "",
      community: member.community || "",
      district: member.district || "",
      membership_type: member.membership_type || "free",
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      })
      if (res.ok) fetchMembers()
    } catch (error) {
      console.error("Error deleting member:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/members/${editingId}` : "/api/members"
      const method = editingId ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setIsModalOpen(false)
        fetchMembers()
      }
    } catch (error) {
      console.error("Error saving member:", error)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight heading-text text-slate-900 dark:text-white">Members Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your 40,000+ Matrimony members.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <input 
            type="file" 
            accept=".csv, .xlsx" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto rounded-xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto rounded-xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto rounded-xl shadow-md shadow-primary/20" onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-slate-200/50 dark:border-slate-800/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                  {editingId ? "Edit Member" : "Add New Member"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number (WhatsApp)</label>
                  <input
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. 919876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">District</label>
                    <input
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      value={formData.membership_type}
                      onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
                    >
                      <option value="Free">Free</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" className="w-full rounded-xl shadow-md shadow-primary/20">
                    {editingId ? "Save Changes" : "Save Member"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or district..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button variant="outline" className="rounded-xl px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <Filter className="mr-2 h-4 w-4" /> Advanced Filters
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
        
        {/* Mobile View: Cards (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p>No members found.</p>
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 relative shadow-sm hover:border-primary/30 transition-colors">
                {/* Mobile Actions: Top Right */}
                <div className="absolute top-4 right-4 flex gap-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-full" onClick={() => openEditModal(member)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive rounded-full" onClick={() => handleDelete(member.id, member.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Identity Header */}
                <div className="flex items-center gap-4 mb-5 pr-20">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase tracking-wider shadow-inner">
                    {member.name ? member.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate leading-tight">{member.name}</h3>
                    <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{member.phone}</p>
                  </div>
                </div>
                {/* Details Section */}
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700/50 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">District</span>
                    <span className="font-medium text-slate-900 dark:text-white">{member.district || "-"}</span>
                  </div>
                </div>
                {/* Badges Footer */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      member.membership_type?.toLowerCase() === "premium" 
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}>
                    {member.membership_type || "Free"}
                  </span>
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Standard Table */}
        <Table className="hidden md:table">
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            <TableRow className="border-b-slate-200/60 dark:border-b-slate-800/60">
              <TableHead className="font-heading font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
              <TableHead className="font-heading font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
              <TableHead className="font-heading font-semibold text-slate-700 dark:text-slate-300">District</TableHead>
              <TableHead className="font-heading font-semibold text-slate-700 dark:text-slate-300">Type</TableHead>
              <TableHead className="font-heading font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-right font-heading font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>No members found. Import a CSV to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b-slate-100 dark:border-b-slate-800/60 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {member.name ? member.name.charAt(0) : '?'}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-200">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-slate-600 dark:text-slate-400 text-sm">{member.phone}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{member.district || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      member.membership_type?.toLowerCase() === "premium" 
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}>
                      {member.membership_type || "Free"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => openEditModal(member)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive" onClick={() => handleDelete(member.id, member.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}