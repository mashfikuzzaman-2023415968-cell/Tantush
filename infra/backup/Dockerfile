FROM postgres:16-alpine
RUN apk add --no-cache openssl
COPY backup-loop.sh /usr/local/bin/backup-loop.sh
RUN chmod 555 /usr/local/bin/backup-loop.sh
USER postgres
ENTRYPOINT ["/bin/sh", "/usr/local/bin/backup-loop.sh"]
