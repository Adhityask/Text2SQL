from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db_utils import build_connection_url, connect_database
from langchain_google_genai import ChatGoogleGenerativeAI 
from dotenv import load_dotenv 
from langchain_community.utilities import SQLDatabase
from langchain.prompts import PromptTemplate
from sqlalchemy import text
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
        
        
        if isinstance(db_instance, SQLDatabase):
            tables = db_instance.get_usable_table_names()
        else:
            sql_db = SQLDatabase(db_instance)
            tables = sql_db.get_usable_table_names()

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
        api_key = request.session.get("api_key")
        if not api_key:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "No API key found. Please set your API key first.",
                "data": None
            }, status=400)
        
        session_id = request.session.session_key
        if not session_id or session_id not in connections:
            return Response({
                "error": True,
                "status_code": 400,
                "message": "Database not connected. Please call connect-db first.",
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
        # 🔹 Handle small talk
        # ---------------------------
        if normalized in SMALL_TALK:
            return Response({
                "error": False,
                "status_code": 200,
                "message": "Acknowledged 👍",
                "data": None
            }, status=200)

        # ---------------------------
        # 🔹 Normal SQL flow
        # ---------------------------
        db_instance = connections[session_id]
        db = db_instance if isinstance(db_instance, SQLDatabase) else SQLDatabase(db_instance)

        schema = db.get_table_info()
        tables = db.get_usable_table_names()

        # Build LLM prompt
        prompt_text = f"""
You are a strict SQL query generator.

RULES:
1. Only generate valid SQL queries using the given tables and schema.
2. Output must be ONLY the raw SQL query. No explanations, no formatting, no extra text.
3. If the question cannot be answered using the provided schema, respond exactly with:
   "I don't have enough knowledge about that."
4. If no schema is provided, respond exactly with:
   "I don't have enough data to generate SQL query."
5. If no tables are available, respond exactly with:
   "I don't have knowledge, please connect a proper database."

Tables:
{tables}

Database Schema:
{schema}

User Question:
{question}
"""

        # Call LLM
        llm = get_llm(api_key)
        response_llm = llm.invoke(prompt_text)
        sql_query = response_llm.content.strip()

        # Clean code blocks
        if sql_query.startswith("```sql"):
            sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
        elif sql_query.startswith("```"):
            sql_query = sql_query.replace("```", "").strip()

        # Save session
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
        print("❌ ERROR in askdb:", str(e))
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
            rows = result.fetchall()
            columns = result.keys()

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