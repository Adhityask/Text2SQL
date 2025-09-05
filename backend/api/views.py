from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db_utils import build_connection_url, connect_database


# Create your views here.
db_instance = None 

@api_view(['POST'])
def connect_db(request):
    """
    url:- connect-db/
    doc :- API to connect to a MySQL or PostgreSQL database.
    
    Expects JSON like:
    {
        "db_type": "postgresql",
        "host": "localhost",
        "port": "5432",
        "user": "postgres",
        "password": "mypassword",
        "database": "school"
    }
    
    With connection string:
    {
        "connection_string": "postgresql+psycopg2://user:pass@host:5432/dbname?sslmode=require"
    }
    """
    global db_instance
    try:
        
        if "connection_string" in request.data:
            connection_url = request.data.get("connection_string")
        else:
            # Case 2: Build connection string from fields
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

        # Try to connect
        db_instance = connect_database(connection_url)
        tables = db_instance.get_table_names()

        return Response({
            "error": False,
            "status_code": 200,
            "message": "Database connected successfully!",
            "data": {"tables": tables}
        }, status=200)

    except Exception as e:
        return Response({
            "error": True,
            "status_code": 500,
            "message": f"Failed to connect: {str(e)}",
            "data": None
        }, status=500)
