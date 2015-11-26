./node_modules/.bin/mocha test/*.test.js

cd test
node basic.app.js --seneca.log=level:warn &
NODE_PID=$!
sleep 1
GET_FOO_a0=`curl -m 1 -s http://localhost:3000/api/rest/foo/a`
GET_FOO_b0=`curl -m 1 -s http://localhost:3000/api/rest/foo/b`
POST_FOO_a0=`curl -m 1 -s -d '{"tag":"AA","zed":1}' -H "Content-Type: application/json" http://localhost:3000/api/rest/foo/a`
GET_FOO_a1=`curl -m 1 -s http://localhost:3000/api/rest/foo/a`
kill -9 $NODE_PID

if [ $GET_FOO_a0 != '{"tag":"A","id":"a"}' ]; then
  echo "FAIL: $GET_FOO_a0"
  exit 1
else
  echo "PASS: $GET_FOO_a0"
fi

if [ $GET_FOO_b0 != '{"tag":"B","id":"b"}' ]; then
  echo "FAIL: $GET_FOO_b0"
  exit 1
else
  echo "PASS: $GET_FOO_b0"
fi

if [ $POST_FOO_a0 != '{"tag":"AA","zed":1,"id":"a"}' ]; then
  echo "FAIL: $POST_FOO_a0"
  exit 1
else
  echo "PASS: $POST_FOO_a0"
fi

if [ $GET_FOO_a1 != '{"tag":"AA","zed":1,"id":"a"}' ]; then
  echo "FAIL: $GET_FOO_a1"
  exit 1
else
  echo "PASS: $GET_FOO_a1"
fi
