from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db_utils import build_connection_url, connect_database
from langchain_google_genai import ChatGoogleGenerativeAI 
from dotenv import load_dotenv 
from langchain_community.utilities import SQLDatabase
from langchain.prompts import PromptTemplate
from sqlalchemy import text, inspect
import traceback

load_dotenv()

def get_llm(api_key):
    return ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)

connections = {}   # key = session_id, value = db_instance

@api_view(['POST'])
def connect_db(request):
    """
    url:- connect-db/
    doc :- API to connect to a MySQL or PostgreSQL database.

    Example payloads:
    {
        "db_type": "postgresql",
        "host": "localhost",
        "port": "5432",
        "user": "postgres",
        "password": "mypassword",
        "database": "school"
    }

    Or:
    {
        "connection_string": "postgresql+psycopg2://user:pass@host:5432/dbname"
    }
"""
    try:
         
        if not request.session.session_key:
            request.session.create()
        session_id = request.session.session_key

        if "connection_string" in request.data:
            connection_url = request.data.get("connection_string")
        else:

            db_type = request.data.get("db_type")
            host = request.data.get("host")
            port = request.data.get("port")
            user = request.data.get("user")
            password = request.data.get("password")
            database = request.data.get("database")

            if not all([db_type, host, port, user, password, database]):
                return Response({
                    "error": True,
                    "status_code": 400,
                    "message": "Missing required fields",
                    "data": None
                }, status=400)

            connection_url = build_connection_url(
                db_type, user, password, host, port, database
            )

        # Connect to DB - this should return a SQLAlchemy engine or connection
        db_instance = connect_database(connection_url)

        # Save db_instance in dictionary under this session_id
        connections[session_id] = db_instance

        return Response({
            "error": False,
            "status_code": 200,
            "message": "Database connected successfully!",
            "data":{}
        }, status=200)

    except Exception as e:
        return Response({
            "error": True,
            "status_code": 500,
            "message": f"Failed to connect: {str(e)}",
            "data": None
        }, status=500)


@api_view(['GET'])
def get_tables(request):
    """
    url:- get-tables/
    doc :- API to fetch all table names from the connected database.
    """
    try:
       
        session_id = request.session.session_key
        if not session_id or session_id not in connections:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "Database not connected. Please call connect-db first.",
                "data": None
            }, status=400)

        db_instance = connections[session_id]
        
        # Force fresh table lookup by using SQLAlchemy inspector directly
        if isinstance(db_instance, SQLDatabase):
            # Use the engine from SQLDatabase and create fresh inspector
            inspector = inspect(db_instance._engine)
            tables = inspector.get_table_names()
        else:
            # Create fresh inspector from engine
            inspector = inspect(db_instance)
            tables = inspector.get_table_names()

        return Response({
            "error": False,
            "status_code": 200,
            "message": "Fetched table names successfully",
            "data": {"tables": tables}
        }, status=200)

    except Exception as e:
        return Response({
            "error": True,
            "status_code": 500,
            "message": f"Failed to fetch tables: {str(e)}",
            "data": None
        }, status=500)



SMALL_TALK = {
    # greetings
    "hi", "hello", "hey", "yo", "hola", "namaste", "sup", "good morning",
    "good afternoon", "good evening",

    # acknowledgements
    "ok", "okay", "k", "kk", "alright", "fine", "cool", "got it",
    "understood", "roger", "sure", "done",

    # thanks / appreciation
    "thanks", "thank you", "thx", "ty", "thanks a lot", "thank you so much",
    "much appreciated", "cheers",

    # farewells
    "bye", "goodbye", "see ya", "see you", "take care", "later",
    "catch you later", "cya", "gn", "good night",

    # casual filler
    "hmm", "hmmm", "hahaha", "lol", "haha", "nice", "great", "cool beans"
}

