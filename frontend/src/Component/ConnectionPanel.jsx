import { Database, Loader2, Key } from "lucide-react"

export const ConnectionPanel = ({
  connectionStatus,
  apiKeyStatus,
  connectionData,
  useConnectionString,
  isLoading,
  onConnectionDataChange,
  onUseConnectionStringChange,
  onConnect,
  onSetApiKey,
}) => {
  if (connectionStatus !== "disconnected" && connectionStatus !== "error") {
    return null
  }

  return (
    <div className="bg-gray-900 border-l border-r border-green-500 p-6">
      <h2 className="text-lg mb-4 text-green-300">🔗 Database Connection</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* API Key Section */}
          <div className="space-y-3 p-4 bg-black border border-green-600 rounded">
            <h3 className="text-sm font-semibold text-green-300">🔑 API Configuration</h3>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="Enter your Google API Key"
                value={connectionData.api_key}
                onChange={(e) => onConnectionDataChange({ ...connectionData, api_key: e.target.value })}
                className="flex-1 p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700 focus:outline-none focus:border-green-400"
              />
              <button
                onClick={onSetApiKey}
                disabled={!connectionData.api_key.trim() || apiKeyStatus === "connected"}
                className={`px-4 py-3 rounded font-semibold flex items-center gap-2 transition-colors ${
                  apiKeyStatus === "connected"
                    ? "bg-green-600 cursor-default"
                    : "bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed"
                }`}
              >
                <Key size={18} />
                {apiKeyStatus === "connected" ? "Connected" : "Set Key"}
              </button>
            </div>
            {apiKeyStatus === "connected" && (
              <p className="text-xs text-green-400">✅ API key connected successfully</p>
            )}
          </div>

          {/* Database Connection Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-300">📊 Database Configuration</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!useConnectionString}
                  onChange={() => onUseConnectionStringChange(false)}
                  className="text-green-400"
                />
                Manual Configuration
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={useConnectionString}
                  onChange={() => onUseConnectionStringChange(true)}
                  className="text-green-400"
                />
                Connection String
              </label>
            </div>

            {useConnectionString ? (
              <input
                type="text"
                placeholder="postgresql+psycopg2://user:pass@host:5432/dbname"
                value={connectionData.connection_string}
                onChange={(e) => onConnectionDataChange({ ...connectionData, connection_string: e.target.value })}
                className="w-full p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700 focus:outline-none focus:border-green-400"
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={connectionData.db_type}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, db_type: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Database Name"
                    value={connectionData.database}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, database: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Host"
                    value={connectionData.host}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, host: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700"
                  />
                  <input
                    type="text"
                    placeholder="Port"
                    value={connectionData.port}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, port: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Username"
                    value={connectionData.user}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, user: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={connectionData.password}
                    onChange={(e) => onConnectionDataChange({ ...connectionData, password: e.target.value })}
                    className="p-3 bg-black border border-green-600 rounded text-green-400 placeholder-green-700"
                  />
                </div>
              </div>
            )}

            <button
              onClick={onConnect}
              disabled={isLoading || apiKeyStatus !== "connected"}
              className="w-full p-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Connecting...
                </>
              ) : (
                <>
                  <Database size={18} />
                  Connect to Database
                </>
              )}
            </button>
            {apiKeyStatus !== "connected" && (
              <p className="text-xs text-yellow-400">⚠️ Please set your API key first</p>
            )}
          </div>
        </div>

        <div className="text-sm text-green-300 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">📋 Supported Operations:</h3>
            <ul className="space-y-1 text-green-400">
              <li>• Connect to PostgreSQL or MySQL databases</li>
              <li>• View all available tables</li>
              <li>• Ask questions in natural language</li>
              <li>• Generate and execute SQL queries</li>
              <li>• Get results in natural language</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">🔐 Setup Steps:</h3>
            <ol className="space-y-1 text-green-400 list-decimal list-inside">
              <li>Enter your Google API key</li>
              <li>Configure database connection</li>
              <li>Connect to your database</li>
              <li>Start querying!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}