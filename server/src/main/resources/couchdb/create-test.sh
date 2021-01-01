curl -X PUT -u $AUTH http://localhost:5984/$INST-test
curl -X PUT -u $AUTH http://localhost:5984/$INST-test/_design/test -d @design-test.json
