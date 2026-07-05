import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Image as ImageIcon, Video, FileText, Upload, Trash2 } from "lucide-react"

export default function Media() {
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mediaName, setMediaName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = () => {
    fetch("http://localhost:8000/api/media")
      .then((res) => res.json())
      .then((data) => setMediaItems(data))
      .catch((err) => console.error("Error fetching media:", err))
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setMediaName(file.name.split('.')[0]) // default to filename without extension
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    if (mediaName) {
      formData.append("name", mediaName)
    }

    try {
      const res = await fetch("http://localhost:8000/api/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        alert("Upload successful!")
        fetchMedia()
      } else {
        alert("Error: " + (data.detail || "Upload failed"))
      }
    } catch (err) {
      console.error("Upload error:", err)
      alert("An error occurred during upload.")
    } finally {
      setUploading(false)
      setSelectedFile(null)
      setMediaName("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click if we add it later
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/media/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchMedia()
      } else {
        const data = await res.json()
        alert("Error deleting media: " + (data.detail || "Unknown error"))
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("Failed to delete media.")
    }
  }

  const cancelUpload = () => {
    setSelectedFile(null)
    setMediaName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />
      case 'video': return <Video className="h-8 w-8 text-purple-500" />
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />
      default: return <ImageIcon className="h-8 w-8 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Media Library</h2>
          <p className="text-slate-500 mt-2">Upload and manage media for your WhatsApp campaigns.</p>
        </div>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*,application/pdf"
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className={`mr-2 h-4 w-4 ${uploading ? "animate-bounce" : ""}`} />
          {uploading ? "Uploading..." : "Upload New Media"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {mediaItems.map((item) => (
          <Card key={item.id} className="overflow-hidden group hover:border-primary transition-colors relative">

            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-black/60 hover:bg-rose-500 hover:text-white backdrop-blur-sm text-slate-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              title="Delete Media"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <CardContent className="p-0">
              <div className="h-40 bg-slate-100 flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-50 transition-colors relative overflow-hidden">
                {item.type === 'image' && item.url ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  getIcon(item.type)
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-sm truncate" title={item.name}>{item.name}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                  <span className="uppercase">{item.type}</span>
                  <span>{item.date}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs font-mono text-slate-400 truncate">
                  ID: {item.id}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Naming Modal Overlay */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-1">Name Your Media</h3>
            <p className="text-sm text-slate-500 mb-6">Assign a custom name to easily find this file later.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">File Selected</label>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-mono text-slate-600 dark:text-slate-400 truncate">
                  {selectedFile.name}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom Name</label>
                <input
                  type="text"
                  value={mediaName}
                  onChange={(e) => setMediaName(e.target.value)}
                  className="mt-1 w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g., Summer Sale Poster"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={cancelUpload} disabled={uploading}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl h-11" onClick={handleFileUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Confirm & Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
