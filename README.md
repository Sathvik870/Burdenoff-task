# Burdenoff-task

A modern GraphQL document management backend for organizing notes, research, and content into reusable collections. Built with Bun, TypeScript, GraphQL Yoga, Prisma, and PostgreSQL, this project gives you a clean API for creating collections, storing documents, searching content, and managing document lifecycle states.

---

## 1. Project Overview

Burdenoff-task is a lightweight document vault application designed to help users group related content into collections and manage documents with metadata, tags, search, and archiving.

The application is built around a single GraphQL API that exposes:

- collection management
- document creation and updates
- document listing and filtering
- cursor-based pagination
- archive-based soft lifecycle control
- validation and structured error messages

This project is well-suited for:

- personal knowledge bases
- documentation repositories
- tagged note systems
- lightweight content libraries
- internal document management APIs

The core domain models are:

- Collection: a logical container for documents
- Document: a content item with title, content, tags, and archival status

---

## 2. Tech Stack

| Layer        | Technology                   | Purpose                                               |
| ------------ | ---------------------------- | ----------------------------------------------------- |
| Runtime      | Bun                          | Fast JavaScript/TypeScript runtime and task runner    |
| Language     | TypeScript                   | Type-safe server logic and GraphQL development        |
| API          | GraphQL Yoga                 | GraphQL server implementation                         |
| Schema       | GraphQL SDL                  | Strongly typed API contract for queries and mutations |
| Database ORM | Prisma                       | Schema management, migrations, typed database access  |
| Database     | PostgreSQL                   | Primary relational data store                         |
| Driver       | Prisma Postgres Adapter + pg | Database connection layer                             |
| Env Config   | dotenv                       | Environment-based configuration                       |
| Testing      | Bun test                     | Unit and integration testing                          |
| Linting      | ESLint                       | Code quality checks                                   |

### Core dependencies

- `graphql` and `graphql-yoga` for API execution
- `@prisma/client` and `prisma` for database access and schema tooling
- `@prisma/adapter-pg` for PostgreSQL connectivity
- `dotenv` for `.env` support

---

## 3. Architecture

The project follows a clean layered architecture:

1. GraphQL layer

   - `src/server.ts` creates the Yoga server and attaches the GraphQL schema.
   - `src/schema/schema.graphql` defines the API contract.
   - `src/schema/resolvers.ts` wires resolvers to service methods.
2. Service layer

   - `src/services/collection.service.ts` handles collection CRUD and validation.
   - `src/services/document.service.ts` handles document creation, update, deletion, filtering, and pagination.
3. Data access layer

   - `src/lib/prisma.ts` initializes the Prisma client with the PostgreSQL connection string.
   - Prisma talks to PostgreSQL using the schema defined in `prisma/schema.prisma`.
4. Validation and error handling

   - `src/lib/validation.ts` contains reusable input validation helpers.
   - `src/errors/app-error.ts` defines typed GraphQL errors such as `VALIDATION_ERROR`, `NOT_FOUND`, and `DATABASE_ERROR`.

### High-level flow

```text
Client Request
   ↓
GraphQL Yoga Server
   ↓
Resolver
   ↓
Service Layer
   ↓
Prisma Client
   ↓
PostgreSQL Database
```

### Domain model

```text
Collection
- id
- name
- slug
- createdAt
- documents[]

Document
- id
- title
- content
- tags[]
- collectionId
- isArchived
- createdAt
```

---

## 4. Features / API Operations

### Collection features

- create a collection with a user-friendly name and slug
- enforce unique slugs
- fetch all collections
- fetch a single collection by ID
- automatically resolve related documents for each collection

### Document features

- create a new document under a collection
- update document title, content, tags, and archive state
- delete a document
- move a document between collections
- filter documents by collection, text search, and archive status
- paginate results with `take` and `cursor`
- search by document title or content using case-insensitive matching

### Operational rules

- empty title/content is rejected
- slug validation only accepts lowercase letters, numbers, and hyphens
- duplicate collection slugs are rejected with a conflict error
- missing resources return `NOT_FOUND`
- database or unexpected failures are wrapped in `DATABASE_ERROR` and `INTERNAL_ERROR`

