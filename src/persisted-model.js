modulazer
  .module('gstk', ['gs'])
  .factory('PersistedModel', [
    'assert',
    '_',
    'mLogger',
    'filter',
    'global',
    'Schema',
    'Session',
    'SheetDescriptor',
    'SpreadsheetApp',
    persistedModelFactory
  ]);

function persistedModelFactory(
  assert,
  _,
  mLogger,
  filter,
  global,
  Schema,
  Session,
  SheetDescriptor,
  SpreadsheetApp
) {
  /*****************************************************************************************************************************

########  ######## ########   ######  ####  ######  ######## ######## ########     ##     ##  #######  ########  ######## ##
##     ## ##       ##     ## ##    ##  ##  ##    ##    ##    ##       ##     ##    ###   ### ##     ## ##     ## ##       ##
##     ## ##       ##     ## ##        ##  ##          ##    ##       ##     ##    #### #### ##     ## ##     ## ##       ##
########  ######   ########   ######   ##   ######     ##    ######   ##     ##    ## ### ## ##     ## ##     ## ######   ##
##        ##       ##   ##         ##  ##        ##    ##    ##       ##     ##    ##     ## ##     ## ##     ## ##       ##
##        ##       ##    ##  ##    ##  ##  ##    ##    ##    ##       ##     ##    ##     ## ##     ## ##     ## ##       ##
##        ######## ##     ##  ######  ####  ######     ##    ######## ########     ##     ##  #######  ########  ######## ########

*******************************************************************************************************************************/

  var DB_MODELS = {
    DOCUMENT: 'DOCUMENT',
    COLUMNS: 'COLUMNS'
  };

  var DB_CONNECTORS = {
    SPREADSHEET: 'SPREADSHEET',
    JDBC: 'JDBC'
  };

  /**
   * Inspired by the Loopback → API https://apidocs.strongloop.com/loopback/#persistedmodel
   *
   * @param {string} _db
   * @param {string} idKey='id'
   */
  function PersistedModel(_db, idKey) {
    /**
     * /!\ Et si on change de spreadsheet ?
     * => supprimer la propriété lors de l'héritage du workbook
     *
     */
    this._db = _db || this.constructor.DB;
    this._index = -1;
    this[idKey || 'id'] = Utilities.getUuid();
  }

  PersistedModel.READ_ONLY = false;
  PersistedModel.DB_MODELS = DB_MODELS;
  PersistedModel.DB_CONNECTORS = DB_CONNECTORS;

  /**
   * @param {Object} obj
   * @return {PersistedModel} obj
   *
   */
  PersistedModel.deserialize = function(obj) {
    obj = _.parseIfNeeded(obj);
    return !obj ? null : Object.assign(new this(), obj);
  };

  /**
   *
   * @param {object} opt={}
   */
  PersistedModel.prototype.save = function(opt) {
    assert(PersistedModel.READ_ONLY == false, 'PersistedModel.WRITE_ALLOWED');

    opt = _.defaultTo(opt, {});
    assert.isDefined(this._db, 'db is defined in ' + this);

    this.validate();

    var tableName = opt.tableName || this.constructor.TABLE;
    assert.isDefined(tableName, 'tableName is defined');

    if ((opt.DB_MODEL || this.constructor.DB_MODEL) === DB_MODELS.COLUMNS) {
      return saveColumns.call(
        this,
        Object.assign(opt, { tableName: tableName })
      );
    }

    /**
     * Verrouille le script durant l'enregistrement avec time out de 10 secondes
     * Si n'arrive pas à obtenir le passage, lance une exception
     * @see https://developers.google.com/apps-script/reference/lock/lock#waitLock(Integer)
     *
     * @todo AUDIT
     */
    //  var lock = LockService.getScriptLock();
    //  lock.waitLock(LOCK_DELAY); // => peut provoquer une erreur serveur

    var ss = SpreadsheetApp.openById(this._db);
    var sheet = ss.getSheetByName(tableName);

    /**
     * /!\ IL Y A 2 CAS DE FIGURE
     * - l'index est égale à '-1' ce qui indique que le modèle n'a jamais été sauvé en BDD
     * - l'index est supérieur au nombre de lignes (+ 1) présentes dans la BDD, dans ce cas il faut ajuster l'index pour
     * ne pas créer de trou
     */
    var last_row_index = sheet.getLastRow();
    if (this._index > last_row_index || this._index === -1) {
      this._index = last_row_index;
    }

    sheet
      .getRange(parseInt(this._index) + 1, 1)
      .setValue(this.serialize ? this.serialize() : JSON.stringify(this));

    /**
     * /!\ Stack limit exceeded => lu.save qui provoque un lu.save qui provoque...
     * @todo AUDIT: quelle conséquences si lu.save faillit ??
     *
     */
    var lu;
    if (tableName != 'Flags') {
      lu = new LastUpdate(this._db, '' + this);
      try {
        lu.save();
      } catch (e) {
        mLogger.warn('LastUpdate save failure');
      }
    }

    return {
      lastUpdate: lu,
      instance: this,
      type: tableName
    };
  }; // PersistedModel.prototype.save

  /**
   * @see http://apidocs.strongloop.com/loopback-datasource-juggler/#validatable-prototype-isvalid
   *
   * @return {boolean} validate
   */
  PersistedModel.prototype.validate = function() {
    return this.constructor.SCHEMA.validate(this);
  };

  PersistedModel.SCHEMA = new Schema({
    id: { type: String },
    _index: { type: Number },
    _db: { type: String }
  });

  /**
   * @todo Replace the save function ??
   *
   *
   */
  function PersistedModel_save(object, tableName, DB_MODEL) {
    object = _.parseIfNeeded(object);

    DB_MODEL = DB_MODEL || DB_MODELS.DOCUMENT;

    return JSON.stringify(
      PersistedModel.deserialize(object).save({
        writeRight: true,
        tableName: tableName,
        DB_MODEL: DB_MODEL
      })
    );
  }

  /**
   *
   * @param {object}  query
   * @param {?SheetDescriptor} sheetDescriptor - May be defined in query
   *
   * @return {Array.<object>} v
   *
   */
  PersistedModel.findAll = function(
    query,
    sheetDescriptor,
    DB_MODEL,
    deserializer
  ) {
    sheetDescriptor = _.defaultTo(
      sheetDescriptor,
      new SheetDescriptor(this.DB, this.TABLE)
    );
    DB_MODEL = _.defaultTo(DB_MODEL, this.DB_MODEL);
    DB_MODEL = _.defaultTo(DB_MODEL, DB_MODELS.DOCUMENT);
    deserializer = _.defaultTo(deserializer, this.deserialize.bind(this));

    var sheet = sheetDescriptor.getSheet(),
      v = null;

    var items =
      DB_MODEL == DB_MODELS.DOCUMENT
        ? _.toObjArray(sheet)
        : _.arrayToSomething(sheet.getDataRange().getValues());

    items = items.map(deserializer);

    /**
     * BEFORE QUERY
     */
    items.forEach(function(it, index) {
      it._index = index;
    });

    items = query ? filter(items, query) : items;

    return items || [];
  }; // PersistedModel.findAll

  /**
   *
   * @return {Object}
   */
  PersistedModel.find = function(
    query,
    sheetDescriptor,
    DB_MODEL,
    deserializer
  ) {
    return this.findAll(query, sheetDescriptor, DB_MODEL, deserializer)[0];
  };

  /**
   *
   * @param {!number|string} index      - row index
   * @param {!SheetDescriptor} sheetDescriptor
   *
   * @return {string|number} v - valeur stockée dans une cellule de spreadsheet
   */
  PersistedModel.findByIndex = function(
    index,
    sheetDescriptor,
    DB_MODEL,
    deserializer
  ) {
    if (_.isObject(arguments[0])) {
      sheetDescriptor = arguments[0].sheetDescriptor;
      DB_MODEL = arguments[0].DB_MODEL;
      /* /!\ En dernier parce que arguments[0] est la même variable que index */
      index = arguments[0].index;
    }
    DB_MODEL = DB_MODEL || DB_MODELS.DOCUMENT;

    var sheet = sheetDescriptor.getSheet(),
      data = null;

    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      return undefined;
    }

    index = index === '$last' ? lastRow - 1 : index;

    if (DB_MODEL == DB_MODELS.COLUMNS) {
      var lastColumn = sheet.getLastColumn();
      var header = /*header*/ sheet
        .getRange(1, 1, 1, lastColumn)
        .getValues()[0];
      var row = sheet.getRange(index + 2, 1, 1, lastColumn).getValues()[0];
      data = _.arrayToSomething([header, row])[0];
    } else {
      data = JSON.parse(sheet.getRange(index + 1, 1).getValue());
    }

    return deserializer ? deserializer(data) : data;
  }; //PersistedModel.findByIndex

  /**
   * @this POJO
   *
   * @todo APPEND quand Index = -1 ou supérieur au nombre total de lignes
   */
  function saveColumns(opt) {
    var self = this;
    var serializedSelf = this.serialize ? this.serialize(false) : this;

    /**
     * object validation is done in PersistedModel.prototype.save
     *
     */

    var tableName = opt.tableName || this.constructor.TABLE;
    assert.isDefined(tableName, 'tableName is defined');

    var sheet = SpreadsheetApp.openById(this._db).getSheetByName(tableName);
    var data = sheet.getDataRange().getValues();

    var row = [];
    var header = data[0];
    header.forEach(function(key) {
      row.push(serializedSelf[key] === undefined ? '' : serializedSelf[key]);
    });

    var last_row_index = sheet.getLastRow();

    /**
     * Index est un index de type array (de 0 à n-1 pour n éléments)
     * Les lignes d'une spreadsheet sont indexées de 1 à n pour n éléments
     * Le header occupe toujours la première ligne donc
     * - last_row_index >= 1
     * - les lignes contenant de la donnée sont indexées de 2 à n+1 pour n éléments
     *
     * Il y aura un 'trou' dans la spreadsheet si
     */
    if (
      this._index == -1 ||
      parseInt(this._index) + 2 > parseInt(last_row_index) + 1
    ) {
      this._index = last_row_index - 1;
    }

    sheet
      .getRange(parseInt(this._index) + 2, 1, 1, row.length)
      .setValues([row]);

    return {
      instance: this,
      type: tableName
    };
  } //saveColumns

  PersistedModel.Builder = Builder;

  function Builder() {}

  Builder.prototype.setModelName = function(name) {
    this.modelName = name;
    return this;
  };
  Builder.prototype.setConnector = function(connector) {
    assert(~Object.values(DB_CONNECTORS).indexOf(connector));
    this.connector = connector;
    return this;
  };
  Builder.prototype.setDbType = function(type) {
    assert(~Object.values(DB_MODELS).indexOf(type));
    this.type = type;
    return this;
  };
  Builder.prototype.setDatabase = function(db) {
    this.db = db;
    return this;
  };
  Builder.prototype.setTable = function(table) {
    this.table = table;
    return this;
  };
  Builder.prototype.setSchema = function(schema) {
    assert(schema instanceof Object);
    this.schema = schema;
    return this;
  };

  // @todo
  Builder.prototype.setIdKey = function(idKey) {
    this.idKey = idKey;
    return this;
  };

  /**
   *
   *
   * @return {Function} ctor
   */
  Builder.prototype.build = function() {
    assert(this.modelName && this.connector && this.db);
    var ctor = function() {
      PersistedModel.call(this);
      if (this.constructor.SCHEMA) {
        Object.assign(this, this.constructor.SCHEMA.generate());
      }
    };
    ctor.DB_MODEL = this.type;
    ctor.DB = this.db;
    ctor.TABLE = this.table || this.modelName;
    ctor.CONNECTOR = this.connector;
    // @todo fusion avec PersistedModel.SCHEMA ??
    ctor.SCHEMA = new Schema(this.schema);
    _.inherit(ctor, PersistedModel);
    return ctor;
  };

  global.PersistedModel_findAll = function() {
    throw new Error('Not Implemented');
  };
  global.PersistedModel_find = function() {
    throw new Error('Not Implemented');
  };
  global.PersistedModel_findByIndex = function(index, sheetDescriptor) {
    return JSON.stringify(
      PersistedModel.findByIndex(
        index,
        Object.assign(new SheetDescriptor(), sheetDescriptor)
      )
    );
  };
  global.PersistedModel_findById = function() {
    throw new Error('Not Implemented');
  };

  function LastUpdate(db, what) {
    PersistedModel.call(this, db);
    this.date = new Date().toISOString();
    this.user = Session.getActiveUser().getEmail();
    this.what = what;
    this._index = 0;
  }

  _.inherit(LastUpdate, PersistedModel);
  LastUpdate.TABLE = 'Flags';
  LastUpdate.prototype.toString = function() {
    return 'LastUpdate[date=' + this.date + ']';
  };

  return PersistedModel;
} // persistedModelFactory