@api_view(['POST'])
def askdb(request):  
    """
    url:- ask-db/
    doc :- User asks natural language question about their DB.
    payload: { "question": "What is the average percentage of students?" }
    """
    try:  
        session_id = request.session.session_key
        if not session_id or session_id not in connections:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "Database not connected. Please call connect-db first.",
                "data": None
            }, status=400)
        
        api_key = request.session.get("api_key")
        if not api_key:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "No API key found. Please set your API key first.",
                "data": None
            }, status=400)

        question = request.data.get("question")
        if not question:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "Missing question field",
                "data": None
            }, status=400)

        normalized = question.lower().strip()

        # ---------------------------
        # Handle small talk
        # ---------------------------
        if normalized in SMALL_TALK:
            return Response({
                "error": False,
                "status_code": 200,
                "message": "Acknowledged",
                "data": None
            }, status=200)
    
        # ---------------------------
        # Normal SQL flow
        # ---------------------------
        db_instance = connections[session_id]
        
        # Create a fresh SQLDatabase instance to ensure latest schema
        if isinstance(db_instance, SQLDatabase):
            db = SQLDatabase(db_instance._engine)
        else:
            db = SQLDatabase(db_instance)

        # Force refresh of table info by creating new instance
        db._get_sample_rows = lambda table_name: ""
        schema = db.get_table_info()
        tables = db.get_usable_table_names()

        print(schema)
        prompt_text = f"""
You are an expert SQL query generator with analytical capabilities. Follow these rules precisely:
## Pre-Analysis Phase
Before generating any SQL query, you must:
1. **Schema Analysis**: Examine all provided tables, their columns, data types, constraints, and relationships
2. **Requirement Analysis**: Break down the user's request to understand what tables/columns are needed
3. **Relationship Mapping**: Identify foreign key relationships and join requirements
4. **Query Type Classification**: Determine if this is DDL (CREATE/ALTER/DROP), DML (INSERT/UPDATE/DELETE), or DQL (SELECT)
5. **Validation Check**: Verify all referenced tables and columns exist in the provided schema
## Core Rules
### 1. Schema-First Approach
- **ALWAYS** read the complete schema before generating SQL
- Use **EXACT** table and column names from schema (no assumptions, no pluralization)
- If schema shows `customer` table, use `customer` not `customers`
- If column is `customerid`, use `customerid` not `customer_id`

### 2. Foreign Key Handling
- **Existing referenced table with PK**: Use the primary key column(s)
  ```sql
  -- If schema shows: customer(customerid PK, name, email)
  FOREIGN KEY (customer_id) REFERENCES customer(customerid)
  ```
- **Existing referenced table without declared PK**: Use id-like column (customerid, customer_id, id)
- **Missing referenced table**: Respond exactly: `"I don't have enough knowledge about that."`
- **Create referenced table only when explicitly requested**
### 3. DDL Commands (CREATE/ALTER/DROP)
- **CREATE TABLE**: Include appropriate data types, constraints, and primary keys
- **ALTER TABLE**: Specify exact modification (ADD COLUMN, DROP COLUMN, MODIFY, etc.)
- **DROP TABLE**: Include CASCADE if foreign key dependencies exist
- **Indexes**: Create appropriate indexes for foreign keys and frequently queried columns
### 4. DML Commands (INSERT/UPDATE/DELETE)
- **INSERT**: Use consistent formatting:
  ```sql
  INSERT INTO products (productid, product_name, category, price) 
  VALUES (1, 'Laptop', 'Electronics', 999.99);
  ```
- **UPDATE**: Always include WHERE clause unless bulk update is explicitly requested
- **DELETE**: Always include WHERE clause unless truncation is explicitly requested
- **Batch Operations**: Generate multiple statements when appropriate
### 5. DQL Commands (SELECT)
- **Simple SELECT**: Use proper column selection and table references
- **JOINs**: Use appropriate join types (INNER, LEFT, RIGHT, FULL OUTER)
- **Aggregations**: Include proper GROUP BY and HAVING clauses
- **Subqueries**: Use when complex filtering is needed
- **Window Functions**: Apply for advanced analytics when appropriate
### 6. Output Format
- **SQL ONLY**: Output must be raw SQL query text
- **No explanations, comments, or additional text**
- **Proper formatting**: Use consistent indentation and line breaks for readability
- **Semicolon termination**: End each statement with semicolon
### 7. Error Handling
- **No schema provided**: `"I don't have enough data to generate SQL query."`
- **Schema provided but empty**: `"I don't have knowledge, please connect a proper database."`
- **Unknown table/column referenced**: `"I don't have enough knowledge about that."`
- **Ambiguous request**: `"I don't have enough knowledge about that."`
### 8. Advanced Features
- **Transactions**: Wrap related DML operations in BEGIN/COMMIT blocks when appropriate
- **Constraints**: Add CHECK constraints, UNIQUE constraints as needed
- **Data Types**: Choose appropriate data types based on context
- **Performance**: Consider indexing strategies for large datasets
## Analysis Framework
Before generating SQL, mentally process:
1. What tables are involved?
2. What columns are needed?
3. What relationships exist?
4. What constraints apply?
5. What is the expected output?
## Example Workflow
```
User Request: "Create orders table with customer reference"
Analysis:
- DDL command (CREATE TABLE)
- Need: orders table structure
- Foreign key: customer reference
- Check: customer table exists in schema?
- PK: What's the customer table's primary key?
- Generate: CREATE TABLE with proper foreign key
```
Remember: Think first, validate against schema, then generate precise SQL.
{tables}

Database Schema:
{schema}

User Question:
{question}
"""
        
        llm = get_llm(api_key)
        response_llm = llm.invoke(prompt_text)
        sql_query = response_llm.content.strip()

        
        if sql_query.startswith("```sql"):
            sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
        elif sql_query.startswith("```"):
            sql_query = sql_query.replace("```", "").strip()

        
        request.session["last_question"] = question
        request.session["last_query"] = sql_query
        request.session.save()

        return Response({
            "error": False,
            "status_code": 200,
            "message": "SQL query generated successfully",
            "data": {"query": sql_query}
        }, status=200)

    except Exception as e:
        print("ERROR in askdb:", str(e))
        traceback.print_exc()
        return Response({
            "error": True,
            "status_code": 500,
            "message": f"Failed to process question: {str(e)}",
            "data": None
        }, status=500)


