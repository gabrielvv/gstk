# Google Apps Script Application Toolkit
[![npm](https://img.shields.io/npm/v/gstk.svg)](https://www.npmjs.com/package/gstk)
[![npm](https://img.shields.io/npm/dm/gstk.svg)](https://www.npmjs.com/package/gstk)
[![Build Status](https://travis-ci.org/gabrielvv/gstk.svg?branch=master)](https://travis-ci.org/gabrielvv/gstk)
[![Coverage Status](https://coveralls.io/repos/gabrielvv/gstk/badge.svg?branch=master)](https://coveralls.io/r/gabrielvv/gstk?branch=master)

## Installation

```sh
npm i --save gstk
```

## Modulazer

```js
modulazer
    .module(/* nom du module */'A', /* dépendances */['B'])

    // déclaration d'un service 'foo' ayant pour dépendance un service 'bar'
    .factory('foo', function(bar){
        return 'foo' + bar();
    })

modulazer
    .module('B', [])

    // déclaration d'un service 'bar'
    .factory('bar', function(){
        return function(){
            return 'bar';
        };
    })
```

## PersistedModel

```js
modulazer.module('gstk').factory('Colonne', function(PersistedModel){

  var builder = new PersistedModel.Builder();
  builder.setModelName('Colonne')
    .setConnector(PersistedModel.DB_CONNECTORS.SPREADSHEET)
    .setDbType(PersistedModel.DB_MODELS.COLUMNS)
    .setDatabase('PUT_YOUR_SPREADSHEET_ID_HERE')
    //.setTable('Colonne')
    .setSchema({
      id: String,
      foo: {type: Number, required: true},
      bar: {type: Boolean},
      quux: Date,
    });

 return builder.build();

})
.factory('Document', function(PersistedModel){
  var builder = new PersistedModel.Builder();
  builder.setModelName('Document')
    .setConnector(PersistedModel.DB_CONNECTORS.SPREADSHEET)
    .setDbType(PersistedModel.DB_MODELS.DOCUMENT)
    .setDatabase(('PUT_YOUR_SPREADSHEET_ID_HERE')
    //.setTable('Document')
    .setSchema({
      id: {
        type: String,
      },
      foo: {type: Number, required: true},
      bar: {type: Boolean},
      quux: Date,
    });

 return builder.build();

})
.controller('test', function(Document, Colonne, assert){
  var c = new Colonne();
  c.save();

  assert(Colonne.findAll);
  var colonnes = Colonne.findAll();

  var d = new Document();
  d.save();

  assert(Document.findAll);
  var documents = Document.findAll();
});

modulazer.bootstrap('gstk');
```

## Relations

```js
/**
* Définit une clé étrangère 'aid' sur Feuille correspondant à la clé 'id' de l'Arbre
* Définit une méthode Arbre.prototype.linkToFeuille pour lier les 2 modèles
* Définit une méthode Arbre.prototype.feuilles pour récupérer toutes les feuilles de l'Arbre
*/
Arbre.hasMany(Feuille, {foreignKey: 'aid', relateTo: 'id'});

var a = new Arbre();
var f1 = new Feuille();
var f2 = new Feuille();

a.linkToFeuille(f1);
a.linkToFeuille(f2);

assert.equal(a.feuilles().length, 2);
assert(a.feuilles().every(function(f){
  return f instanceof Feuille;
}));
```

## References

* https://gsuite-developers.googleblog.com/2015/12/advanced-development-process-with-apps.html
* https://developers.google.com/apps-script/api/
* https://github.com/google/clasp
* https://developers.google.com/apps-script/guides/distribute-web-app
* https://script.google.com/home/usersettings
