import { useState } from "react"
import axios from "axios"
import { TerminalHeader } from "./TerminalHeader"
import { ConnectionPanel } from "./ConnectionPanel"
import { TablesDisplay } from "./TablesDisplay"
import { TerminalOutput } from "./TerminalOutput"
import { InputArea } from "./InputArea"

const DatabaseTerminal = () => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [tables, setTables] = useState([])
  const [messages, setMessages] = useState([
    {
      type: "system",
      content: "Database Terminal initialized. Please connect to your database.",
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
  })
  const [useConnectionString, setUseConnectionString] = useState(false)

  const addMessage = (type, content, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        content,
        timestamp: new Date().toLocaleTimeString(),
        ...extra,
      },
    ])
  }

  const connectToDatabase = async () => {
    setConnectionStatus("connecting")
    setIsLoading(true)

    let validatingTimeout, establishingTimeout

    addMessage("system", "🔄 Initializing database connection...")

    validatingTimeout = setTimeout(() => {
      if (connectionStatus === "connecting") {
        addMessage("system", "🔍 Validating credentials...")
      }
    }, 500)

    establishingTimeout = setTimeout(() => {
      if (connectionStatus === "connecting") {
        addMessage("system", "🌐 Establishing secure connection...")
      }
    }, 1000)

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
        headers: {
          "Content-Type": "application/json",
        },
      })

      setConnectionStatus("connected")
      addMessage("success", `✅ Successfully connected to ${connectionData.database || "database"}`)

      setTimeout(() => fetchTables(), 500)
    } catch (error) {
      clearTimeout(validatingTimeout)
      clearTimeout(establishingTimeout)

      setConnectionStatus("error")
      const errorMessage =  error.response?.data?.message || error.message || "Unknown error"
      addMessage("error", `❌ Connection failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTables = async () => {
    try {
      addMessage("system", "📋 Fetching database schema...")

      const response = await axios.get("http://localhost:8000/get-tables/", {
        withCredentials: true,
      })

      const data = response.data

      if (data.data && data.data.tables) {
        setTables(data.data.tables)
        addMessage(
          "success",
          `✅ Database ready! Found ${data.data.tables.length} tables: ${data.data.tables.join(", ")}`,
        )
        addMessage("system", "💬 You can now ask questions about your database in natural language.")
      } else {
        addMessage("error", `❌ Failed to fetch tables: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error"
      addMessage("error", `❌ Failed to fetch tables: ${errorMessage}`)
    }
  }

  const askDatabase = async (question) => {
    if (!question.trim()) return

    setIsLoading(true)
    addMessage("user", `❓ ${question}`)
    addMessage("system", "🤖 Processing your question...")

    try {
      const response = await axios.post(
        "http://localhost:8000/ask-db/",
        { question },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      const data = response.data
      const query = data.data?.query || data.query || ""

      const isValidSQLQuery =
        query &&
        !query.toLowerCase().includes("don't have enough knowledge") &&
        !query.toLowerCase().includes("i don't know") &&
        !query.toLowerCase().includes("cannot") &&
        (query.toLowerCase().includes("select") ||
          query.toLowerCase().includes("insert") ||
          query.toLowerCase().includes("update") ||
          query.toLowerCase().includes("delete") ||
          query.toLowerCase().includes("create") ||
          query.toLowerCase().includes("alter") ||
          query.toLowerCase().includes("drop"))

      setLastGeneratedQuery(isValidSQLQuery ? query : "")
      addMessage("sql", `📝 Generated SQL Query:\n${query}`, {
        explanation: data.explanation,
        canExecute: isValidSQLQuery,
        query: query,
      })
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error"
      addMessage("error", `❌ Failed to generate query: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const executeQuery = async () => {
    if (!lastGeneratedQuery) return

    setIsLoading(true)
    addMessage("system", "⚡ Executing SQL query...")

    try {
      const response = await axios.post(
        "http://localhost:8000/execute-db/",
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      addMessage("result", `📊 ${response.data.result || "Query executed successfully"}`, {
        data: response.data.data,
      })
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error"
      addMessage("error", `❌ Execution failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

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
    setTables([])
    setLastGeneratedQuery("")
    setMessages([
      {
        type: "system",
        content: "Connection reset. Please connect to your database.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto p-6 max-w-6xl">
        <TerminalHeader
          connectionStatus={connectionStatus}
          databaseName={connectionData.database}
          onResetConnection={resetConnection}
        />

        <ConnectionPanel
          connectionStatus={connectionStatus}
          connectionData={connectionData}
          useConnectionString={useConnectionString}
          isLoading={isLoading}
          onConnectionDataChange={setConnectionData}
          onUseConnectionStringChange={setUseConnectionString}
          onConnect={connectToDatabase}
        />

        <TablesDisplay connectionStatus={connectionStatus} tables={tables} />

        <TerminalOutput messages={messages} isLoading={isLoading} onExecuteQuery={executeQuery} />

        <InputArea
          connectionStatus={connectionStatus}
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


