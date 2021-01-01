#!/bin/bash

STATUS=`curl -LI -u $AUTH http://localhost:5984/$INST-map -o /dev/null -w '%{http_code}\n' -s`
if [ $STATUS == '404' ] ; then
        echo "create databases .."
        echo ".. create $AUTH-map .."
        ./create-map.sh
        echo ".. create $AUTH-state .."
        ./create-state
        echo ".. create $AUTH-test .."
        ./create-test.sh
        echo ".. create $AUTH-course .."
        ./create-course.sh
        echo ".. create $AUTH-feedback .."
        ./create-feedback
elif
        echo "update databases .."
        echo ".. update $AUTH-map .."
        ./update-map.sh
        echo ".. update $AUTH-test .."
        ./update-test.sh
        echo ".. update $AUTH-course .."
        ./update-course.sh
fi
echo ".. done"
