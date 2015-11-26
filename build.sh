#!/bin/sh

./node_modules/.bin/jshint jsonrest-api.js
./node_modules/.bin/docco jsonrest-api.js -o doc

PAGES_ROOT=../gh-pages
DOC_DIR=seneca-jsonrest-api/doc

if [ -d "$PAGES_ROOT" ]; then
    if [ ! -d "$PAGES_ROOT/$DOC_DIR" ]; then
        mkdir -p "$PAGES_ROOT/$DOC_DIR"
    fi
    cp -r doc/* "$PAGES_ROOT/$DOC_DIR"
fi
