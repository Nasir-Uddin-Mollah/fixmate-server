# FixMate API

The backend API for **FixMate**, a service marketplace that connects customers with technicians. It provides service discovery and management, booking workflows, user profiles and roles, and payment-history endpoints.

| | |
|---|---|
| **Live API** | [fixmate-server-xi.vercel.app](https://fixmate-server-xi.vercel.app) |
| **Web app** | [fixmate-rouge-seven.vercel.app](https://fixmate-rouge-seven.vercel.app) |

## Features

- Browse approved, available services with category, service-mode, text, sorting, and pagination filters.
- Submit and manage technician services, including administrator approval.
- Create customer bookings and track their status through the technician workflow.
- Update user profiles and manage user roles as an administrator.
- Retrieve customer and administrator payment histories.
- Verify bearer tokens against the JSON Web Key Set (JWKS) endpoint exposed by the configured frontend.

## Tech stack

- Node.js with ES modules
- Express 5
- MongoDB Node.js driver
- `jose` for JWT verification
- `dotenv` and CORS middleware

## Run locally

### Prerequisites

- Node.js and npm
- A MongoDB connection string with permission to access the database
- The frontend URL that serves the authentication JWKS endpoint

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Nasir-Uddin-Mollah/fixmate-server.git
   cd fixmate-server
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
   CLIENT_URL=https://your-frontend.example
   ```

   `CLIENT_URL` is used to fetch signing keys from `${CLIENT_URL}/api/auth/jwks`. For local development, set it to the local frontend origin that provides that endpoint. `PORT` is optional and defaults to `5000`.

3. Start the API:

   ```bash
   node index.js
   ```

The server listens on the configured port. The root route (`/`) returns a welcome message. The API uses the `fixmate` MongoDB database and the `user`, `services`, `bookings`, and `payments` collections.

## API

All API routes are prefixed with `/api`. Protected routes require a valid token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

The API reads the user's role from the verified token. Role-restricted endpoints return `401` for missing or invalid tokens and `403` when the user does not have the required role.

### Services

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/services` | Public | List approved, available services. Supports `category`, `serviceMode`, `q`, `sort`, `page`, and `limit` query parameters. |
| `GET` | `/api/services/:id` | Public | Get an approved, available service. |
| `POST` | `/api/services` | Technician | Submit a service for administrator approval. |
| `GET` | `/api/services/my` | Technician | List the signed-in technician's services. |
| `PATCH` | `/api/services/:id` | Technician | Update one of the technician's services. |
| `DELETE` | `/api/services/:id` | Technician | Delete one of the technician's services. |
| `GET` | `/api/services/admin/all` | Admin | List service submissions, with pending submissions first. |
| `PATCH` | `/api/services/:id/approval` | Admin | Approve or reject a service. Body: `{"approvalStatus":"approved"}` or `{"approvalStatus":"rejected"}`. |

Service-list sorting values are `price_asc`, `price_desc`, and `title`. The default order is newest first. The list response contains `services`, `total`, `page`, `limit`, and `totalPages`.

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Customer | Create a booking. Requires `serviceId` in the request body. |
| `GET` | `/api/bookings/my` | Customer | List the signed-in customer's bookings. |
| `PATCH` | `/api/bookings/:id/cancel` | Customer | Cancel a booking in `requested` or `accepted` status. |
| `GET` | `/api/bookings/technician` | Technician | List booking requests assigned to the signed-in technician. |
| `PATCH` | `/api/bookings/:id/status` | Technician | Advance a booking through its allowed status workflow. |
| `GET` | `/api/bookings/admin/all` | Admin | List all bookings. |

Technician status transitions are `requested` → `accepted` or `rejected`, `accepted` → `in-progress`, and `in-progress` → `completed`. Completing a booking requires a positive `finalAmount` in the request body, for example `{"status":"completed","finalAmount":125}`. Customers can cancel bookings that are `requested` or `accepted`.

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PATCH` | `/api/users/profile` | Authenticated user | Update profile fields: `name`, `phone`, `area`, `bio`, or `image`. |
| `GET` | `/api/users/admin/all` | Admin | List all users. |
| `PATCH` | `/api/users/:id/role` | Admin | Set a user's role to `customer`, `technician`, or `admin`. |

### Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/payments/my` | Customer | List the signed-in customer's payment records. |
| `GET` | `/api/payments/admin/all` | Admin | List all payment records. |

### Example requests

List the first page of available services:

```bash
curl "https://fixmate-server-xi.vercel.app/api/services?page=1&limit=12"
```

Update the current user's profile:

```bash
curl -X PATCH "https://fixmate-server-xi.vercel.app/api/users/profile" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Morgan","phone":"+1-555-0100"}'
```

## Deployment

The production API is hosted at [https://fixmate-server-xi.vercel.app](https://fixmate-server-xi.vercel.app). Configure `MONGODB_URI` and `CLIENT_URL` in the deployment environment; set `PORT` only if required by the hosting platform. Keep credentials and tokens in environment variables, not in source control.

## Development notes

- There is currently no automated test script configured in `package.json`.
- The API accepts JSON request bodies and has CORS middleware enabled.
- Keep the frontend and backend origins aligned with the authentication JWKS configuration.
