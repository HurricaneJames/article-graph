GraphQL Mutations
=================

A lot has been written and said about GraphQL (ex. [GraphQL & OMDB](http://red-badger.com/blog/2015/07/09/graphql-and-the-open-movie-database-from-introspection-to-inception/), [GraphQL & Rest](http://blog.startifact.com/posts/graphql-and-rest.html), [GraphQL Overview](https://blog.risingstack.com/graphql-overview-getting-started-with-graphql-and-nodejs/), [React Europe & GraphQL](http://red-badger.com/blog/2015/07/08/react-europe-and-graphql/), [GraphQL at the Financial Times](https://www.youtube.com/watch?t=1440&v=S0s935RKKB4)). However, not much has been written about mutating data with GraphQL. Moreover, what has been written is generally limited to simple data.

Recently, we wanted to see how hard it would be to use GraphQL to replace a *"mostly"* REST api. Implementing the index/show parts were fairly straight forward queries. The delete mutation was as simple as passing an id. Update, for simple updates, was fairly easy too, especially if we had different mutations for every different possible attribute. But we wanted a single mutation where we could pass structured attributes for update and/or create.

It was not difficult to make it work. In retrospect, it was actually pretty easy. And, once we had it working, the power of GraphQL mutations was amazing. Mutations are easier to reason about than REST in most cases and, at least so far, no worse in any case.


## Background

This demo, and subsequent write-up, come from a tech talk I gave. Enough people were interested that we decided I should write a short article. This is that article.

I will give all of my examples in [GraphQL-JS](https://github.com/graphql/graphql-js). At the time of writing it is in version 0.4.2. As this library is evolving rapidly, some of the things in this article may have changed. Hopefully, many of the pain points will be gone.

I assume that the reader already knows how to write queries, and schemas in GraphQL-JS. If not, go read some of the links about querying above. Alternatively, you can just skim what is below to get a general idea.


## A Simple Mutation

The only real difference between a mutation and a query is the word `mutation`. Interestingly, there is nothing stopping a query from including a side effect just like a mutation. It is purely a semantic difference so we can keep our mutations separate. That does not mean it is unimportant. In fact this is one of the more important separations of concerns. Bottom line, when you do anything that will change the data, call it a mutation.

To add mutations to a schema, we just add the `mutation` key and pass in `Mutation` type.

````
export default new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});
````

So, what does MutationType look like? It is nothing more than a GraphQLObject, same as with `QueryType` for the queries. It has a name, description, and fields, just like any other Object type. Also, as with the queries, the `fields` represent the available mutations.

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

The example above shows a mutation to delete an article from the backend, `ArticleServices`. As with most other examples you can find, it takes a fairly simple scalar argument. It also returns the article (see `type: ArticleType`, though it could have returned anything.

Telling GraphQL to mutate the data store is also very similar to querying for information. We tell the server to perform a mutation, which mutation to perform, provide the required arguments, and list the desired return data. This dual mutation/query functionality makes GraphQL exceptionally powerful.

````
mutation ExampleMutation {
  deleteArticle(id: 1234) {
    status
  }
}
````

In the example above we call `deleteArticle`, which returns the deleted Article. In our system articles are not fully deleted when we call `deleteArticle`. Instead, they are marked for deletion and unavailable via normal means. However, the article still exists with a status of "Pending Deletion." We request the article status to determine that the delete was successful. The mutation return type could have easily been boolean scalar type to say wheter the operation was successful.


## A Complex Mutation

Mutations with scalars was fairly straight forward. What if we want to do something a little more data intensive. For example, what if we want to create or update an article instead of deleting it.

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

I want to take a moment to reflect. In REST this is two separate endpoints that take roughly the same data. However, with REST, we have no idea what will be returned. With GraphQL we know exactly what can be returned. We can use introspection to discover what that return is without needing to look at code or delete anything (hoping that this delete is the same as the next delete, and we have all seen cases where REST endpoints return different things in different cases). Finally, we specify exactly which pieces of that available information will be returned, just like a query.

So, what about this new `ArticleInputType`. GraphQL spec says that inputs must be scalars or [`Input Objects`](https://github.com/facebook/graphql/blob/master/spec/Section%203%20--%20Type%20System.md#input-objects). This is because `Objects` "can contain fields that express circular references or references to interfaces and unions, neither of which is appropriate for use as an input argument." In practice, we have also found it also helps to separate inputs from outputs, making our code easier to read.

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

They look almost identical. The main difference is `relatedArticles`. Notice how the input object is more interested in input and not so much resolution. This brings up an interesting quirk.

Imagine a mutation that is trying to create a new article and link an existing article as a related article. At first you might try something like this.

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

The `newArticle` mutation created above will fail. You might expect, as I did, that it could somehow pick up the related articles just from the id. That is what the resolve functions are for, right? Well, if you did, then like me, you would be wrong. Our `relatedArticles` are missing `slug`, `title`, and `status`, all of which are marked as non-null types. Go ahead and check, we will wait for you.

GraphQL will not even try to resolve the mutation because the type schema rejects the input. The solution is to take a page out of the Rails playbook (and yes, I'm sure it stole it from somebody else).

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

Change `relatedArticles` to `relatedArticleAttributes`. Then, because attributes do not necessarily *need* most attributes, we create an `ArticleAttributesInputType` that allows nulls. This input type will be very useful for the `updateArticle` mutation.

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

Finally, adding an `updateArticle` mutation is just as easy as `createArticle`.

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

The three most important things you can take away are:

  1. mutations are just queries in a different namespace, but do NOT mix them
  2. arguments require Input Objects, not normal Objects
  3. use `xyxAttributes` for anything you want to link, then let your backend sort out how to do the linking (just like any other system we currently use)

