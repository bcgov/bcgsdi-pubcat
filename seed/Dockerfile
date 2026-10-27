FROM alpine:3.22

# Install the PostgreSQL client (psql)
RUN apk add --no-cache postgresql-client

# Copy the development seed data
COPY sample-data.sql /seed/sample-data.sql

# Run as a non-root user
USER 1001

CMD ["psql", "--version"]