import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';

import { ArticleType } from './ArticleType';
import { ArticleInputType, ArticleAttributesInputType } from './ArticleInputType';
import * as ArticleServices from './ArticleServices';

export default new GraphQLObjectType({
  name: 'ArticleMutations',
  description: 'Article API Mutations',
  fields: () => ({
    createArticle: {
      type: ArticleType,
      description: 'Create a new article.',
      args: {
        article: { type: ArticleInputType }
      },
      resolve: (root, { article }) => {
        return ArticleServices.createArticle(article);
      }
    },
    updateArticle: {
      type: ArticleType,
      description: 'Update an article article, and optionally any related articles.',
      args: {
        article: { type: ArticleAttributesInputType }
      },
      resolve: (root, { article }) => {
        return ArticleServices.createOrUpdateArticle(article);
      }
    }
  })
});