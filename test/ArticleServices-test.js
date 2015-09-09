import expect from 'expect.js';
import Immutable from 'immutable';

import * as ArticleServices from '../src/ArticleServices';

describe('ArticleServices', () => {
  var sampleArticle;
  beforeEach(() => {
    sampleArticle = { id: 123, slug: 'abc', title: 'ABC', status: 'live' };
    ArticleServices.reset();
  })
  describe('articles', () => {
    it('should get an article by id', () => {
      // todo, add some fixtures
      ArticleServices.addArticle(sampleArticle);
      expect(ArticleServices.getById(123)).to.eql(sampleArticle);
      expect(ArticleServices.getById(555555555)).to.be(undefined);
    });
    it('should get an article by slug', () => {
      ArticleServices.addArticle(sampleArticle);
      expect(ArticleServices.getBySlug(sampleArticle.slug)).to.eql(sampleArticle);
      expect(ArticleServices.getBySlug('never-did-this-ever-exist')).to.be(undefined);
      // expect(Immutable.is(ArticleServices.getBySlug(sampleArticle.slug), Immutable.fromJS(sampleArticle))).to.be.ok();
    });
    it('should add an article', () => {
      // even if it is invalid
      var id = 222;
      sampleArticle.id = id;
      expect(ArticleServices.getById(id)).to.be(undefined);
      ArticleServices.addArticle(sampleArticle);
      expect(ArticleServices.getById(id)).to.eql(sampleArticle);
      // expect(Immutable.is(ArticleServices.getById(id), Immutable.fromJS(sampleArticle))).to.be.ok();
    });
    describe('createArticle', () => {
      it('should create an article if it does not already exist', () => {
        delete sampleArticle.id;
        var article = ArticleServices.createArticle(sampleArticle);
        expect(article).to.be.ok();
        expect(article.id).not.to.be(undefined);
      });
      it('should not create an article if the id attribute is present', () => {
        var article = ArticleServices.createArticle(sampleArticle);
        expect(article).not.to.be.ok();
      });
    });
    describe('createOrUpdate', () => {
      it('should generate an id if it does not exist', () => {
        delete sampleArticle.id;
        var article = ArticleServices.createOrUpdateArticle(sampleArticle);
        expect(article).to.be.ok();
      });
      it('should look up based on slug or id', () => {
        var originalId = sampleArticle.id;
        var article = ArticleServices.addArticle(sampleArticle);
        delete sampleArticle.id;
        article = ArticleServices.createOrUpdateArticle(sampleArticle);
        expect(article.id).to.be(originalId);
      });
      it('should should update the attributes passed in', () => {
        ArticleServices.addArticle(sampleArticle);
        var newTitle = sampleArticle.title + 'xyz';
        sampleArticle.title = newTitle;
        var article = ArticleServices.createOrUpdateArticle(sampleArticle);
        expect(article.title).to.be(newTitle);
      });
      it('should should return undefined if the article is not valid', () => {
        delete sampleArticle.slug
        var article = ArticleServices.createOrUpdateArticle(sampleArticle);
        expect(article).to.be(undefined);
      });
      it('should createOrUpdate any relatedArticleAttributes', () => {
        ArticleServices.addArticle(sampleArticle);
        sampleArticle.relatedArticleAttributes = [
          { slug: 'my-new-slug', title: 'who is there', status: 'live' },
          { id: sampleArticle.id }
        ];

        var article = ArticleServices.createOrUpdateArticle(sampleArticle);
        var newArticle = ArticleServices.getBySlug('my-new-slug');
        expect(newArticle.title).to.be('who is there');
        expect(article.relatedArticleIds).to.eql([newArticle.id, sampleArticle.id]);
      });
      it('should should not save the relatedItemAttributes as a field on the article', () => {
        ArticleServices.addArticle(sampleArticle);
        sampleArticle.relatedArticleAttributes = [
          { slug: 'my-new-slug', title: 'who is there', status: 'live' },
          { id: sampleArticle.id }
        ];

        var article = ArticleServices.createOrUpdateArticle(sampleArticle);
        expect(article.relatedArticleAttributes).to.be(undefined);
      });
      // seriously, this is going to far on this stupid demo library...
      it('should not save the article if any of the related item attributes fail');
    });
    it('should delete an article', () => {
      ArticleServices.addArticle(sampleArticle)
      ArticleServices.deleteArticle(sampleArticle.id);
      expect(Immutable.is(ArticleServices.getById(sampleArticle.id), Immutable.fromJS(sampleArticle))).not.to.be.ok();
    });
    it('should validate an article');
  });
  describe('collections', () => {
    var name;
    beforeEach(() => {
      name = 'my-name';
    })
    it('should get a collection by name', () => {
      ArticleServices.addToCollection(name, sampleArticle);
      expect(ArticleServices.getCollection(name).toJS()).to.eql([sampleArticle.id]);
    });
    it('should list all the article ids in the collection', () => {
      ArticleServices.addToCollection(name, sampleArticle);
      ArticleServices.addToCollection(name, { id: 222 });
      ArticleServices.addToCollection(name, { id: 333 });
      expect(ArticleServices.getCollection(name).toJS()).to.eql([sampleArticle.id, 222, 333]);
    });
    it('should add an article to a collection');
    it('should remove an article from a collection');
    it('should list all the collections that contain an article');
    it('should remove articles from all collections when they are deleted');
  });
});