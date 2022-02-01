REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-feedback/_design/feedback | jq ._rev | tr -d \"`
echo $REV
curl -X DELETE -u $AUTH http://localhost:5984/$INST-feedback/_design/feedback?rev=$REV
curl -X PUT    -u $AUTH http://localhost:5984/$INST-feedback/_design/feedback -d @design-feedback.json
