import { useEffect, useRef } from "react"
import { Play, Loader2, Bot, User, AlertCircle, CheckCircle2, Terminal, Database, AlertTriangle, Sparkles } from "lucide-react"

export const TerminalOutput = ({ messages, isLoading, onExecuteQuery }) => {
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get icon for message type
  const getMessageIcon = (type) => {
    switch (type) {
      case "user":
        return <User size={16} className="text-yellow-400" />
      case "assistant":
        return <Bot size={16} className="text-purple-400" />
      case "system":
        return <Terminal size={16} className="text-cyan-400" />
      case "success":
        return <CheckCircle2 size={16} className="text-green-400" />
      case "error":
        return <AlertCircle size={16} className="text-red-400" />
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-500" />
      case "sql":
        return <Database size={16} className="text-purple-400" />
      case "result":
        return <Sparkles size={16} className="text-blue-400" />
      default:
        return null
    }
  }

  // Get text color for message type
  const getMessageColor = (type) => {
    switch (type) {
      case "user":
        return "text-yellow-400"
      case "assistant":
        return "text-purple-400"
      case "system":
        return "text-cyan-400"
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "warning":
        return "text-yellow-500"
      case "sql":
        return "text-purple-400"
      case "result":
        return "text-blue-400"
      default:
        return "text-green-400"
    }
  }

  return (
    <div className="bg-black border-l border-r border-green-500 p-4 h-96 overflow-y-auto font-mono text-sm">
      {messages.map((message, index) => (
        <div key={index} className="mb-3">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 text-xs mt-1 shrink-0">[{message.timestamp}]</span>
            
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {getMessageIcon(message.type)}
            </div>
            
            <div className="flex-1">
              {/* Message content */}
              <div className={`${getMessageColor(message.type)} whitespace-pre-wrap`}>
                {message.content}
              </div>

              {/* SQL execution button */}
              {message.type === "sql" && message.canExecute && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={onExecuteQuery}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 rounded flex items-center gap-2 text-sm font-semibold transition-colors"
                  >
                    <Play size={14} />
                    Execute Query
                  </button>
                </div>
              )}

              {/* Query results with raw data */}
              {message.type === "result" && message.data && message.data.rows && (
                <div className="mt-2 p-3 bg-gray-800 border border-gray-600 rounded text-xs">
                  <div className="text-gray-400 mb-2">📊 Raw Data:</div>
                  <pre className="text-green-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(message.data.rows, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
          <Loader2 className="animate-spin" size={16} />
          <span>Processing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}