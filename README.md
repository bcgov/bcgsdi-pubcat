# Publication Catalogue (PubCat)

## Run the application in a local development environment

Start the database
`podman compose up -d migrations`

Start the backend

```
cd backend
npm run dev
```

Start the frontend

```
cd ..\frontend
npm run dev
```

## Test the containerization

Backend:

```
podman compose build --no-cache backend
podman compose up -d backend
```

Note: This will also spin up the database on localhost:5432.

Access the containerized backend at http://localhost:3001/api

Frontend:

```
podman compose build --no-cache frontend
podman compose up -d frontend
```

Note: This will also spin up the backend on localhost:3001 and the
database on localhost:5432.

Access the containerized frontend at http://localhost:3000/
