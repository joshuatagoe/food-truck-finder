SF Mobile Food Facilities
=========================

Description of the Problem and Solution
---------------------------------------

The task was to build an application around the San Francisco **Mobile Food Facility Permit** dataset with these requirements:

As a **frontend-leaning engineer**, my task was to:

*   Build a UI using frontend framework like React, where users can:
    
    *   Search by applicant name (with optional Status filter)
        
    *   Search by street name (support partial matches)
        

**Backend-focused features (bonus):**

*   API that supports applicant search, street search, and nearest-5 queries by latitude/longitude (default Status = APPROVED, overrideable)
    
*   API documentation tool (Swagger)
    
*   Implemented automated tests
    
*   Docker setup
    

**My solution delivers both backend and frontend versions:**

*   **Backend (Node.js + Express + TypeScript + SQLite)**
    
    *   One unified search endpoint with query parameters for applicant, street, status, limit, and lat/lng.
        
    *   If lat/lng are provided, results include distance\_mi, sorted nearest-first, default limit = 5.
        
    *   Status defaults to APPROVED unless another value (or empty string) is explicitly provided.
        
    *   Implemented Swagger docs at /api/search/docs.
        
    *   Dockerfile and docker-compose setup for reproducible runs.
        
    *   Tests written with Jest.
        
*   **Frontend (React + Vite)**
    
    *   Autocomplete search inputs for **applicant** and **street**, triggering after 3 characters.
        
    *   **Status filter**, **“Near me” toggle**, and **limit slider (1–50)**.
        
    *   **Debounced requests** to reduce server load.
        
    *   **LocalStorage caching** with TTL to reuse recent queries.
        
    *   Results presented in a scrollable list.
        
    *   Clicking a result opens a **modal** with all database fields in a table grid, plus a Google Maps preview and copy-to-clipboard for addresses.
        
    *   Tests written with Vitest.
        

Reasoning Behind Technical / Architectural Decisions
----------------------------------------------------

*   **SQLite (better-sqlite3)**:Chosen for simplicity, ease of setup, and synchronous queries that are very fast for small-to-medium read-heavy workloads. No need for extra infrastructure in this coding challenge.
    
*   **Unified Endpoint Design**:Instead of separate endpoints for applicant, street, and nearby, I implemented a single endpoint with flexible filters. This simplified the API and frontend integration.
    
*   **Haversine Formula in Code**:I compute all candidate rows that match filters, then calculate Haversine distance in the backend, sort, and slice. This was easy to implement and works for the dataset size.
    
*   **Partial Search for Applicant and Street**:Extended partial search beyond the prompt (which only required street partials) because it makes sense for autocomplete in the UI.
    
*   **Frontend UX Choices**:
    
    *   Autocomplete + debounce ensures responsive search without hammering the backend.
        
    *   Caching results in localStorage improves perceived speed and reduces duplicate API hits.
        
    *   Modal view provides all row details in a digestible format with Google Maps integration.
        
    *   A loading spinner improves feedback during network requests.
        

Critique
--------

### What I would have done differently with more time

*   **Backend**
    
    *   Use **PostgreSQL with PostGIS** for true geospatial queries (ST\_DWithin with geo indexes).
        
    *   Add **indexes** for applicant, street, and status.
        
    *   Avoid fetching all matches and sorting in memory — instead push geospatial filtering into the DB.
        
    *   Explore fuzzy search (ElasticSearch) for more robust matching.
        
*   **Frontend**
    
    *   Improve UI aesthetics and styling.
        
    *   Implement **infinite scrolling** (with react-window) or add **pagination** for easier data analysis.
        
    *   Add options to query from a specific location or paginate through data windows.
        

### Trade-offs made

*   **SQLite over Postgres**: fast to bootstrap but not scalable for large concurrent traffic or geospatial needs.
    
*   **Haversine in code**: simple, but wastes resources by loading all matching rows instead of using DB-level geo indexing.
    
*   **One endpoint**: easy for the client, but requires more careful validation of query params.
    

### Things left out (relative to the prompt)

- **Core requirements:** None.  
  - Applicant search (+ Status filter) ✅  
  - Street search with partial matches ✅  
  - Nearest 5 by latitude/longitude with default `APPROVED` (overrideable) ✅  
  - Automated tests (backend: Jest, frontend: Vitest) ✅

- **Bonus items:** All covered.  
  - API documentation (Swagger) ✅  
  - Dockerfile / docker-compose ✅  
  - Frontend UI ✅

### Things I didn't think about

- Security: input validation, sanitization, rate limiting  
- Error handling: consistent error responses  
- Data freshness: updating the dataset automatically

### Problems with this implementation and scaling solutions

- **Scaling reads**: SQLite can’t handle high concurrency; it only works well for small, single-process workloads.  
  *Solution*: migrate to Postgres with read replicas for higher throughput.

- **Scaling nearest queries**: Right now I compute distances in code for every row, which doesn’t scale to millions of entries.  
  *Solution*: move to PostGIS or another database with spatial indexes to handle nearest-neighbor queries efficiently.

- **Search & indexing**: Filtering on applicant, status, and street is fine at this dataset size, but with growth the lack of proper indexes would cause slow full-table scans.  
  *Solution*: add indexes on those fields; at larger scale or for fuzzy matching, use something like Elasticsearch. For geospatial filters, use PostGIS indexes.

- **Caching**: Every request currently hits the database; there’s no caching layer.  
  *Solution*: introduce Redis or memcached to reduce duplicate queries.

- **Observability**: There’s no monitoring, metrics, or tracing, so I’d have no visibility into failures or performance regressions.  
  *Solution*: add structured logs, metrics, and tracing.

- **Pagination**: Right now responses can grow large and I rely on limit/offset. This wastes resources and doesn’t scale well.  
  *Solution*: use cursor-based pagination to make queries stable and efficient under load.

- **Rate limiting & backpressure**: The API doesn’t enforce any limits, so a flood of requests could overwhelm it.  
  *Solution*: add per-IP/app rate limits, timeouts, and retries with jitter.

- **Frontend caching**: The current localStorage cache is very denormalized — it just saves whole query results by key. This makes it harder to reuse shared data across queries and can grow messy.  
  *Solution*: introduce HTTP-level caching (ETag/Last-Modified) and/or a normalized client-side cache (e.g., React Query, Apollo-style store) to reuse data more effectively.

- **UX/design quality**: The frontend works, but scaling my design skills to millions of users would be a disaster.  
*Solution*: get a UX expert so the app doesn’t look like it was built for an audience of one (me).

    
Steps to Run the Solution and Tests
-----------------------------------

### With Docker (recommended)

From the project root:

```bash   
docker compose build  
docker compose up
```

*   **Frontend**: [http://localhost:8080](http://localhost:8080)
    
*   **Backend**: [http://localhost:3000/api/search](http://localhost:3000/api/search)
    
*   **API Docs**: [http://localhost:3000/api/search/docs/](http://localhost:3000/api/search/docs/)
    

### Without Docker

#### Backend

```bash  
cd backend  
npm install  
npm run test       # to run tests  
npm run dev        # starts on http://localhost:3000   
```

#### Frontend

```bash  
cd frontend  
npm install  
npm run test       # to run tests  
npm run dev        # starts on http://localhost:5173  
 ```

Tests
-----

*   **Backend**:
    
    *   Framework: **Jest**
        
    ```bash 
    cd backend
    npm run test 
    ```
        
*   **Frontend**:
    
    *   Framework: **Vitest**
        
    ```bash 
      cd frontend
      npm run test
      ```