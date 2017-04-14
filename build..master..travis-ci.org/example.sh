# example.sh

# this shell script will serve a webpage that will interactively run browser-tests with coverage

# instruction
    # 1. copy and paste this entire shell script into a console and press enter
    # 2. play with the browser-demo on http://127.0.0.1:8081

shExampleSh() {(set -e
    # npm install utility2
    npm install utility2
    # serve a webpage that will interactively run browser-tests with coverage
    cd node_modules/utility2 && export PORT=8081 && npm start
)}
shExampleSh