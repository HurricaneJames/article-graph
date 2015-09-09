import Immutable from 'immutable';
import { seedArticles } from './ArticleServices-seeds';

var articleStore, articlesBySlug;
export function reset() {
  articleStore = new Immutable.Map();
  articlesBySlug = articleStore;
  for(var i = 0, len = seedArticles.length; i < len; ++i) {
    addArticle(seedArticles[i]);
  }
}
// initialize
reset();

export function getById(articleId) {
  var article = articleStore.get(articleId);
  return article ? article.toJS() : undefined;
};

export function getBySlug(articleSlug) {
  var article = articleStore.get(articlesBySlug.get(articleSlug));
  return article ? article.toJS() : undefined;
};

export function getMultipleById(articleIds, optionalLimit) {
  if(!articleIds || articleIds.length === 0) { return; }
  return articleStore.filter((article) => { return articleIds.indexOf(article.get('id')) > -1; }).toList().toJS();
}

function getNewArticleId() {
  // normally there would be a real database for this kind fo thing
  return Date.now();
}

export function isValidArticle(article) {
  var immutableArticle = Immutable.fromJS(article);
  const REQUIRED_ATTRIBUTES = ['id', 'title', 'slug', 'status'];
  for(var i = 0, len = REQUIRED_ATTRIBUTES.length; i < len; ++i) {
    if(!immutableArticle.get(REQUIRED_ATTRIBUTES[i])) { return false; }
  }
  return true;
}

function blitArticle(immutableArticle) {
  var articleId  = immutableArticle.get('id') || Date.now();
  articleStore   = articleStore.set(articleId, immutableArticle.set('id', articleId));
  articlesBySlug = articlesBySlug.set(immutableArticle.get('slug'), articleId);
  return immutableArticle;
}

function saveArticle(immutableArticle) {
  return isValidArticle(immutableArticle) ? blitArticle(immutableArticle) : false;
}

function getArticleFromAttributes(immutableAttributes) {
  var article;
  if(immutableAttributes.get('id'))   { article = getById(immutableAttributes.get('id')); }
  if(!article && immutableAttributes.get('slug')) { article = getBySlug(immutableAttributes.get('slug')); }
  return article;  
}

export function createArticle(articleAttributes) {
  var immutableAttributes = Immutable.fromJS(articleAttributes);
  if(immutableAttributes.get('id')) { return undefined; }
  var article = getArticleFromAttributes(immutableAttributes);
  return article ? undefined : createOrUpdateArticle(articleAttributes);
}

export function createOrUpdateArticle(articleAttributes) {
  var immutableAttributes = Immutable.fromJS(articleAttributes);
  var immutableArticle    = Immutable.fromJS(getArticleFromAttributes(immutableAttributes) || { id: getNewArticleId() });
  immutableArticle = immutableArticle.withMutations(mutableArticle => {
    immutableAttributes.forEach((value, attribute) => {
      if(attribute !== 'id') { mutableArticle.set(attribute, value); }
    });
  });

  var relatedArticleAttributes = immutableArticle.get('relatedArticleAttributes');
  var relatedArticleIds;
  if(relatedArticleAttributes) { immutableArticle = immutableArticle.delete('relatedArticleAttributes'); }
  if(relatedArticleAttributes) {
    relatedArticleIds = relatedArticleAttributes.map((articleAttributes) => {
      var article = createOrUpdateArticle(articleAttributes);
      return article ? article.id : false;
    });
    if(relatedArticleIds.contains(false)) {
      return undefined;
    }else {
      immutableArticle = immutableArticle.set('relatedArticleIds', relatedArticleIds);
    }
  }

  var article = saveArticle(immutableArticle);
  return article ? article.toJS() : undefined;
}

export function addArticle(article) {
  // validateArticle(article); // TODO
  return blitArticle(Immutable.fromJS(article)).toJS();
  // if(!article) { return undefined; }
  // var immutableArticle = Immutable.fromJS(article);

  // if(!immutableArticle.get('id')) { immutableArticle = immutableArticle.set('id', getNewArticleId()); }
  // // article.id = article.id || getNewArticleId();


  // var articleId = immutableArticle.get('id');
  // articleStore = articleStore.set(articleId, immutableArticle);
  // articlesBySlug = articlesBySlug.set(immutableArticle.get('slug'), articleId);

  // return immutableArticle.toJS();
};

export function deleteArticle(articleId) {
  var article = articleStore.get(articleId);
  articleStore = articleStore.delete(articleId);
  articlesBySlug = articlesBySlug.delete(article.get('slug'));
  // removeArticleFromCollections(articleId);
}

var collectionStore = new Immutable.Map();
const EMPTY_COLLECTION = new Immutable.Set();
function getArticleId(article) { return Immutable.Map.isMap(article) ? article.get('id') : article.id; }

export function getCollection(name) {
  return collectionStore.get(name);
};

export function addToCollection(collectionName, article) {
  var newCollection = (collectionStore.get(collectionName) || EMPTY_COLLECTION).add(getArticleId(article));
  collectionStore = collectionStore.set(collectionName, newCollection);
  return collectionStore;
};

export function removeFromCollection(collectionName, article) {
  var newCollection = (collectionStore.get(collectionName) || EMPTY_COLLECTION).delete(getArticleId(article));
  collectionStore = collectionStore.set(collectionName, newCollection);
  return collectionStore;
};

export function getCollectionsThatContainArticle(article) {
  var articleId = getArticleId(article);
  return collectionStore.filter((collection) => { collection.includes(articleId); });
};

export function dump() {
  console.log(articleStore.toSource());
}