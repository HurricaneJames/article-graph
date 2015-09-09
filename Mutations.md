GraphQL Mutations
=================

A lot has been written about querying with GraphQL (ex. [link](), [link](), [link]()). In contrast, however, not much has been written about mutating data with GraphQL. Moreover, what has been written is generally limited to simple data.

Recently, we wanted to see how hard it would be to use GraphQL to replace a *"mostly"* REST api. Implementing the index/show parts were fairly straight forward queries. The delete mutation was as simple as passing an id. Update, for simple updates, was fairly easy too, especially if we had different mutations for every different possible attribute. But we wanted something we could pass all attributes to for update and create.

It was not difficult to make it work. In retrospect, it was actually pretty easy. And, once we had it working, the power of GraphQL mutations was amazing. Mutations are easier to reason about than REST in most cases and certainly no worse.

I presented all of this in a tech talk to my company a few days ago. Enough people were interested that we decided I should write a short article. This is that article.


## Background

I will give all of my examples in [GraphQL-JS](https://github.com/graphql/graphql-js). At the time of writing it is in version 0.4.2. As this library is evolving rapidly, some of the things in this article may have changed. Hopefully, many of the pain points will be gone.

I assume that the reader already knows how to write queries, and schemas in GraphQL-JS. If not, go read some of the links about querying above. Alternatively, you can just skim what is below to get a general idea.


## A Simple Mutation

GraphQL mutations are relatively simple. You create what looks mostly like a query, give it some input params, call it a mutation, and add it to your schema. So, if we have a simple query only schame.

````
export default new GraphQLSchema({
  query: QueryType
});
````

Then we can just add our mutations.

````
export default new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});
````

So, what does MutationType look like? It is just a GraphQLObject like we use in our queries. It has a name, description, and fields, just like any other Object type. As with the queries, the `fields` represent the available mutations.

````
var MutationType = new GraphQLObjectType({
  name: 'ArticleGraph Mutations',
  description: 'These are the things we can change',
  fields: () => ({
    deleteArticle: {
      type: ArticleType,
      description: 'Delete an article with id and return the article that was deleted.',
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) }
      },
      resolve: (value, { id }) => {
        return ArticleServices.delete(id);
      }
    }
  }),
});
````

In the example above, I showed a mutation to delete an article from our database. As with most other examples you can find, it takes a fairly simple scalar argument.

Telling GraphQL to mutate the data store is very similar to querying for information. We tell the server which mutation to perform, provide the required arguments, and list the desired return data. This is part of what makes GraphQL queries so powerful.

````
mutation ExampleMutation {
  deleteArticle(id: 1234) {
    status
  }
}
````

In the example above we call `deleteArticle`, which returns the deleted Article. In our system articles are not fully deleted when we call deleteArticle, they are marked for deletion and unavailable via normal means. However, the article still exists with a status of "Pending Deletion." We request the article status to determine that the delete was successful. It could have easily returned a boolean scalar type to say wheter the operation was successful.


## A Complex Mutation

Mutations with scalars was fairly straight forward. What if we want to do something a little more data intensive. For example, what if we want to create or update an article isntead of deleting it.

````
var MutationType = new GraphQLObjectType({
  name: 'GraphQL Mutations',
  description: 'These are the things we can change',
  fields: () => ({
    createArticle: {
      type: ArticleType,
      description: 'Create a new article',
      args: {
        article: { type: ArticleInputType }
      },
      resolve: (value, { article }) => {
        return ArticleServices.createArticle(article);
      }
    }
  }),
});
````

The schema implementation is almost identical to delete. The return type is still ArticleType, and the resolve function still passes off the article to some backend service. The only difference is a new `ArticleInputType`.

I want to take a moment to reflect. In REST this is two separate endpoints that take roughly the same data. However, with REST, we have no idea what will be returned. With GraphQL we know exactly what will be returned, and we can use introspection to discover what that return is without needing to look at code or delete anything (hoping that this delete is the same as the next delete, and we have all seen cases where REST endpoints return different things in different cases).

