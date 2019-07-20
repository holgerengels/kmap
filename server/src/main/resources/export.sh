#!/bin/bash

curl -X GET http://localhost:5984/map-$2/_all_docs\?include_docs\=true > map.json
curl -X GET http://localhost:5984/test-$2/_all_docs\?include_docs\=true > test.json
curl -X GET http://localhost:5984/state-$2/_all_docs\?include_docs\=true > state.json
