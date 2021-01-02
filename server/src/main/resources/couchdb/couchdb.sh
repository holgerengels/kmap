#!/bin/bash

# wait for couchdb to be up
# shellcheck disable=SC2034
for i in $(seq 20); do
  if curl -s http://localhost:5984 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

STATUS=$(curl -LI -u $AUTH http://localhost:5984/$INST-map -o /dev/null -w '%{http_code}\n' -s)
if [ $STATUS == '404' ]; then
  echo "create system databases .."
  curl -X PUT -u $AUTH http://localhost:5984/_users
  curl -X PUT -u $AUTH http://localhost:5984/_replicator
  curl -X PUT -u $AUTH http://localhost:5984/_global_changes

  echo "create app databases .."
  echo ".. create $INST-map .."
  ./create-map.sh
  echo ".. create $INST-state .."
  ./create-state.sh
  echo ".. create $INST-test .."
  ./create-test.sh
  echo ".. create $INST-course .."
  ./create-course.sh
  echo ".. create $INST-feedback .."
  ./create-feedback.sh
else
  echo "update app databases .."
  echo ".. update $INST-map .."
  ./update-map.sh
  echo ".. update $INST-test .."
  ./update-test.sh
  echo ".. update $INST-course .."
  ./update-course.sh
fi
echo ".. done"
