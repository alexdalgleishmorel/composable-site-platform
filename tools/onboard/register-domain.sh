#!/usr/bin/env bash
set -euo pipefail

# Register a client domain via Route 53 Domains, with the CLIENT as registrant (ownership story, §9).
# Route 53 Domains auto-creates the hosted zone and points the domain's nameservers at it, so no manual
# nameserver step is needed afterward. The Route 53 Domains API lives only in us-east-1.
#
# Usage: ./register-domain.sh <domain> <contact.json> [years]
#   <contact.json> — a ContactDetail for the client (see contact-template.json). Used for the
#                    registrant, admin, and tech contacts.
#
# This is a real purchase (~$12-14/yr for .org) and is asynchronous — it returns an OperationId.

DOMAIN="${1:?usage: register-domain.sh <domain> <contact.json> [years]}"
CONTACT="${2:?path to a filled ContactDetail json (see contact-template.json)}"
YEARS="${3:-1}"

echo "Checking availability of ${DOMAIN}…"
aws route53domains check-domain-availability --region us-east-1 --domain-name "$DOMAIN"

read -r -p "Register ${DOMAIN} for ${YEARS}y with the client as registrant? [y/N] " ok
[ "$ok" = "y" ] || { echo "aborted"; exit 1; }

aws route53domains register-domain \
  --region us-east-1 \
  --domain-name "$DOMAIN" \
  --duration-in-years "$YEARS" \
  --auto-renew \
  --privacy-protect-admin-contact \
  --privacy-protect-registrant-contact \
  --privacy-protect-tech-contact \
  --registrant-contact "file://${CONTACT}" \
  --admin-contact "file://${CONTACT}" \
  --tech-contact "file://${CONTACT}"

echo
echo "Submitted. Registration is async (a few minutes). Track it with:"
echo "  aws route53domains list-operations --region us-east-1"
echo "Once SUCCESSFUL, the hosted zone exists and you can run the onboard-client workflow."
