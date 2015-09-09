/* eslint-disable no-undef */
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLInt
} from 'graphql';

import * as ArticleServices from './ArticleServices';
import { ArticleStatusEnum } from './ArticleEnums';

const CollectionType = new GraphQLObjectType({
  name: 'Collection',
  description: 'A collection of articles',
  fields: () => ({
    name:     { type: new GraphQLNonNull(GraphQLString) },
    articles: { type: new GraphQLList(ArticleType) }
  })
});

const ArticleType = new GraphQLObjectType({
  name: 'Article',
  description: 'An article with slug, title, and body.',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'unique content item id'
    },
    slug: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'unique slug'
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the title of the article, aka the headline'
    },
    body: {
      type: GraphQLString,
      description: 'the article\'s body'
    },
    status: {
      type: new GraphQLNonNull(ArticleStatusEnum),
      description: 'the current status of the article, live, working, deleted'
    },
    relatedArticles: {
      type: new GraphQLList(ArticleType),
      description: 'articles marked as related to this article (with optional limit)',
      args: { limit: { type: GraphQLInt } },
      resolve: (article, { limit }) => { return ArticleServices.getMultipleById(article.relatedArticleIds, limit); }
    }
    // inCollections: {
    //   type: new GraphQLList(CollectionType),
    //   description: 'the collections that contain this article'
    //   resolve: (article) => {
    //     ArticleServices.
    //   }
    // }
  })
});

export default {
  ArticleType: ArticleType,
  CollectionType: CollectionType
};
/* eslint-enable */
