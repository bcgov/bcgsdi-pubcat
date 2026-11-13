# Approach #1 - Connect with a personal user account

Note this approach doesn't work for privileged users like "postgres". See approach #2
to connect with the "postgres" user.

## Determine host name and port of the database cluster

The host IP address and port of the database are assigned when the database cluster is deployed.  
These values can be found by running the following OpenShift command

```
oc get -n [NAMESPACE] ts
```

## Connect to the database cluster from the psql command line

Using host IP and port from the above, run the following:

```
psql "postgresql://[USERNAME]@zzz.zzz.zzz.zzz:port/pubcat"
```

# Approach #2 - Connect as the "postgres" user

- Login to the Openshift web console
- Select the production namespace
- On the Administrator view, select Workloads > Pods
- There will be a 2-3 pods with names like this: bcgsdi-pubcat-crunchy-postgres-ha-????-0
  - Click them one at a time and look at the "labels" assigned. Find the pod with
    the label called "postgres-operator.crunchydata.com/role=master".  
    This is the pod running the master postgres.
  - Select the "Terminal" tab from the master pod.
  - Use this command to connect to the database:
    psql -U postgres pubcat
