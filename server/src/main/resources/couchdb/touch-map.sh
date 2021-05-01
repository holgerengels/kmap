urle () { [[ "${1}" ]] || return 1; local LANG=C i x; for (( i = 0; i < ${#1}; i++ )); do x="${1:i:1}"; [[ "${x}" == [a-zA-Z0-9.~_-] ]] && echo -n "${x}" || printf '%%%02X' "'${x}"; done; echo; }
KEY=`urle "$1"`
KEY=${KEY//%27/%22}
REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-map/_design/net/_view/byTopic?include_docs=true\&keys="$KEY" | jq .rows[0].doc._rev | tr -d \"`
ech $REV

#REV=`curl -X GET -u $AUTH http://localhost:5984/$INST-map/_design/net/_view/byTopic?include_docs=true\&keys=$KEY | jq .rows[0].doc._rev | tr -d \"`

echo $REV
#curl -X DELETE -u $AUTH http://localhost:5984/$INST-map/_design/net?rev=$REV
#curl -X PUT    -u $AUTH http://localhost:5984/$INST-map/_design/net -d @design-map.json
