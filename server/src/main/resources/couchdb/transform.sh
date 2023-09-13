#!/bin/bash

node ../transformdocs.js map.json
node ../transformdocs.js test.json
node ../transformdocs.js state.json
node ../transformdocs.js course.json
node ../transformdocs.js feedback.json
