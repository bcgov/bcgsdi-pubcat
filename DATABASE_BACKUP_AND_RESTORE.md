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

5. Verify that the entire database cluster is healthy

Refer to the section below titled "Check if the database cluster is healthy". Run the
commands listed in that section.

6. Undo the changes to common/crunchy-values.prod.yml

Disable the restore

```
restore:
  repoName: repo2 #repo1 to restore from pvc. repo2 to restore from s3
  enabled: false
  target: ~ # e.g. 2024-03-24 17:16:00-07 this is the target timestamp to go back to in current cluster
```

7. Redeploy the changed file to production using the repository's CI/CD process.

Wait for the deployment to complete

Check whether helm applied the proper restore configuration:

```
oc get postgrescluster pg-bcgsdi-pubcat-prod-crunchy \
  -n dd8ff1-prod \
  -o jsonpath='{.spec.backups.pgbackrest.restore}{"\n"}'
```

The JSON output should show be empty because restore is disabled. If not empty the restore state is still active, and the cluster
may revert to the given target at some time in the future.

# Other helpful database maintenance commands

## Reinitialize a replica from the master

```
oc exec -it -n dd8ff1-prod \
  [POD_NAME_OF_MASTER] \
  -c database -- \
  patronictl reinit \
    --from-leader \
    --wait \
    [PETRONI_CLUSTER_NAME] \
    [POD_NAME_OF_REPLICA_TO_REBUILD]
```

where [PATRONI_CLUSTER_NAME] = "pg-bcgsdi-pubcat-prod-crunchy-ha"

## Check if the database cluster is healthy

List all pods and some basic information about them

```
oc get pods -n dd8ff1-prod -o wide
```

Because our crunchy cluster is configured to run 2 replicas (i.e. one master and one copy),
expect to see two database pods with names like: "pg-bcgsdi-pubcat-prod-crunchy-db-[ABCD]-0".  
Each should show 5/5 for the READY state.

Also check the Pod Disruption Budget:

```
oc get pdb pg-bcgsdi-pubcat-prod-crunchy-set-db \
  -n dd8ff1-prod
```

Look for something like this to indicate that one (of the two) replicas may be disrupted
without harming the cluster.

```
NAME                                   MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
pg-bcgsdi-pubcat-prod-crunchy-set-db   1               N/A               1                     5d
```

Connect directly to the master database and check that it is configured to stream
changes to the one replica:

```
oc exec -n dd8ff1-prod \
  pg-bcgsdi-pubcat-prod-crunchy-db-ABCD-0 \
  -c database -- \
  psql -U postgres -d postgres -c "
    SELECT
      application_name,
      state,
      sync_state,
      sent_lsn,
      write_lsn,
      flush_lsn,
      replay_lsn
    FROM pg_stat_replication;
  "
```

Expect to see output similar to this:

```
            application_name             |   state   |  sent_lsn  | write_lsn  | flush_lsn  | replay_lsn | sync_state |          reply_time
-----------------------------------------+-----------+------------+------------+------------+------------+------------+-------------------------------
 pg-bcgsdi-pubcat-prod-crunchy-db-ABCD-0 | streaming | 0/68000060 | 0/68000060 | 0/68000060 | 0/68000060 | async      | 2026-11-09 18:47:41.053989+00
```

This means:

- "sent_lsn" shows the write ahead log (WAL) position that was sent from the master to the replica.
- "write_lsn" shows the WAL position written by the replica
- "flush_lsn" shows the WAL position persited to the replica's storage
- "replay_lsn" shows the WAL position applied to the relica's database
- "state" show say streaming for a healthy cluster

"write_lsn", "flush_lsn", and "replay_lsn" represent three steps to applying a master's WAL to a replica. If they are all equal to "sent_lsn" that means
the relication was successful. If not all the same, it means the replica database is not currently in sync.

Also run the following to show the petroni cluster status:

```
oc exec -n dd8ff1-prod \
  pg-bcgsdi-pubcat-prod-crunchy-db-ABCD-0 \
  -c database -- \
  patronictl -c /etc/patroni list

```

The output will be similar to

```
+ Cluster: pg-bcgsdi-pubcat-prod-crunchy-ha (7704374305010942016) -----------------------------------------------------+---------+-----------+----+-------------+-----+------------+-----+
| Member                                  | Host                                                                       | Role    | State     | TL | Receive LSN | Lag | Replay LSN | Lag |
+-----------------------------------------+----------------------------------------------------------------------------+---------+-----------+----+-------------+-----+------------+-----+
| pg-bcgsdi-pubcat-prod-crunchy-db-ABCD-0 | pg-bcgsdi-pubcat-prod-crunchy-db-ABCD-0.pg-bcgsdi-pubcat-prod-crunchy-pods | Leader  | running   |  3 |             |     |            |     |
| pg-bcgsdi-pubcat-prod-crunchy-db-WXYZ-0 | pg-bcgsdi-pubcat-prod-crunchy-db-WXYZ-0.pg-bcgsdi-pubcat-prod-crunchy-pods | Replica | streaming |  3 |  0/68000060 |   0 | 0/68000060 |   0 |
+-----------------------------------------+----------------------------------------------------------------------------+---------+-----------+----+-------------+-----+------------+-----+
```

Expect the Receive LSN and Replay LSN to match the values from the previous command.
