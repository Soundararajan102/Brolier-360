import { useState, useEffect, useRef } from "react"
import { Search, Send, User, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"

interface Conversation {
  member_id: number
  member_name: string
  member_phone: string
  last_message: string
  last_message_time: string
  unread_count: number
}

interface ChatMessage {
  id: number
  direction: "inbound" | "outbound"
  message_type: string
  content: string
  status: string
  timestamp: string
}

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedMember, setSelectedMember] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedMember) {
      fetchMessages(selectedMember.member_id)
    }
  }, [selectedMember])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/inbox/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (memberId: number) => {
    try {
      const res = await fetch(`/api/inbox/${memberId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedMember) return

    try {
      setSending(true)
      const res = await fetch(`/api/inbox/${selectedMember.member_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage, message_type: "text" }),
      })
      if (res.ok) {
        setNewMessage("")
        fetchMessages(selectedMember.member_id)
        fetchConversations() // Update last message in sidebar
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden glass-card shadow-xl border border-slate-200/60 dark:border-slate-800/60">
      {/* Sidebar: Conversations List */}
      <div className="w-80 border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <h2 className="text-xl font-bold font-heading text-slate-800 dark:text-slate-100 mb-4">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.member_id}
                onClick={() => setSelectedMember(conv)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedMember?.member_id === conv.member_id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                    selectedMember?.member_id === conv.member_id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {conv.member_name.charAt(0)}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold text-sm truncate ${selectedMember?.member_id === conv.member_id ? "text-white" : ""}`}>
                      {conv.member_name}
                    </h3>
                    <span className={`text-xs ${selectedMember?.member_id === conv.member_id ? "text-primary-foreground/80" : "text-slate-500"}`}>
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${selectedMember?.member_id === conv.member_id ? "text-primary-foreground/90" : "text-slate-500"}`}>
                    {conv.last_message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 relative">
        {selectedMember ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center gap-4 z-10">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                {selectedMember.member_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedMember.member_name}</h3>
                <p className="text-xs font-mono text-slate-500">{selectedMember.member_phone}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                    msg.direction === "outbound"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700"
                  }`}>
                    {msg.message_type === "text" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm italic opacity-80">
                        <User className="w-4 h-4" /> [Template Message]
                      </div>
                    )}
                    <div className={`text-[10px] mt-1 text-right ${
                      msg.direction === "outbound" ? "text-primary-foreground/70" : "text-slate-400"
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === "outbound" && (
                        <span className="ml-2 capitalize">{msg.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-md shadow-primary/20"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-lg font-medium text-slate-500">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
