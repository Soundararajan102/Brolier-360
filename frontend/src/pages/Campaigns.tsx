import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Clock, Image as ImageIcon, CheckCircle2, ChevronRight, Video, FileText, XCircle, Megaphone } from "lucide-react"

interface Template {
  id: number;
  template_name: string;
  language: string;
  category: string;
  status: string;
  body_text: string | null;
  header_type?: string | null;
  buttons?: any[] | null;
}

export default function Campaigns() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [audienceType, setAudienceType] = useState<string>("");
  const [selectedMediaId, setSelectedMediaId] = useState<string>("");
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setIsLoadingTemplates(true);
    fetch("http://localhost:8000/api/templates/")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTemplates(data);
        }
        setIsLoadingTemplates(false);
      })
      .catch((err) => {
        console.error("Error fetching templates:", err);
        setIsLoadingTemplates(false);
      });

    fetch("http://localhost:8000/api/media/")
      .then((res) => res.json())
      .then((data) => setMediaList(data))
      .catch((err) => console.error("Error fetching media:", err));
  }, []);

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
  const selectedMedia = mediaList.find(m => m.id.toString() === selectedMediaId);

  const handleSend = async () => {
    if (!campaignName || !selectedTemplateId || !audienceType) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:8000/api/campaigns/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: campaignName,
          template_id: parseInt(selectedTemplateId),
          audience_type: audienceType,
          media_id: selectedMediaId ? parseInt(selectedMediaId) : null
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Campaign scheduled successfully!' });
        setCampaignName("");
        setSelectedTemplateId("");
        setAudienceType("");
        setSelectedMediaId("");
      } else {
        setMessage({ type: 'error', text: data.detail || 'Failed to send campaign.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred while sending the campaign.' });
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight heading-text text-slate-900 dark:text-white">Campaign Manager</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Create, schedule and monitor your WhatsApp campaigns with high-converting templates.</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <TabsTrigger value="create" className="rounded-lg data-[state=active]:shadow-sm">Create Broadcast</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:shadow-sm">History</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg data-[state=active]:shadow-sm">Templates Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Form Section */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="glass-card rounded-2xl p-6 sm:p-8 animate-fade-in-right">
                <div className="mb-6">
                  <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white">Campaign Details</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Configure your broadcast audience and content.</p>
                </div>
                
                {message && (
                  <div className={`p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border ${
                    message.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/20' 
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-500/20'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                    <span className="leading-relaxed font-medium">{message.text}</span>
                  </div>
                )}
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">Campaign Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Diwali Premium Offer 2026" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-950 focus:ring-primary/20 h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template" className="text-slate-700 dark:text-slate-300 font-medium">WhatsApp Template</Label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 h-11">
                        <SelectValue placeholder="Select an approved template" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {isLoadingTemplates && <SelectItem value="loading" disabled>Loading templates...</SelectItem>}
                        {!isLoadingTemplates && templates.length === 0 && <SelectItem value="none" disabled>No templates available</SelectItem>}
                        {!isLoadingTemplates && templates.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()} className="py-2.5">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span>{t.template_name}</span>
                              {t.header_type && t.header_type !== 'NONE' && (
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full ml-2">
                                  {t.header_type}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Audience Filter</Label>
                    <Select value={audienceType} onValueChange={setAudienceType}>
                      <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 h-11">
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="py-2.5">All Members</SelectItem>
                        <SelectItem value="free" className="py-2.5">Free Members</SelectItem>
                        <SelectItem value="premium" className="py-2.5">Premium Members</SelectItem>
                        <SelectItem value="expired" className="py-2.5">Expired Accounts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate?.header_type && ["IMAGE", "VIDEO", "DOCUMENT"].includes(selectedTemplate.header_type) && (
                    <div className="space-y-2 animate-fade-in bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-xl">
                      <Label className="text-primary font-semibold flex items-center gap-2 mb-1">
                        {selectedTemplate.header_type === 'IMAGE' && <ImageIcon className="w-4 h-4" />}
                        {selectedTemplate.header_type === 'VIDEO' && <Video className="w-4 h-4" />}
                        {selectedTemplate.header_type === 'DOCUMENT' && <FileText className="w-4 h-4" />}
                        Attach {selectedTemplate.header_type.toLowerCase()}
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">This template requires a media attachment to be sent successfully.</p>
                      
                      <Select value={selectedMediaId} onValueChange={setSelectedMediaId}>
                        <SelectTrigger className="rounded-xl bg-white dark:bg-slate-950 border-primary/30 h-11">
                          <SelectValue placeholder="Select media from library" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {mediaList.length === 0 && <SelectItem value="none" disabled>No media available. Upload in Media tab.</SelectItem>}
                          {mediaList.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()} className="py-2.5">
                              {m.name || `Media ${m.id}`} ({m.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      className="flex-1 rounded-xl h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all" 
                      onClick={handleSend} 
                      disabled={isSending}
                    >
                      <Send className="mr-2 h-5 w-5" /> {isSending ? 'Dispatching...' : 'Dispatch Campaign'}
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl h-12 text-base font-semibold hover:bg-slate-50 dark:hover:bg-slate-800" disabled>
                      <Clock className="mr-2 h-5 w-5 text-slate-400" /> Schedule for Later
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="relative mx-auto w-[320px] h-[650px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-slate-900/50 dark:shadow-none border-[6px] border-slate-800 flex flex-col overflow-hidden">
                {/* iPhone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-40 mx-auto z-20"></div>
                
                {/* WhatsApp Header */}
                <div className="bg-[#075e54] text-white p-4 pt-8 pb-3 flex items-center gap-3 z-10 shadow-md">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-none mb-1">Your Business</h3>
                    <p className="text-[10px] text-white/70">Verified Account</p>
                  </div>
                </div>

                {/* WhatsApp Chat Background */}
                <div className="flex-1 bg-[#e5ddd5] dark:bg-[#0b141a] p-4 flex flex-col justify-end overflow-y-auto custom-scrollbar relative" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[1px]"></div>
                  
                  {/* The Message Bubble */}
                  <div className="relative z-10 w-[90%] self-start animate-fade-in-right">
                    <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-none shadow-sm p-1.5 pb-2">
                      {/* Media Header Preview */}
                      {selectedTemplate?.header_type === 'IMAGE' && (
                        <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 overflow-hidden flex flex-col items-center justify-center relative">
                          {selectedMedia ? (
                            <img src={selectedMedia.type === 'image' ? "/placeholder-img.jpg" : ""} alt="Selected Media" className="w-full h-full object-cover opacity-50" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">Image Required</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Body Text */}
                      <div className="px-1.5 pt-1">
                        <p className="text-[14px] text-slate-800 dark:text-[#e9edef] whitespace-pre-wrap leading-snug">
                          {selectedTemplate?.body_text || <span className="text-slate-400 dark:text-slate-500 italic">Select a template to see how your message will appear to customers.</span>}
                        </p>
                        <div className="flex justify-end items-center mt-1 gap-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedTemplate?.buttons && selectedTemplate.buttons.length > 0 ? (
                      <div className="mt-1 flex flex-col gap-[2px]">
                         {selectedTemplate.buttons.map((btn, idx) => (
                             <div key={idx} className="bg-white dark:bg-[#202c33] text-[#00a884] dark:text-[#00a884] py-2.5 text-center rounded-xl rounded-t-none text-sm font-medium shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a3942] transition-colors border-t border-slate-100 dark:border-slate-800/50">
                               {btn.text}
                             </div>
                         ))}
                      </div>
                    ) : selectedTemplate?.body_text && (
                       <div className="mt-1 flex flex-col gap-[2px] opacity-50 grayscale pointer-events-none">
                         <div className="bg-white dark:bg-[#202c33] text-slate-400 py-2.5 text-center rounded-xl rounded-t-none text-[13px] shadow-sm flex items-center justify-center border-t border-slate-100 dark:border-slate-800/50">
                           Interactive Button (If configured)
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> WhatsApp verified display format
                </p>
              </div>
            </div>
            
          </div>
        </TabsContent>
        
        {/* Other Tabs Content */}
        <TabsContent value="history" className="animate-fade-in">
          <div className="glass-card rounded-2xl p-8 text-center max-w-2xl mx-auto mt-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-2">Campaign History Centralized</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">We've moved the detailed historical tracking and analytics into the dedicated Reports dashboard for a better viewing experience.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => window.location.href = '/reports'}>
              Go to Reports <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingTemplates ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 flex flex-col animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                    <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-1.5"></div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
                  </div>
                  <div className="space-y-2 mt-auto">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : templates.map((t, i) => (
              <div key={t.id} className="glass-card rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-heading font-semibold text-slate-900 dark:text-white line-clamp-1">{t.template_name}</h4>
                    {t.status === 'APPROVED' ? (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" title="Approved"></span>
                    ) : (
                      <span className="flex h-2 w-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" title={t.status}></span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{t.language}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed">{t.body_text}</p>
                </div>
              </div>
            ))}
            {!isLoadingTemplates && templates.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No templates synced yet. Connect your Meta account to import templates.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
