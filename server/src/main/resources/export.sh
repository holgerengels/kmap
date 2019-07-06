#!/bin/bash

curl -X GET http://localhost:5984/kstate/_all_docs\?include_docs\=true > state.json
