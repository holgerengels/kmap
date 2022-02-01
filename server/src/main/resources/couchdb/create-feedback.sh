curl -X PUT -u $AUTH http://localhost:5984/$INST-feedback
curl -X PUT -u $AUTH http://localhost:5984/$INST-feedback/_design/feedback -d @design-feedback.json
