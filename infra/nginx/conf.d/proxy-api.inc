proxy_pass http://medusa_api;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header Connection "";
# Only retry idempotent requests on another replica
proxy_next_upstream error timeout http_502 http_503;
proxy_next_upstream_tries 2;
proxy_connect_timeout 5s;
proxy_read_timeout 120s;
# Personal / account data must never be stored by browsers or shared caches,
# including error responses generated before the app's own headers apply.
proxy_hide_header X-Powered-By;
proxy_hide_header X-Frame-Options;
proxy_hide_header X-Content-Type-Options;
