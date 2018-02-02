#!/bin/bash
DIST=dist
if [ ! -d $DIST ]; then mkdir $DIST; fi

uglifyjs RedditPosts.js -o "RedditPosts.min.js" -c -m
node-sass --output-style compressed reddit.scss reddit.css

cp -f reddit.html $DIST/
cp -f reddit.css $DIST/
cp -f RedditPosts.min.js $DIST/