---

## 5. Project Structure

```text
burdenoff-task/
├── .env
├── .gitignore
├── README.md
├── docker-compose.yml
├── eslint.config.js
├── index.ts
├── package.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── prisma.config.ts
├── src/
│   ├── errors/
│   │   └── app-error.ts
│   ├── lib/
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   └── validation.ts
│   ├── schema/
│   │   ├── resolvers.ts
│   │   └── schema.graphql
│   ├── services/
│   │   ├── collection.service.ts
│   │   └── document.service.ts
│   ├── server.ts
│   └── types/
│       └── result.ts
├── tests/
│   ├── db.test.ts
│   ├── integration.test.ts
│   └── resolvers.test.ts
├── generated/
│   └── prisma/
└── bun.lock
```

---

## 6. Prerequisites

Before running the project, make sure you have:

- Node.js 18+ or a compatible runtime
- Bun installed (`curl -fsSL https://bun.sh/install | bash` if needed)
- Docker Desktop or Docker Engine installed
- PostgreSQL support via Docker Compose
- Basic understanding of GraphQL queries and mutations

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Then restart your shell or add Bun to your PATH if needed.

---

## 7. Environment Variables

Create or update a `.env` file at the project root with the following configuration:

```env
DATABASE_URL="postgresql://document_vault:Vault#123@localhost:5432/document_vault?schema=public"
```

### Variables explained

| Variable         | Required | Description                                 |
| ---------------- | -------- | ------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string used by Prisma |

### Docker Compose database values

The included Docker setup creates the following database and credentials:

- username: `document_vault`
- password: `Vault#123`
- database: `document_vault`
- port: `5432`

> The project expects PostgreSQL to be running locally on port 5432 before the app starts.

---

## 8. One-Command Setup

The following setup works for a local development environment:

```bash
docker compose up -d && bun install && bunx prisma generate && bunx prisma migrate dev --name init && bun run dev
```

### What this does

- starts PostgreSQL in Docker
- installs dependencies
- generates Prisma client
- applies the database schema
- launches the GraphQL server in watch mode

If you prefer a split setup, you can run the commands separately.

---

## 9. Database & Migrations

The project uses Prisma with a PostgreSQL datasource.

### Schema

Main schema is defined in:

- `prisma/schema.prisma`

It contains:

- `Collection` model
- `Document` model
- a one-to-many relationship between collections and documents
- unique slug constraint on `Collection.slug`
- indexes on `Document.collectionId` and `Document.isArchived`

### Migration workflow

```bash
bunx prisma migrate dev --name init
bunx prisma migrate deploy
bunx prisma generate
```

### Common database operations

```bash
bunx prisma studio
bunx prisma db push
bunx prisma format
```

### Current migration summary

The project already includes an initial migration for the `Collection` and `Document` tables.

---

## 10. Running the Application

Start the GraphQL server:

```bash
bun run dev
```

Then open:

```text
http://localhost:4000/graphql
```

### Server behavior

The app starts a GraphQL Yoga server using `src/server.ts`, and the server listens on port `4000`.

Example startup log:

```text
GraphQL server running at http://localhost:4000/graphql
```

---

## 11. GraphQL API Examples

### Fetch all collections

```graphql
query {
  collections {
    id
    name
    slug
    createdAt
  }
}
```

### Fetch a specific collection by ID

```graphql
query GetCollection($id: ID!) {
  collection(id: $id) {
    id
    name
    slug
    documents {
      id
      title
      tags
    }
  }
}
```

### Fetch documents with filters and pagination

```graphql
query GetDocuments($collectionId: ID, $search: String, $isArchived: Boolean, $take: Int, $cursor: String) {
  documents(
    collectionId: $collectionId
    search: $search
    isArchived: $isArchived
    take: $take
    cursor: $cursor
  ) {
    items {
      id
      title
      content
      tags
      collectionId
      isArchived
      createdAt
    }
    nextCursor
  }
}
```

### Create a collection

```graphql
mutation {
  createCollection(name: "Research Notes", slug: "research-notes") {
    id
    name
    slug
    createdAt
  }
}
```

### Create a document

