curl -u $1 -d "@$2" -H "Content-type: application/json" -X POST http://127.0.0.1:5984/kmap/_bulk_docs
