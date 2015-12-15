#!/usr/bin/env bash
../node_modules/.bin/jshint jsonrest-api.js
../node_modules/.bin/docco jsonrest-api.js -o doc
cp -r doc/* ../gh-pages/seneca-jsonrest-api/doc
