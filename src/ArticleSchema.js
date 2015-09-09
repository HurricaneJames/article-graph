import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLID
} from 'graphql';

import ArticleQueries from './ArticleQueries';
import ArticleMutations from './ArticleMutations';

export default new GraphQLSchema({
  query: ArticleQueries,
  mutation: ArticleMutations
});