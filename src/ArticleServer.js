import restify from 'restify';
import { graphql } from 'graphql';

import ArticleSchema from './ArticleSchema';

export default (config) => {
  var server = restify.createServer({
    name: 'articlegraph'
  });


  server.use(restify.CORS());
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  // server.use(restify.bodyParser());
  server.use(restify.bodyParser({ mapParams: true }));
  server.use(restify.gzipResponse());


  server.get('/', (request, response) => {
    response.send({
      app: 'article-graph',
      author: 'James Burnett <HurricaneJamesEsq@gmail.com> (http://github.com/HurricaneJames)',
      website: 'https://github.com/HurricaneJames/article-graph'
    })
  });

  server.post('/', (request, response) => {
    // console.log("Received Query: ");
    // console.log('    request:   ', request.body);
    // console.log('    query:     ', request.body.query);
    // console.log('    variables: ', request.body.variables);
    if(request.body.query) {
      graphql(ArticleSchema, request.body.query, request.body.variables).then((result) => {
        response.send(result);
      });
    }else {
      response.send('Invalid Query');
    }

  });

  server.listen(config.port || 8080, () => {
    console.log('%s listening at %s', server.name, server.url);
  });
}