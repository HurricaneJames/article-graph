import {
  GraphQLEnumType
} from 'graphql';


const ArticleStatusEnum = new GraphQLEnumType({
  name: 'StatusEnum',
  description: 'the availalbe states for an article',
  values: {
    live: {
      value: 'live',
      description: 'article is live and viewable by the public'
    },
    working: {
      value: 'working',
      description: 'the article is in draft form and viewable to the author and any editors'
    },
    delete: {
      value: 'delete',
      description: 'the article is scheduled to be deleted'
    }
  }
});

export default {
  ArticleStatusEnum: ArticleStatusEnum
};