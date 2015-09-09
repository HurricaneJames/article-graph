require('babel/register');
var graphQLServer = require('./src/ArticleServer');

var config = {
  port: 8091
};

graphQLServer(config);