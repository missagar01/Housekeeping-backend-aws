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

### POST /api/assignments
- Required body: `department`, `name`, `task_description`
- Optional: `given_by`, `remark`, `status`, `image`, `attachment`, `frequency`, `task_start_date`, `submission_date`, `delay`, `remainder`
- Auto-generated: `id`, `task_id`, `created_at`

Example request:
```json
{
  "department": "Maintenance",
  "name": "John Doe",
  "task_description": "Clean lobby",
  "frequency": "daily"
}
```

Example success response:
```json
{
  "id": 1,
  "task_id": "TASK-000001",
  "department": "Maintenance",
  "given_by": null,
  "name": "John Doe",
  "task_description": "Clean lobby",
  "remark": null,
  "status": null,
  "image": null,
  "attachment": null,
  "frequency": "daily",
  "task_start_date": null,
  "submission_date": null,
  "delay": null,
  "remainder": null,
  "created_at": "2025-11-26T08:00:00.000Z"
}
```

Validation errors return HTTP 400 with details.

### POST /api/uploads/image
- Form-data field: `image` (file, max 5MB)
- Returns: `{ "url": "/uploads/<filename>" }`
- Use the returned `url` in frontend to display the uploaded image.

## Testing (Jest + Supertest)
```
npm test
```
Tests hit the Express app in-memory and do not require a database.

## Notes
- PostgreSQL connection is configured in `config/db.js`; it is skipped in tests and uses SSL when `PG_SSL=true`.
- Core code paths: `src/app.js`, `src/server.js`, `src/routes/assignTaskRoutes.js`, `src/controllers/assignTaskController.js`, `src/services/assignTaskService.js`, `src/repositories/assignTaskRepository.js`, `src/middleware/errorHandler.js`, `src/middleware/validate.js`.
