# Housekeeping Backend (CommonJS)

Node.js/Express API for working days, task generation, task management, users, and auth. Uses PostgreSQL (RDS-ready); tests run in-memory.

## Prerequisites
- Node.js 18+
- PostgreSQL (or AWS RDS)

## Environment (.env)
```
NODE_ENV=development
PORT=3005
LOG_LEVEL=info
PG_HOST=database-3.c1wm8i46kcmm.ap-south-1.rds.amazonaws.com
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=sagarpipe
PG_DATABASE=Housekeeping
PG_SSL=true
JWT_SECRET=choose-a-long-random-string
MAYTAPI_PRODUCT_ID=your-product-id
MAYTAPI_PHONE_ID=your-phone-id
MAYTAPI_TOKEN=your-maytapi-token
MAYTAPI_GROUP_ID=whatsapp-group-id
```
`NODE_ENV=test` is set automatically for Jest and keeps data in-memory.

## Database
Create tables (run in pgAdmin/psql):
```sql
CREATE TABLE IF NOT EXISTS assign_task (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    given_by VARCHAR(100),
    name VARCHAR(100),
    task_description TEXT,
    remark TEXT,
    status VARCHAR(50),
    image TEXT,
    attachment TEXT,
    hod VARCHAR(255),
    frequency VARCHAR(50),
    task_start_date DATE,
    submission_date DATE,
    delay INT,
    remainder VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_name VARCHAR(255),
    password VARCHAR(255),
    email_id VARCHAR(255),
    number BIGINT,
    department VARCHAR(255),
    given_by VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50),
    user_access TEXT,
    leave_date DATE,
    remark TEXT,
    leave_end_date DATE,
    employee_id VARCHAR(50),
    created_at_custom TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Install & Run
```
npm install
npm run dev   # nodemon
# or
npm start     # node src/server.js
```

## API (base path `/api`)

### Working Days
- `GET /api/working-days` — list `working_day` rows.
  - Response: `[{ "id": 1, "working_date": "2025-12-27" }]`

### Assign Tasks (`/api/assigntask/generate`)
- `GET /api/assigntask/generate` — list assignments.
- `GET /api/assigntask/generate/:id` — fetch one.
- `POST /api/assigntask/generate` — generate tasks from working days (multipart or JSON).
- `PATCH /api/assigntask/generate/:id` — update one (multipart supported).
- `POST /api/assigntask/generate/:id/confirm` — mark a task as confirmed (writes `attachment = "confirmed"`).
- `DELETE /api/assigntask/generate/:id` — delete one.
- `GET /api/assigntask/generate/stats` — totals (total/completed/pending/not done/overdue/progress%).
- `GET /api/assigntask/generate/overdue` — tasks before/through yesterday with no submission.
- `GET /api/assigntask/generate/not-done` — tasks marked `status = "no"`.
- `GET /api/assigntask/generate/today` — tasks whose `task_start_date` is today.
- Optional query: `limit`, `page` or `offset`, and `department` (for list/overdue/today/not-done).

Example list response (`GET /api/assigntask/generate?limit=2`):
```json
[
  {
    "id": 1,
    "task_id": "1",
    "department": "Maintenance",
    "given_by": "Supervisor",
    "name": "John Doe",
    "task_description": "Clean lobby",
    "remark": "Prioritize morning",
    "status": "yes",
    "image": "/api/uploads/123.png",
    "attachment": null,
    "hod": "Alice,Bob",
    "frequency": "daily",
    "task_start_date": "2025-12-27T00:00:00.000Z",
    "submission_date": "2025-12-27T06:30:00.000Z",
    "delay": 0,
    "remainder": null,
    "created_at": "2025-12-26T18:30:00.000Z"
  }
]
```

Example stats response (`GET /api/assigntask/generate/stats` or `/api/dashboard/summary`):
```json
{
  "total": 120,
  "completed": 80,
  "pending": 25,
  "not_done": 10,
  "overdue": 5,
  "progress_percent": 67
}
```

**POST / PATCH body (JSON or multipart/form-data):**
- Required for POST: `task_start_date` (ISO datetime).
- Optional: `frequency` (`daily` default, `weekly`, `monthly`, `yearly`), `department`, `name`, `task_description`, `given_by`, `remark`, `status`, `attachment`, `hod`, `remainder`, `image` file.
- On PATCH, `submission_date` is preserved unless explicitly provided; `delay` recomputes when date fields change.

### Dashboard
- `GET /api/dashboard/summary` — same stats as above, dedicated for frontend dashboards.

### Users (`/api/users`)
- `GET /api/users` — list users.
- `GET /api/users/:id` — fetch one.
- `POST /api/users` — create (requires `user_name`, `password`; others optional).
- `PATCH /api/users/:id` — update (partial).
- `DELETE /api/users/:id` — delete.
  - Example list response:
  ```json
  [
    {
      "id": 1,
      "user_name": "admin",
      "email_id": "admin@example.com",
      "department": "HQ",
      "role": "admin",
      "status": "active"
    }
  ]
  ```

### Auth
- `POST /api/auth/login` — checks `users.user_name` and `password`.
  - Body: `{ "user_name": "<string>", "password": "<string>" }`
  - Success: `{ "message": "Login successful", "user": { "id", "user_name", "role" } }`
  - Failure: HTTP 401.
- `POST /api/auth/logout` — stateless logout; returns `{ "message": "Logout successful" }` (frontends should clear stored tokens/credentials).

### Uploads
- `POST /api/uploads/image` — form-data field `image` (max 5MB); returns `{ "url": "/uploads/<filename>" }`.
- Files are served at `/uploads/<file>` and `/api/uploads/<file>`.

## Examples
Create tasks from working days:
```bash
curl -X POST http://localhost:3005/api/assigntask/generate \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Maintenance",
    "name": "John Doe",
    "task_description": "Clean lobby",
    "frequency": "daily",
    "task_start_date": "2025-12-27T18:30:00.000Z",
    "given_by": "Supervisor",
    "remark": "Prioritize morning"
  }'
```

Upload an image:
```bash
curl -X POST http://localhost:3005/api/uploads/image \
  -F "image=@/path/to/file.png"
```

Login:
```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_name":"admin","password":"Welcome@1234d"}'
```

## Postman tips
- Use `Content-Type: application/json` for JSON.
- Use `form-data` for file uploads (`image`) with other text fields.
- Key routes: assignments `/api/assigntask/generate`, dashboard `/api/dashboard/summary`, users `/api/users`, auth `/api/auth/login`, uploads `/api/uploads/image`.

## Notes
- PG connection is configured in `config/db.js`; SSL honored when `PG_SSL=true`.
- Core paths: `src/app.js`, `src/server.js`, `src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/middleware`.
