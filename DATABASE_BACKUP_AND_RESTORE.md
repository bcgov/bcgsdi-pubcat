# Backups

Scheduled backups occur as defined in common/crunchy-values.prod.yml.

Thirty days of backups are saved to S3. One day of backups is saved to PVC.  
Because we keep a a longer backup archive on S3, that is usually the best
source to restore from.

## Helpful commands

List PVC backup history

```
oc exec -n dd8ff1-prod \
  pg-bcgsdi-pubcat-prod-crunchy-repo-host-0 \
  -c pgbackrest -- \
  pgbackrest --stanza=db --repo=1 info
```

List S3 backup history

```
oc exec -n dd8ff1-prod \
  pg-bcgsdi-pubcat-prod-crunchy-repo-host-0 \
  -c pgbackrest -- \
  pgbackrest --stanza=db --repo=2 info
```

# Restore - Point in time recovery:

The steps below will restore into an existing crunchy cluster. It will
replace the contents of the existing database (if any) with the contents
from the restore target.

1. Edit the file common/crunchy-values.prod.yml. Update the restore section as follows:

```
restore:
  repoName: repo2 #repo1 to restore from pvc. repo2 to restore from s3
  enabled: true
  target: [TARGET_TIME_HERE] # e.g. 2024-03-24 17:16:00-07 this is the target timestamp to go back to in current cluster
```

2. Redeploy the changed file to production using the repository's CI/CD process.

Wait for the deployment to complete

Check whether helm applied the proper restore configuration:

```
oc get postgrescluster pg-bcgsdi-pubcat-prod-crunchy \
  -n dd8ff1-prod \
  -o jsonpath='{.spec.backups.pgbackrest.restore}{"\n"}'
```

The JSON output should show the correct contents of the restore section from common/crunchy-values.prod.yml

3. Add a restore annotation

```
oc annotate postgrescluster pg-bcgsdi-pubcat-prod-crunchy \
  -n dd8ff1-prod \
  --overwrite \
  postgres-operator.crunchydata.com/pgbackrest-restore="$(date)"
```

Expect a "restore" job to begin shortly (within a minute or so). To check if it has been created run this command:

```
oc get postgrescluster pg-bcgsdi-pubcat-prod-crunchy \
  -n dd8ff1-prod \
  -o jsonpath='{.metadata.annotations.postgres-operator\.crunchydata\.com/pgbackrest-restore}{"\n"}'
```

Or actively monitor pod changes to watch for a pod associated with the restore:

```
oc get pods -n dd8ff1-prod -w
```

4. Connect to the database and verify the restore was successful

```
port-forward pg-bcgsdi-pubcat-prod-crunchy-db-8sd9-0 15433:5432 -n dd8ff1-prod
```

```
psql -p 15433 -U pubcat pubcat
```

Run some queries against the database to verify the contents are as expected.

5. Undo the changes to common/crunchy-values.prod.yml

Disable the restore

```
restore:
  repoName: repo2 #repo1 to restore from pvc. repo2 to restore from s3
  enabled: false
  target: ~ # e.g. 2024-03-24 17:16:00-07 this is the target timestamp to go back to in current cluster
```

6. Redeploy the changed file to production using the repository's CI/CD process.

Wait for the deployment to complete

Check whether helm applied the proper restore configuration:

```
oc get postgrescluster pg-bcgsdi-pubcat-prod-crunchy \
  -n dd8ff1-prod \
  -o jsonpath='{.spec.backups.pgbackrest.restore}{"\n"}'
```

The JSON output should show the correct contents of the restore section from common/crunchy-values.prod.yml
