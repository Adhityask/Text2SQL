import { RefreshCw } from "lucide-react"

export const TablesDisplay = ({ connectionStatus, tables, onRefreshTables, isRefreshing }) => {
  if (connectionStatus !== "connected") {
    return null
  }

  return (
    <div className="bg-gray-900 border-l border-r border-green-500 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-300 font-semibold">📋 Available Tables ({tables.length})</h3>
        <button
          onClick={onRefreshTables}
          disabled={isRefreshing}
          className="p-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1 text-xs"
          title="Refresh tables list"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      {tables.length === 0 ? (
        <div className="text-gray-500 text-sm italic">No tables found in the database</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tables.map((table, index) => (
            <span key={index} className="px-3 py-1 bg-green-900 border border-green-600 rounded-full text-xs font-mono">
              {table}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}