```graphql
mutation {
  createDocument(
    title: "Quarterly planning"
    content: "Outline goals, budget, and roadmap for the next quarter."
    tags: ["planning", "finance", "ops"]
    collectionId: "<collection-id>"
  ) {
    id
    title
    content
    tags
    collectionId
  }
}
```

### Update a document

```graphql
mutation {
  updateDocument(
    id: "<document-id>"
    title: "Quarterly planning updated"
    content: "Revised product objectives and timeline."
    tags: ["planning", "product"]
    isArchived: false
  ) {
    id
    title
    content
    tags
    isArchived
  }
}
```

### Move a document to another collection

```graphql
mutation {
  moveDocument(id: "<document-id>", collectionId: "<new-collection-id>") {
    id
    collectionId
    title
  }
}
```

### Delete a document

```graphql
mutation {
  deleteDocument(id: "<document-id>")
}
```

---

## 12. Testing

This project uses Bun's built-in test runner.

### Run all tests

```bash
bun test
```

### Test coverage areas

- GraphQL integration tests
- resolver-level behavior checks
- database interaction expectations
- pagination and search validation

Existing test files:

- `tests/integration.test.ts`
- `tests/resolvers.test.ts`
- `tests/db.test.ts`

### Type checking

```bash
bun run typecheck
```

---

## 13. Error Handling & Validation

The backend uses a typed `AppError` system to return structured GraphQL errors with consistent codes and HTTP-like status metadata.

### Supported error codes

| Error Code             | Meaning                             |
| ---------------------- | ----------------------------------- |
| `VALIDATION_ERROR`   | Invalid or empty user input         |
| `DUPLICATE_RESOURCE` | Unique resource constraint violated |
| `NOT_FOUND`          | Requested record does not exist     |
| `DATABASE_ERROR`     | Prisma or DB operation failed       |
| `INTERNAL_ERROR`     | Unexpected server error             |

### Validation rules

- document title cannot be empty
- document content cannot be empty
- collection name cannot be empty
- collection slug must match: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- update operations require at least one field to change
- move operation prevents moving a document to the same collection

### Example error payload

```json
{
  "errors": [
    {
      "message": "Document not found",
      "extensions": {
        "code": "NOT_FOUND",
        "httpStatus": 404
      }
    }
  ]
}
```

---

## 14. Design Decisions / Tradeoffs

### Why GraphQL?

GraphQL gives the app a single flexible API surface for structured data retrieval and mutation. It works especially well when a client needs different combinations of collection and document fields without building multiple REST endpoints.

### Why Prisma?

Prisma minimizes repetitive database logic, improves type safety, and keeps schema management straightforward with migrations. It also centralizes query validation and database access patterns.

### Why cursor pagination?

The `documents` query uses cursor-based pagination to make large datasets easier to consume without handling offset pitfalls in a growing dataset.

### Why archive instead of delete for documents?

The `isArchived` flag gives a safer lifecycle model for records that may need to be preserved for auditing, recovery, or future reference while being excluded from active views.

### Why custom validation layers?

The project keeps validation close to services so business rules stay explicit and consistent before writes hit Prisma.

### Tradeoff

This project prioritizes simplicity and clarity over highly advanced enterprise features such as auth, RBAC, caching, search indexing, or multi-tenant isolation.

---

## 15. Possible Extensions

Here are strong next-step enhancements for this backend:

- Authentication and authorization

  - JWT-based auth
  - user ownership for collections and documents
  - role-based access control
- Search enhancements

  - full-text search with PostgreSQL indexing
  - semantic search support
  - tag analytics and suggestions
- Collaboration features

  - shared collections
  - comments and activity history
  - document versioning
- File and media support

  - attachments, images, or PDFs
  - preview generation and signed URLs
- Operational improvements

  - Redis caching for hot collections
  - background jobs for indexing
  - metrics and observability
- Developer experience improvements

  - GraphQL codegen for typed client generation
  - Apollo or GraphQL Inspector integration
  - richer integration test suites with seeded fixtures

---

This project is ready as a foundation for a document vault backend and can be extended into a larger content platform with auth, user management, and richer search capabilities.
