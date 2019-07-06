#!/bin/bash
curl -X DELETE -u $1 http://127.0.0.1:5984/kstate-test
curl -X PUT -u $1 http://127.0.0.1:5984/kstate-test

curl -X DELETE -u $1 http://127.0.0.1:5984/kmap-test
curl -X PUT -u $1 http://127.0.0.1:5984/kmap-test
curl -X PUT -u $1 -d @database.json http://127.0.0.1:5984/kmap-test/_design/net
