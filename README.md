# Housekeeping Backend (CommonJS)

Express API for assigning tasks. Uses PostgreSQL in non-test environments (RDS ready) and falls back to in-memory storage for tests.

## Prerequisites
- Node.js 18+
- PostgreSQL (or AWS RDS)

## Environment
Create `.env` (values from your RDS provided):
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

`NODE_ENV=test` is set automatically for Jest to keep tests in-memory.

## Database
Run in pgAdmin or psql:
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
    frequency VARCHAR(50),
    task_start_date DATE,
    submission_date DATE,
    delay INT,
    remainder VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Install & Run
```
npm install
npm run dev   # nodemon
# or
npm start     # node src/server.js
```

## API
Base path: `/api`

### Working Days
- `GET /api/working-days` — rows from `working_day`.

### Assign Tasks (all under `/api/assigntask/generate`)
- `GET /api/assigntask/generate` — list all assignments.
- `GET /api/assigntask/generate/:id` — fetch one assignment.
- `POST /api/assigntask/generate` — create assignments on each working day starting from `task_start_date`.
- `PATCH /api/assigntask/generate/:id` — update one assignment (multipart supported).
- `DELETE /api/assigntask/generate/:id` — delete one assignment.
- `GET /api/assigntask/generate/stats` — dashboard snapshot (total, completed, pending, not done, overdue, progress%).

### Dashboard
- `GET /api/dashboard/summary` — same dashboard snapshot, exposed as a dedicated route for frontend dashboards.

Body (JSON or multipart/form-data):
- `task_start_date` (required) — ISO date-time string (e.g., `2025-12-27T18:30:00.000Z`); first date to consider.
- `frequency` (optional) — `daily` (default), `weekly`, `monthly`, or `yearly`.
- Any base assignment fields you want copied to each created row (e.g., `department`, `name`, `task_description`, `given_by`, `remark`, `status`, `attachment`, `remainder`).
- `image` (optional file) — form-data field; saved to `/uploads/<filename>` and applied to every generated record.

Notes:
- Uses the existing `working_day` table to pick real working dates; returns 400 errors when dates are invalid or no working days exist on/after the start.
- Response shape: `{ "count": <number>, "items": [ ...createdRecords ] }`
- Updates automatically stamp `submission_date` to "now" when not provided and recompute `delay` based on `task_start_date` vs `submission_date`. If you pass `submission_date` in PATCH, use an ISO date-time string.

Example request (JSON):
```json
{
  "department": "Maintenance",
  "name": "John Doe",
  "task_description": "Clean lobby",
  "frequency": "daily",
  "task_start_date": "2025-12-27T18:30:00.000Z",
  "given_by": "Supervisor",
  "remark": "Prioritize morning"
}
```

Example success response:
```json
{
  "count": 3,
  "items": [
    {
      "id": 1,
      "task_id": "1",
      "department": "Maintenance",
      "given_by": "Supervisor",
      "name": "John Doe",
      "task_description": "Clean lobby",
      "remark": "Prioritize morning",
      "status": null,
      "image": "/uploads/1732694440000-123456789.png",
      "attachment": null,
      "frequency": "daily",
      "task_start_date": "2025-12-27T00:00:00.000Z",
      "submission_date": null,
      "delay": null,
      "remainder": null,
      "created_at": "2025-11-26T08:00:00.000Z"
    }
  ]
}
```

Validation errors return HTTP 400 with details.

### POST /api/uploads/image
- Form-data field: `image` (file, max 5MB)
- Returns: `{ "url": "/uploads/<filename>" }`
- Use the returned `url` in frontend to display the uploaded image.

### Auth
- `POST /api/auth/login` — checks `users` table by `user_name` and `password`.

Body:
```json
{
  "user_name": "your-username",
  "password": "your-password"
}
```

On success: `{ "message": "Login successful", "user": { "id", "user_name", "name" } }`  
On failure: HTTP 401.

## Testing (Jest + Supertest)
```
npm test
```
Tests hit the Express app in-memory and do not require a database.

## Postman tips
- For JSON: set `Content-Type: application/json`.
- For generation with a file: use `form-data`, field `image` (file), plus text fields (e.g., `task_start_date`, `frequency`, `department`, `task_description`).
- List: `GET /api/assigntask/generate`; detail: `GET /api/assigntask/generate/:id`; update: `PATCH /api/assigntask/generate/:id`; delete: `DELETE /api/assigntask/generate/:id`.
- Dashboard: `GET /api/assigntask/generate/stats`.
- Dedicated dashboard route: `GET /api/dashboard/summary`.
- To seed working days, use your database and query them via `GET /api/working-days` to confirm before calling `/api/assigntask/generate`.

## Notes
- PostgreSQL connection is configured in `config/db.js`; it is skipped in tests and uses SSL when `PG_SSL=true`.
- Core code paths: `src/app.js`, `src/server.js`, `src/routes/assignTaskRoutes.js`, `src/controllers/assignTaskController.js`, `src/services/assignTaskService.js`, `src/repositories/assignTaskRepository.js`, `src/middleware/errorHandler.js`, `src/middleware/validate.js`.
