REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-test/_design/test | jq ._rev | tr -d \"`
echo $REV
curl -X DELETE -u $AUTH http://localhost:5984/$INST-test/_design/test?rev=$REV
curl -X PUT    -u $AUTH http://localhost:5984/$INST-test/_design/test -d @design-test.json