@api_view(['POST'])
def execute_db(request):
    """
    url:- execute-db/
    doc :- Execute the last generated SQL query and return results in natural language.
    """
    try:
         
        
        session_id = request.session.session_key
        if not session_id or session_id not in connections:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "Database not connected. Please call connect-db first.",
                "data": None
            }, status=400)
        
        api_key = request.session.get("api_key")
        if not api_key:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "No API key found. Please set your API key first.",
                "data": None
            }, status=400)

        sql_query = request.session.pop("last_query", None)
        user_question = request.session.pop("last_question", None)
        request.session.save()
        if not sql_query or not user_question:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "No query found. Please call ask-db first.",
                "data": None
            }, status=400)
                    
        db_instance = connections[session_id]
        
        # Fix: Access engine correctly for SQLDatabase objects
        if isinstance(db_instance, SQLDatabase):
            engine = db_instance._engine  # SQLDatabase stores engine as _engine
        else:
            engine = db_instance
            
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            if sql_query.strip().lower().startswith(("select", "show", "desc", "describe", "explain")):
                rows = result.fetchall()
                columns = result.keys()
                data = [dict(zip(columns, row)) for row in rows]
            else:
                conn.commit()  # commit for INSERT/UPDATE/DELETE
                data = None
                rows = []       
                columns = []    
                 

        data = [dict(zip(columns, row)) for row in rows]
                
        # Better prompt with "For your data..."
        nl_prompt = f"""
You are a helpful assistant that explains database query results in very simple and clear language.

Context:
- The user originally asked: "{user_question}"
- The SQL query that was executed: {sql_query}
- The raw database results: {data}

Instructions:
1. Always start your explanation with: "For your data, ..."
2. Summarize the results in plain English, as if explaining to a non-technical person.
3. Be clear and concise. Avoid technical SQL or database jargon.
4. If the result has numbers (like counts, averages, percentages), highlight them clearly.
5. If multiple rows are present, describe the key insights (not just listing them blindly).
6. Keep the explanation friendly and easy to understand.

Now give the explanation:
"""
        llm = get_llm(api_key)
        response = llm.invoke(nl_prompt)
        answer = response.content.strip()

        return Response({
            "error": False,
            "status_code": 200,
            "message": "Query executed successfully",
            "data": {
                "rows": data,
                "nl_answer": answer
            }
        }, status=200)

    except Exception as e:
        return Response({
            "error": True,
            "status_code": 500,
            "message": f"Failed to execute query: {str(e)}",
            "data": None
        }, status=500)

@api_view(['POST'])
def set_api_key(request):
    """
    url:- set-api-key/
    doc :- Store user's Google API key in session.
    payload: { "api_key": "your_google_api_key" }
    """
    api_key = request.data.get("api_key")
    if not api_key:
        return Response({
            "error": True,
            "status_code": 400,
            "message": "Missing API key",
            "data": None
        }, status=400)

    request.session["api_key"] = api_key
    request.session.save()

    return Response({
        "error": False,
        "status_code": 200,
        "message": "API key stored successfully",
        "data": {}
    }, status=200)