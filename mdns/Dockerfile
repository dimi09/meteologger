# ------------------------------------------------------------------
# MeteoLogger — mDNS (Avahi) announcer
#
# Ανακοινώνει στο LAN το όνομα <hostname-του-server>.local, ώστε οι
# clients να βρίσκουν τον server χωρίς IP και χωρίς αρχείο hosts.
# Τρέχει με network_mode: host (βλ. compose.yaml).
# ------------------------------------------------------------------
FROM alpine:3.20
RUN apk add --no-cache avahi
COPY avahi-daemon.conf /etc/avahi/avahi-daemon.conf
COPY services/ /etc/avahi/services/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
