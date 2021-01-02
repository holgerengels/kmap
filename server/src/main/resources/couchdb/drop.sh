#!/bin/bash

curl -X DELETE -u $AUTH http://localhost:5984/$INST-map
curl -X DELETE -u $AUTH http://localhost:5984/$INST-state
curl -X DELETE -u $AUTH http://localhost:5984/$INST-test
curl -X DELETE -u $AUTH http://localhost:5984/$INST-course
curl -X DELETE -u $AUTH http://localhost:5984/$INST-feedback