import { useEffect, useRef } from "react"
import { Play, Loader2 } from "lucide-react"

export const TerminalOutput = ({ messages, isLoading, onExecuteQuery }) => {
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="bg-black border-l border-r border-green-500 p-4 h-96 overflow-y-auto font-mono text-sm">
      {messages.map((message, index) => (
        <div key={index} className="mb-3">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 text-xs mt-1 shrink-0">[{message.timestamp}]</span>
            <div className="flex-1">

              {/* Small talk or SQL content */}
              <div
                className={`${
                  message.message
                    ? "text-yellow-400"             // small talk
                    : message.type === "sql"
                      ? "text-purple-400"          // SQL queries
                      : message.type === "result"
                        ? "text-blue-400"          // query results
                        : message.type === "system"
                          ? "text-cyan-400"
                          : message.type === "success"
                            ? "text-green-400"
                            : message.type === "error"
                              ? "text-red-400"
                              : message.type === "user"
                                ? "text-yellow-400"
                                : "text-green-400"
                } whitespace-pre-wrap`}
              >
                {message.message || message.content}
              </div>

              {/* SQL execution button */}
              {message.type === "sql" && message.canExecute && !message.message && (
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

              {/* Query results */}
              {message.type === "result" && message.data && (
                <div className="mt-2 p-3 bg-gray-800 border border-gray-600 rounded text-xs">
                  <div className="text-gray-400 mb-2">📊 Raw Data:</div>
                  <pre className="text-green-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(message.data.rows, null, 2)}
                  </pre>
                  {message.data.nl_answer && (
                    <div className="mt-1 text-gray-400 text-xs italic">{message.data.nl_answer}</div>
                  )}
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
