#!/bin/bash
curl -X DELETE -u $1 http://127.0.0.1:5984/kstate
curl -X PUT -u $1 http://127.0.0.1:5984/kstate

curl -X DELETE -u $1 http://127.0.0.1:5984/kmap
curl -X PUT -u $1 http://127.0.0.1:5984/kmap
curl -X PUT -u $1 -d "@$2" http://127.0.0.1:5984/kmap/_design/net
