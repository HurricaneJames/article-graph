import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';
import { ArticleType } from './ArticleType';
import * as ArticleServices from './ArticleServices';

export default new GraphQLObjectType({
  name: 'ArticleQueries',
  description: 'Article API Queries',
  fields: () => ({
    article: {
      type: ArticleType,
      description: 'Find a content item by slug or id',
      args: {
        slug: { type: GraphQLString },
        id:   { type: GraphQLInt }
      },
      resolve: (root, { slug, id }) => {
        if(slug) { return ArticleServices.getBySlug(slug); }
        if(id)   { return ArticleServices.getById(id); }
      }
    },
    collection: {
      type: new GraphQLList(ArticleType),
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: (root, { name }) => {
        return ArticleServices.getCollection(name);
      }
    }
  })
});