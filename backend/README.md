# Backend (Cinema Booking API)

This folder contains the FastAPI backend for the Cinema Booking project.

## Requirements
- Python 3.11+ (3.12 tested here)
- A virtual environment is recommended
- Install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration
The app reads `DATABASE_URL` from the environment. Examples:

- MySQL root with no password (local dev):

```bash
export DATABASE_URL='mysql+pymysql://root:@localhost:3306/cinema_booking'
```

## Start server
Run from the `backend` folder:

```bash
uvicorn src.main:app --reload
```

Notes:
- Use `uvicorn main:app --reload` if you run the command with the `backend` folder as the Python module root and your `PYTHONPATH` is configured differently. The recommended command above works when `src` is a package.

## Test the endpoints
Open the interactive docs at: `http://127.0.0.1:8000/docs`.

Or use `curl`:

```bash
# health check
curl -sS http://127.0.0.1:8000/health

# currently running movies (optionally filter by genre)
curl -i 'http://127.0.0.1:8000/movies/currently-running?genre=Fantasy'

# coming soon
curl -sS http://127.0.0.1:8000/movies/coming-soon

# search by name
curl -sS 'http://127.0.0.1:8000/movies/search?name=Inception'
```

When a query returns no results the API sets an `X-Message: No movies found` header and returns an empty JSON list `[]`.

## Troubleshooting
- `ModuleNotFoundError: No module named 'app'` — run `uvicorn src.main:app` from `backend`.
- `pymysql.err.OperationalError (1045)` — check `DATABASE_URL` credentials.
- If you want me to seed a local `sqlite` database with sample data, ask and I will add a small seed script.
 