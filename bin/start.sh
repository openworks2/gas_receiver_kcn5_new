#!/bin/sh
# start.sh

# Start Redis in the background
redis-server --daemonize yes

# Start the Node.js application
exec node app.js
