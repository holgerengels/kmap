#!/bin/bash
#cd kmap/src/main/resources/

#REV=`curl -X GET -u $1 http://localhost:5984/kmap/_design/net | jq ._rev | tr -d \"`
#curl -X DELETE -u $1 http://localhost:5984/kmap/_design/net?rev=$REV
#curl -X PUT -u $1 http://localhost:5984/kmap/_design/net -d @design-kmap.json

curl -X PUT -u $1 http://localhost:5984/ktest
curl -X PUT -u $1 http://localhost:5984/ktest/_design/test -d @design-ktest.json
