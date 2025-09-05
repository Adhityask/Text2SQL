from langchain_community.utilities import SQLDatabase

def build_connection_url(db_type, user, password, host, port, database):
    if db_type == "mysql":
        return f"mysql+mysqldb://{user}:{password}@{host}:{port}/{database}"
    elif db_type == "postgresql":
        return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
    else:
        raise ValueError("Unsupported database type. Use 'mysql' or 'postgresql'.")


def connect_database(connection_url):
    try:
        db = SQLDatabase.from_uri(connection_url)
        return db
    except Exception as e:
        raise ConnectionError(f"Failed to connect: {str(e)}")