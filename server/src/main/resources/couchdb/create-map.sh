curl -X PUT -u $AUTH http://localhost:5984/$INST-map
curl -X PUT -u $AUTH http://localhost:5984/$INST-map/_design/net -d @design-map.json
