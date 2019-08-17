# ./import.sh username:password <instance>
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-map
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-test
curl -X DELETE -u $1 http://127.0.0.1:5984/$2-state

curl -X PUT -u $1 http://localhost:5984/$2-map
curl -X PUT -u $1 http://localhost:5984/$2-test
curl -X PUT -u $1 http://localhost:5984/$2-state

curl -X PUT -u $1 http://localhost:5984/$2-map/_design/net -d @design-map.json
curl -X PUT -u $1 http://localhost:5984/$2-test/_design/test -d @design-test.json

#curl -d @map.json -H "Content-type: application/json" -X POST http://127.0.0.1:5984/$2-map/_bulk_docs
#curl -d @test.json -H "Content-type: application/json" -X POST http://127.0.0.1:5984/$2-test/_bulk_docs
#curl -d @state.json -H "Content-type: application/json" -X POST http://127.0.0.1:5984/$2-state/_bulk_docs
