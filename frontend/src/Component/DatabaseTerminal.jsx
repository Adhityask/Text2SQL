import { useState } from "react"
import axios from "axios"
import { TerminalHeader } from "./TerminalHeader"
import { ConnectionPanel } from "./ConnectionPanel"
import { TablesDisplay } from "./TablesDisplay"
import { TerminalOutput } from "./TerminalOutput"
import { InputArea } from "./InputArea"

const DatabaseTerminal = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [apiKeyStatus, setApiKeyStatus] = useState("disconnected") // New state for API key
  const [tables, setTables] = useState([])
  const [messages, setMessages] = useState([
    {
      type: "system",
      content: "Database Terminal initialized. Please connect to your database and set your API key.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [currentInput, setCurrentInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastGeneratedQuery, setLastGeneratedQuery] = useState("")

  // Connection form state
  const [connectionData, setConnectionData] = useState({
    db_type: "postgresql",
    host: "localhost",
    port: "5432",
    user: "",
    password: "",
    database: "",
    connection_string: "",
    api_key: "", // Added API key field
  })
  const [useConnectionString, setUseConnectionString] = useState(false)

  // Add a message to the terminal
  const addMessage = (messageObj) => {
    setMessages((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), ...messageObj }])
  }

  // Set API Key
  const setApiKey = async () => {
    if (!connectionData.api_key.trim()) {
      addMessage({ type: "error", content: "❌ Please enter a valid API key" })
      return
    }

    setApiKeyStatus("connecting")
    addMessage({ type: "system", content: "🔑 Setting API key..." })

    try {
      const response = await axios.post(
        "http://localhost:8000/set-api-key/",
        { api_key: connectionData.api_key },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )

      setApiKeyStatus("connected")
      addMessage({ type: "success", content: "✅ API key set successfully" })
    } catch (error) {
      setApiKeyStatus("error")
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      addMessage({ type: "error", content: `❌ Failed to set API key: ${errorMessage}` })
    }
  }

  // Connect to database
  const connectToDatabase = async () => {
    // Check if API key is set
    if (apiKeyStatus !== "connected") {
      addMessage({ type: "error", content: "❌ Please set your API key first" })
      return
    }

    setConnectionStatus("connecting")
    setIsLoading(true)

    addMessage({ type: "system", content: "🔄 Initializing database connection..." })

    try {
      const payload = useConnectionString
        ? { connection_string: connectionData.connection_string }
        : {
            db_type: connectionData.db_type,
            host: connectionData.host,
            port: connectionData.port,
            user: connectionData.user,
            password: connectionData.password,
            database: connectionData.database,
          }

      const response = await axios.post("http://localhost:8000/connect-db/", payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })

      setConnectionStatus("connected")
      addMessage({ type: "success", content: `✅ Successfully connected to ${connectionData.database || "database"}` })
      setTimeout(() => fetchTables(), 500)
    } catch (error) {
      setConnectionStatus("error")
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      addMessage({ type: "error", content: `❌ Connection failed: ${errorMessage}` })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch tables
  const fetchTables = async () => {
    try {
      addMessage({ type: "system", content: "📋 Fetching database schema..." })

      const response = await axios.get("http://localhost:8000/get-tables/", { withCredentials: true })
      const data = response.data

      if (data.data && data.data.tables) {
        setTables(data.data.tables)
        addMessage({
          type: "success",
          content: `✅ Database ready! Found ${data.data.tables.length} tables: ${data.data.tables.join(", ")}`,
        })
        addMessage({ type: "system", content: "💬 You can now ask questions about your database in natural language." })
      } else {
        addMessage({ type: "error", content: `❌ Failed to fetch tables: ${data.error || "Unknown error"}` })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      addMessage({ type: "error", content: `❌ Failed to fetch tables: ${errorMessage}` })
    }
  }

  // Ask database (handles small talk & SQL)
  const askDatabase = async (question) => {
    if (!question.trim()) return

    setIsLoading(true)
    addMessage({ type: "user", content: `❓ ${question}` })
    addMessage({ type: "system", content: "🤖 Processing your question..." })

    try {
      const response = await axios.post(
        "http://localhost:8000/ask-db/",
        { question },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      )

      const data = response.data

      // Small talk: no data, only message
      if (!data.data && data.message) {
        addMessage({ type: "system", message: data.message }) // e.g., "Acknowledged 👍"
        setLastGeneratedQuery("")
        return
      }

      // Normal SQL query
      const query = data.data?.query || data.query || ""
      const isValidSQLQuery =
        query &&
        !query.toLowerCase().includes("don't have enough knowledge") &&
        !query.toLowerCase().includes("i don't know") &&
        (query.toLowerCase().includes("select") ||
          query.toLowerCase().includes("insert") ||
          query.toLowerCase().includes("update") ||
          query.toLowerCase().includes("delete") ||
          query.toLowerCase().includes("create") ||
          query.toLowerCase().includes("alter") ||
          query.toLowerCase().includes("drop") ||
          query.toLowerCase().includes("show") ||
          query.toLowerCase().includes("describe") ||
          query.toLowerCase().includes("explain"))

      setLastGeneratedQuery(isValidSQLQuery ? query : "")
      addMessage({
        type: "sql",
        content: `🔍 Generated SQL Query:\n${query}`,
        explanation: data.explanation,
        canExecute: isValidSQLQuery,
        query: query,
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      addMessage({ type: "error", content: `❌ Failed to generate query: ${errorMessage}` })
    } finally {
      setIsLoading(false)
    }
  }

  // Execute last generated query
  const executeQuery = async () => {
    if (!lastGeneratedQuery) return

    setIsLoading(true)
    addMessage({ type: "system", content: "⚡ Executing SQL query..." })

    try {
      const response = await axios.post(
        "http://localhost:8000/execute-db/",
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      )

      addMessage({
        type: "result",
        content: `📊 ${response.data.result || "Query executed successfully"}`,
        data: response.data.data,
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error"
      addMessage({ type: "error", content: `❌ Execution failed: ${errorMessage}` })
    } finally {
      setIsLoading(false)
    }
  }

  // Input handlers
  const handleInputSubmit = () => {
    if (currentInput.trim() && !isLoading) {
      askDatabase(currentInput.trim())
      setCurrentInput("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleInputSubmit()
    }
  }

  const resetConnection = () => {
    setConnectionStatus("disconnected")
    setApiKeyStatus("disconnected")
    setTables([])
    setLastGeneratedQuery("")
    setMessages([
      {
        type: "system",
        content: "Connection reset. Please connect to your database and set your API key.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
    setConnectionData({
      ...connectionData,
      api_key: "",
    })
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto p-6 max-w-6xl">
        <TerminalHeader
          connectionStatus={connectionStatus}
          apiKeyStatus={apiKeyStatus}
          databaseName={connectionData.database}
          onResetConnection={resetConnection}
        />

        <ConnectionPanel
          connectionStatus={connectionStatus}
          apiKeyStatus={apiKeyStatus}
          connectionData={connectionData}
          useConnectionString={useConnectionString}
          isLoading={isLoading}
          onConnectionDataChange={setConnectionData}
          onUseConnectionStringChange={setUseConnectionString}
          onConnect={connectToDatabase}
          onSetApiKey={setApiKey}
        />

        <TablesDisplay connectionStatus={connectionStatus} tables={tables} />

        <TerminalOutput messages={messages} isLoading={isLoading} onExecuteQuery={executeQuery} />

        <InputArea
          connectionStatus={connectionStatus}
          apiKeyStatus={apiKeyStatus}
          currentInput={currentInput}
          isLoading={isLoading}
          onInputChange={setCurrentInput}
          onSubmit={handleInputSubmit}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  )
}

export default DatabaseTerminal