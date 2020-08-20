REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-course/_design/net | jq ._rev | tr -d \"`
echo $REV
curl -X DELETE -u $AUTH http://localhost:5984/$INST-course/_design/net?rev=$REV
curl -X PUT    -u $AUTH http://localhost:5984/$INST-course/_design/net -d @design-course.json
