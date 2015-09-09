#!/bin/sh

GRAPHIQL=./graphiql/
rm -rf $GRAPHIQL && mkdir -p $GRAPHIQL &&
cp node_modules/graphiql/graphiql.min.js $GRAPHIQL/graphiql.min.js &&
cp node_modules/graphiql/graphiql.css $GRAPHIQL/graphiql.css 
