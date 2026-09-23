#!/bin/sh
set -e
CONF=/etc/avahi/avahi-daemon.conf

# Προαιρετικό σταθερό όνομα (αλλιώς το hostname του server)
if [ -n "$MDNS_HOSTNAME" ]; then
  sed -i "/^\[server\]/a host-name=${MDNS_HOSTNAME}" "$CONF"
  NAME="$MDNS_HOSTNAME"
else
  NAME="$(hostname)"
fi

echo "[mdns] Ανακοίνωση στο LAN ως: http://${NAME}.local"
echo "[mdns] (αν υπάρχει σύγκρουση ονόματος, το Avahi θα προσθέσει -2, βλ. logs)"

rm -f /run/avahi-daemon/pid
mkdir -p /run/avahi-daemon
exec avahi-daemon --no-chroot --no-rlimits
