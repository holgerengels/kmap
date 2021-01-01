curl -X PUT -u $AUTH http://localhost:5984/$INST-course
curl -X PUT -u $AUTH http://localhost:5984/$INST-course/_design/course -d @design-course.json
