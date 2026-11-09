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
curl -sS 'http://127.0.0.1:8000/movies/search?name=spider'
```

When a query returns no results the API sets an `X-Message: No movies found` header and returns an empty JSON list `[]`.

## Saved payment cards

All card-management requests require `Authorization: Bearer <access_token>`
and an active customer account.

- `POST /user/cards` accepts `cardholder_name`, `card_number`,
  `billing_address`, and `expiration_date` (`YYYY-MM-DD`). It returns the saved
  card with status 201, or 409 when the customer already has three cards.
- `PUT /user/cards/{card_id}` updates an owned card and returns status 200.
  Send `cardholder_name`, `billing_address`, and `expiration_date`. Include
  `card_number` only when replacing it; omitting it (or sending null) keeps
  the existing encrypted number. Updated numbers receive the same validation.
- `DELETE /user/cards/{card_id}` removes an owned card and returns status 200.
  A missing card or another customer's card returns 404.
- `GET /user/me` now includes a `cards` list. Each item contains `card_id`,
  `cardholder_name`, `brand`, `last4`, `billing_address`, and `expiration_date`.
  Responses omit full card numbers and encrypted card numbers.

Registration and card additions share validation: 13–19 ASCII digits, a valid
Luhn checksum, and an expiration month that has not passed. Cards are valid
through the end of the expiration month. Invalid input returns 422.
Card numbers remain encrypted in the database. No database migration is needed.

Adding, updating, or removing a card sends the same account-update notification email as
profile edits, after the database transaction commits. The add and update responses keep
the saved-card fields and also includes `message` and `notification_sent`;
the removal response includes `message` and `notification_sent`. If email
delivery fails, the card change remains saved and the response reports
`notification_sent: false` while retaining its successful HTTP status.

## Troubleshooting
The full `database/Schema.sql` includes both session and booking tables.
Running it drops and recreates the tables.

Login issues a signed JWT containing a MySQL-generated integer session ID.
Logout deletes only that session. Changing or resetting a password deletes all
of that user's sessions in the same transaction as the password update. The
frontend should discard its token and show login after these operations.
Previously issued tokens without a session ID are rejected.

Session `expires_at` values represent UTC. Expired sessions are rejected even
before cleanup; old expired rows can be removed with:

```sql
DELETE FROM cinema_booking.UserSession WHERE expires_at <= UTC_TIMESTAMP();
```

Run the isolated tests from `backend` with
`python -m unittest discover -s tests -v`. Session tests use in-memory SQLite,
temporary test secrets, and mocked email delivery, not the live MySQL database.

- `ModuleNotFoundError: No module named 'app'` — run `uvicorn src.main:app` from `backend`.
- `pymysql.err.OperationalError (1045)` — check `DATABASE_URL` credentials.
- If you want me to seed a local `sqlite` database with sample data, ask and I will add a small seed script.
 

## Showtimes for a movie

`GET /movies/{movie_id}/showtimes` is public and returns the database showtimes
with `showtime_id`, `movie_id`, `hall_id`, `hall_number`, `show_date`, and
`show_time`. Dates use `YYYY-MM-DD`; times retain the stored display format.
Different halls showing the same movie at the same time remain separate items.
An existing movie with no showtimes returns 200 with `[]`; a missing movie
returns 404. No database migration is required.

Run isolated tests from `backend`: `python -m unittest discover -s tests -v`.


## Seat map for a showtime

`GET /showtimes/{showtime_id}/seats` is public. It returns `showtime_id`,
`hall_id`, `hall_number`, and a `seats` list containing `show_seat_id`,
`seat_id`, `seat_number`, and the database `status` (for example Available
or Booked). Seats are ordered by numeric seat number and restricted to the
selected showing and its hall. Missing showtimes return 404; an existing
showtime without availability records returns 200 with `seats: []`.

No database migration is required: the models map the existing Seat and
ShowSeat tables. Populate physical Seat rows for each hall and ShowSeat rows
for each showing before expecting seats in the response. The endpoint does
not create availability records or reserve seats.


## Booking draft seat selection

Create a draft with `POST /booking-drafts`, then send
`PUT /booking-drafts/{draft_id}/seats` with `X-Booking-Token` set to the
returned access token and a JSON body such as `{"show_seat_ids": [101, 102]}`.
The seat count must equal the draft ticket count. Duplicate IDs, wrong
showings/halls, booked seats, and seats reserved by another draft are rejected.
A successful replacement releases the draft's previous seats; a rejected
replacement rolls back and preserves the original selection.

Draft responses include `selected_show_seat_ids`. Public seat-map responses
show draft-held seats as `Reserved` without exposing draft IDs or tokens.
Automatic expiry and checkout are not implemented yet.

The draft tables are in `database/Schema.sql`. Running it drops and recreates tables.


## Create a draft and select seats together

`POST /booking-drafts` now requires `show_seat_ids` alongside `showtime_id`,
`adult`, `child`, and `senior`. Example:

```json
{"showtime_id":12,"adult":2,"child":1,"senior":0,"show_seat_ids":[101,102,103]}
```

The frontend keeps ticket and seat choices locally until submitting this
request. Creating the draft and reserving all seats commit together; a failure
rolls back both. The response includes the draft access token and selected IDs.
`PUT /booking-drafts/{draft_id}/seats` remains available for later changes.
This supersedes the earlier two-request creation flow. Tests remain deferred.


## Update tickets and seats together (current API)

`PUT /booking-drafts/{draft_id}` replaces ticket quantities and selected seats
in one transaction. Send `X-Booking-Token` and a complete selection:

```json
{"adult":1,"child":1,"senior":0,"show_seat_ids":[104,105]}
```

The draft keeps its existing showtime, ID, and access token. A failed update
rolls back both the ticket changes and seat changes. A successful update
releases seats no longer selected. This replaces the earlier
`PUT /booking-drafts/{draft_id}/seats` route, which has been removed.
`POST /booking-drafts` creates tickets and seats together and also requires
`showtime_id`. `GET /booking-drafts/{draft_id}` still restores saved state.
No further SQL changes are required. Tests remain deferred.
