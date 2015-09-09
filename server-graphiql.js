var path = require('path');
var express = require('express');
var app = express();

app.use(express.static('graphiql'));

app.get('/', function (req, res) {
  res.sendFile('graphiql.html', { root: path.join(__dirname) });
});

var server = app.listen(8092, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});