export const InputArea = ({ connectionStatus, apiKeyStatus, currentInput, isLoading, onInputChange, onSubmit, onKeyPress }) => {
  if (connectionStatus !== "connected" || apiKeyStatus !== "connected") {
    return null
  }

  return (
    <div className="bg-gray-900 border border-green-500 rounded-b-lg p-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Ask a question about your database... (e.g., 'Show me all users' or 'What's the average age?')"
            className="w-full p-4 bg-black border border-green-600 rounded text-green-400 placeholder-green-700 focus:outline-none focus:border-green-400 pr-20"
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">Enter ↵</div>
        </div>
        <button
          onClick={onSubmit}
          disabled={isLoading || !currentInput.trim()}
          className="px-6 py-4 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold transition-colors"
        >
          Ask
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        💡 Try asking: "Show me all tables", "What's in the users table?", "Count all records", etc.
      </div>
    </div>
  )
}