REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-course/_design/course | jq ._rev | tr -d \"`
echo $REV
curl -X DELETE -u $AUTH http://localhost:5984/$INST-course/_design/course?rev=$REV
curl -X PUT    -u $AUTH http://localhost:5984/$INST-course/_design/course -d @design-course.json
