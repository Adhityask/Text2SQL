import { Database, Loader2, CheckCircle, XCircle, Brain, Key } from "lucide-react"

export const TerminalHeader = ({ connectionStatus, apiKeyStatus, databaseName, onResetConnection }) => {
  const getDbStatusIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return <Loader2 className="animate-spin text-yellow-400" size={18} />
      case "connected":
        return <CheckCircle className="text-green-400" size={18} />
      case "error":
        return <XCircle className="text-red-400" size={18} />
      default:
        return <Database className="text-gray-400" size={18} />
    }
  }

  const getApiStatusIcon = () => {
    switch (apiKeyStatus) {
      case "connecting":
        return <Loader2 className="animate-spin text-yellow-400" size={18} />
      case "connected":
        return <CheckCircle className="text-green-400" size={18} />
      case "error":
        return <XCircle className="text-red-400" size={18} />
      default:
        return <Key className="text-gray-400" size={18} />
    }
  }

  const getDbStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting..."
      case "connected":
        return `DB: ${databaseName || "database"}`
      case "error":
        return "DB failed"
      default:
        return "DB not connected"
    }
  }

  const getApiStatusText = () => {
    switch (apiKeyStatus) {
      case "connecting":
        return "Setting key..."
      case "connected":
        return "API connected"
      case "error":
        return "API failed"
      default:
        return "API not set"
    }
  }

  return (
    <div className="bg-gray-900 border border-green-500 rounded-t-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Brain className="text-green-400" size={24} />
        <h1 className="text-xl font-bold">Text2SQL v1.0</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* API Key Status */}
        <div className="flex items-center gap-2">
          {getApiStatusIcon()}
          <span className="text-sm">{getApiStatusText()}</span>
        </div>
        
        {/* Separator */}
        <span className="text-gray-600">|</span>
        
        {/* Database Status */}
        <div className="flex items-center gap-2">
          {getDbStatusIcon()}
          <span className="text-sm">{getDbStatusText()}</span>
        </div>
        
        {/* Disconnect Button */}
        {(connectionStatus === "connected" || apiKeyStatus === "connected") && (
          <button onClick={onResetConnection} className="ml-3 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs">
            Reset All
          </button>
        )}
      </div>
    </div>
  )
}