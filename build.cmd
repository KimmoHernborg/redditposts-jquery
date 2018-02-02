@echo off
CALL UGLIFYJS RedditPosts.js -o "RedditPosts.min.js" -c -m
CALL NODE-SASS --output-style compressed reddit.scss reddit.css
REM CALL NODE-SASS reddit.scss reddit.css

IF NOT EXIST dist MKDIR dist
COPY /Y reddit.html dist
COPY /Y reddit.css dist
COPY /Y RedditPosts.min.js dist