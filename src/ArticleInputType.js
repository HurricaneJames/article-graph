import {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';

import { ArticleStatusEnum } from './ArticleEnums';
import * as ArticleServices from './ArticleServices';

var ArticleAttributesInputType = new GraphQLInputObjectType({
  name: 'ArticleAttributes',
  fields: () => ({
    id:          { type: GraphQLInt },
    slug:        { type: GraphQLString },
    title:       { type: GraphQLString },
    body:        { type: GraphQLString },
    status:      { type: ArticleStatusEnum },
    relatedArticleAttributes: { type: new GraphQLList(ArticleAttributesInputType) }
  })
});

var ArticleInputType = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: () => ({
    id:          { type: GraphQLInt },
    slug:        { type: new GraphQLNonNull(GraphQLString) },
    title:       { type: new GraphQLNonNull(GraphQLString) },
    body:        { type: GraphQLString },
    status:      { type: new GraphQLNonNull(ArticleStatusEnum) },
    relatedArticleAttributes: { type: new GraphQLList(ArticleAttributesInputType) }
  })
});

export default {
  ArticleInputType: ArticleInputType,
  ArticleAttributesInputType: ArticleAttributesInputType
}