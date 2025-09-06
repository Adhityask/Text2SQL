export const TablesDisplay = ({ connectionStatus, tables }) => {
  if (connectionStatus !== "connected" || tables.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-900 border-l border-r border-green-500 p-4">
      <h3 className="text-green-300 font-semibold mb-3">📋 Available Tables ({tables.length})</h3>
      <div className="flex flex-wrap gap-2">
        {tables.map((table, index) => (
          <span key={index} className="px-3 py-1 bg-green-900 border border-green-600 rounded-full text-xs font-mono">
            {table}
          </span>
        ))}
      </div>
    </div>
  )
}
