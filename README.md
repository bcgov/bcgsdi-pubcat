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

Test at http://localhost:3000/api

Frontend:

```
podman compose build --no-cache frontend
podman compose up -d frontend
```

Test at http://localhost:3001/
