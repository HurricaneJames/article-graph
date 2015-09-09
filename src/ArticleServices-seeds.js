export default {
  seedArticles: [
    {
      id: 1,
      slug:   'alpha',
      title:  'alpha',
      body:   'alpha body',
      status: 'live',
      relatedArticleIds: [2, 3]
    },
    {
      id: 2,
      slug:   'beta',
      title:  'beta',
      body:   'beta body',
      status: 'live',
      relatedArticleIds: [4]
    },
    {
      id: 3,
      slug:   'gamma',
      title:  'gamma',
      body:   'gamma body',
      status: 'live',
      relatedArticleIds: [4, 5]
    },
    {
      id: 4,
      slug:   'delta',
      title:  'delta',
      body:   'delta body',
      status: 'live',
      relatedArticleIds: [1]
    },
    {
      id: 5,
      slug:   'epsilon',
      title:  'epsilon',
      body:   'epsilon body',
      status: 'live',
      relatedArticleIds: []
    },
  ]
}