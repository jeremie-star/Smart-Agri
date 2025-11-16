"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Bot, User, Trash2, MessageSquare } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { chatApi } from "@/services/chat.service"
import type { ChatMessage } from "@/types/api"
import toast from "react-hot-toast"

export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    loadChatHistory()
  }, [])

  React.useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const history = await chatApi.getHistory(1, 50)
      setMessages(history.items || [])
    } catch (error: any) {
      console.error("Error loading chat history:", error)
      toast.error("Failed to load chat history")
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await chatApi.askQuestion({
        question: userMessage,
        include_farm_context: true
      })
      
      setMessages(prev => [...prev, response])
      toast.success("Response received!")
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.response?.data?.detail || "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear all chat history?")) return

    try {
      await chatApi.clearHistory()
      setMessages([])
      toast.success("Chat history cleared")
    } catch (error) {
      toast.error("Failed to clear history")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoadingHistory) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
            <p className="text-muted-foreground">
              Ask questions about farming, crops, and irrigation
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearHistory} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear History
            </Button>
          )}
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Ask me anything about farming, irrigation, crop management, or weather!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                    {[
                      "What's the best time to irrigate tomatoes?",
                      "How much water does maize need?",
                      "Tell me about soil preparation",
                      "What are signs of overwatering?"
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputMessage(suggestion)}
                        className="text-left justify-start"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <React.Fragment key={message.id}>
                        {/* User Question */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 justify-end"
                        >
                          <div className="max-w-[80%]">
                            <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3">
                              <p className="text-sm">{message.question}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        </motion.div>

                        {/* AI Response */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex gap-3"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="max-w-[80%]">
                            <div className="bg-muted rounded-lg px-4 py-3">
                              <p className="text-sm whitespace-pre-wrap">{message.response}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(message.created_at)} • {message.language}
                            </p>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !inputMessage.trim()} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
