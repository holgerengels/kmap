#!/bin/bash

curl -X GET -u $1 http://localhost:5984/$2-map/_all_docs\?include_docs\=true\&attachments\=true > map.json
curl -X GET -u $1 http://localhost:5984/$2-test/_all_docs\?include_docs\=true\&attachments\=true > test.json
curl -X GET -u $1 http://localhost:5984/$2-state/_all_docs\?include_docs\=true > state.json
curl -X GET -u $1 http://localhost:5984/$2-course/_all_docs\?include_docs\=true > course.json
curl -X GET -u $1 http://localhost:5984/$2-feedback/_all_docs\?include_docs\=true > feedback.json
