#!/bin/bash

STATUS=`curl -LI -u $AUTH http://localhost:5984/$INST-map -o /dev/null -w '%{http_code}\n' -s`
if [ $STATUS == '404' ] ; then
        echo "create databases .."
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
        echo "update databases .."
        echo ".. update $INST-map .."
        ./update-map.sh
        echo ".. update $INST-test .."
        ./update-test.sh
        echo ".. update $INST-course .."
        ./update-course.sh
fi
echo ".. done"
