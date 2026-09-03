curl -X PUT -u $AUTH http://localhost:5984/$INST-auth
curl -s -X PUT http://admin:secret@localhost:5984/root-auth/user:admin \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "user:admin",
    "type": "user",
    "userid": "admin",
    "email": "admin@kmap.eu",
    "passwordHash": "$2b$10$MZpNeZoef1A5PCjS9c1VJOZpjGoMTfDEMV6z5BWTzWIvkw3FHoUU2",
    "displayName": "Administrator",
    "createdAt": "2026-09-03T07:00:00Z"
  }' | jq '.'