So, what about this new `ArticleInputType`. GraphQL spec says that inputs must be scalars or [`Input Objects`](https://github.com/facebook/graphql/blob/master/spec/Section%203%20--%20Type%20System.md#input-objects). This is because `Objects` "can contain fields that express circular references or references to interfaces and unions, neither of which is appropriate for use as an input argument." In practice, we have found it also helps to separate input from output, making our code easier to read.


So, lets compare `ArticleType` with `ArticleInputType`.

````
const ArticleType = new GraphQLObjectType({
  name: 'Article',
  description: 'An article with slug, title, and body.',
  fields: () => ({
    id:     { type: new GraphQLNonNull(GraphQLId) },
    slug:   { type: new GraphQLNonNull(GraphQLString) },
    title:  { type: new GraphQLNonNull(GraphQLString) },
    body:   { type: GraphQLString },
    status: { type: new GraphQLNonNull(ArticleStatusEnum) },
    relatedArticles: {
      type: new GraphQLList(ArticleType),
      args: { limit: { type: GraphQLInt } },
      resolve: (article, { limit }) => { return ArticleServices.getMultipleById(article.relatedArticleIds, limit); }
    }
  })
});

const ArticleInputType = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: () => ({
    id:          { type: GraphQLInt },
    slug:        { type: new GraphQLNonNull(GraphQLString) },
    title:       { type: new GraphQLNonNull(GraphQLString) },
    body:        { type: GraphQLString },
    status:      { type: new GraphQLNonNull(ArticleStatusEnum) },
    relatedArticles: { type: new GraphQLList(ArticleInputType) }
  })
});
````

They look almost identical. The main difference is `relatedArticles`. The main difference is `relatedArticles`. Notice how the input object is more interested in input and not so much resolution. This brings up an interesting quirk.

````
mutation newArticle {
  createArticle(article: {
    slug: "something-new",
    title: "Something New",
    status: live,
    relatedArticles: [
      { id: 1 }
    ]
  }) {
    id
    realtedArticles {
      slug
    }
  }
}
````

The `newArticle` mutation created above will fail. You might expect, as I did, that it would somehow pick up the related articles just from the id. If you did, then like me, you would be wrong. Our `relatedArticles` are missing `slug`, `title`, and `status`, all of which are marked as non-null types. GraphQL will not even try to resolve the mutation because the type schema is broken.

The solution is to take a page out of the Rails playbook.

````
var ArticleAttributesInputType = new GraphQLInputObjectType({
  name: 'ArticleAttributesInput',
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
````

Change `relatedArticles` to `relatedArticleAttributes`. Then, because attributes do not necessarily *need* most attributes, we create an `ArticleAttributesInputType` that allows nulls. This input type will be very useful for the updateArticle mutation.

Now, we can craft a mutation that creates an article, and binds/creates any related articles. It also allows us to update the related articles, which you may or may not want, and should control for in the backend.

````
mutation me {
  createArticle(article: {
    slug: "day",
    title: "day",
    status: live,
    relatedArticleAttributes: [
      { slug: 'night' }
    ]
  }) {
    id
    slug
    title
    body
    status
    relatedArticles {
      slug
    }
  }
}
````

Finally, if adding an `updateArticle` mutation is just as easy as `createArticle`.

````
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
````

We changed `ArticleInputType` to `ArticleAttributesInputType` and `createArticle` to `createOrUpdateArticle`. Fair warning, `createOrUpdate` is the not the right solution. The reason I use it is because 1) it already exists and 2) I am tired of writing a backend for a demo article.


## Wrap-Up

We have looked as some basic mutation techniques on things other than scalar types. All the code necessary to make this run is available on GitHub @ [ArticleGraph](https://github.com/HurricaneJames/article-graph), including the backend code.
