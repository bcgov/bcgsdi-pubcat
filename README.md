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

## Dev sandboxes

When pull requests are opened, the application code of that pull request
will be deployed to a developer sandbox environment in OpenShift. When that
PR is closed, the sandbox will be torn down.

A crunchy postgres cluster is shared between all dev sandboxes. Each sandbox has
its own database in the chsared cluster.

### Connect to the database of a dev sandbox

1. Open a command line with access to the 'oc' tool

2. Copy the OpenShift cli (oc) login command from openshift, and paste it into
   a command line

3. Setup a port forward from the OpenShift service to your local computer:

```
oc port-forward svc/pg-bcgsdi-pubcat-dev-crunchy-pgbouncer 15432:5432 -n dd8ff1-dev
```
