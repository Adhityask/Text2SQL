import { Database, Loader2, CheckCircle, XCircle, Terminal } from "lucide-react"

export const TerminalHeader = ({ connectionStatus, databaseName, onResetConnection }) => {
  const getStatusIcon = () => {
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

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting..."
      case "connected":
        return `Connected to ${databaseName || "database"}`
      case "error":
        return "Connection failed"
      default:
        return "Not connected"
    }
  }

  return (
    <div className="bg-gray-900 border border-green-500 rounded-t-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Terminal className="text-green-400" size={24} />
        <h1 className="text-xl font-bold">Database Terminal v1.0</h1>
      </div>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <span className="text-sm">{getStatusText()}</span>
        {connectionStatus === "connected" && (
          <button onClick={onResetConnection} className="ml-3 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs">
            Disconnect
          </button>
        )}
      </div>
    </div>
  )
}
