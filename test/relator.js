var TEST_SPREADHSEET_ID = 'PUT_YOUR_TEST_SPREADSHEET_ID_HERE';

function test_relator() {
  TestRunner(function() {
    describe('relator', function() {
      it('PersistedModel.hasMany', function() {
        function Arbre() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.getFeuillesFromConstruct = function() {
            return this.feuilles();
          };
        }
        Arbre.prototype.getFeuillesFromProto = function() {
          return this.feuilles();
        };
        Arbre.SHEET_NAME = 'Arbres';
        _.inherit(Arbre, PersistedModel);

        function Feuille() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.fid = Utilities.getUuid();
        }
        _.inherit(Feuille, PersistedModel);
        Feuille.SHEET_NAME = 'Feuilles';

        Arbre.hasMany(Feuille, { foreignKey: 'aid', relateTo: 'id' });
        assert.isDefined(Arbre.prototype.linkToFeuille);
        assert.isDefined(Arbre.prototype.feuilles);

        var db = {
          arbres: [new Arbre().save().instance],
          feuilles: [new Feuille().save().instance]
        };

        // 1 ------------------
        var f = db.feuilles[0],
          a = db.arbres[0];

        a.linkToFeuille(f);
        f.save();

        assert.isDefined(f.aid, 'foreignKey is defined');
        assert.equal(f.aid, a.id);
        assert.equal(a.getFeuillesFromProto().length, 1);
        assert.equal(a.getFeuillesFromConstruct().length, 1);
      });

      it('PersistedModel.hasManyCustom - scenario 1', function() {
        function Qrap() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
        }
        Qrap.SHEET_NAME = 'Qraps';
        _.inherit(Qrap, PersistedModel);

        function TestIntoPart() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.PartId = Utilities.getUuid();
          this.TestId = Utilities.getUuid();
        }
        TestIntoPart.SHEET_NAME = 'Parts';
        _.inherit(TestIntoPart, PersistedModel);

        TestIntoPart.hasManyCustom(Qrap, {
          compositeKey: {
            PartId: { multiple: true },
            TestId: { single: true }
          }
        });

        var db = {
          qraps: [new Qrap().save().instance],
          testintoparts: [new TestIntoPart().save().instance]
        };

        var tip = db.testintoparts[0],
          q = db.qraps[0];
        tip.linkToQrap(q);
        q.save();
        assert(q.PartId instanceof Array);
        assert('string' == typeof q.TestId);
        assert.equal(tip.qraps()[0], q);
      });

      it('PersistedModel.hasManyCustom - scenario 2', function() {
        function Leg() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
        }
        Leg.SHEET_NAME = 'Legs';
        _.inherit(Leg, PersistedModel);

        function Project() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.workbookId = Utilities.getUuid();
        }
        Project.SHEET_NAME = 'Projects';
        _.inherit(Project, PersistedModel);

        Project.hasManyCustom(Leg, {
          compositeKey: {
            workbookId: { single: true },
            _db: {
              single: true,
              relateTo: 'workbookId'
            }
          },
          setterOnly: true
        });

        var p = new Project(),
          l = new Leg();
        assert.isDefined(p.linkToLeg);
        assert.not.isDefined(p.legs);
        p.linkToLeg(l);
        assert.equal(l.workbookId, p.workbookId);
        assert.equal(l._db, p.workbookId);
      });

      it('PersistedModel.belongsTo - scenario 1', function() {
        function Arbre() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.aid = Utilities.getUuid();
        }
        Arbre.SHEET_NAME = 'Arbres';
        _.inherit(Arbre, PersistedModel);

        function Feuille() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.fid = Utilities.getUuid();
        }
        _.inherit(Feuille, PersistedModel);
        Feuille.SHEET_NAME = 'Feuilles';

        Arbre.hasMany(Feuille, { foreignKey: 'aid' });
        assert.isDefined(Arbre.prototype.linkToFeuille);
        assert.isDefined(Arbre.prototype.feuilles);

        assert.isDefined(Feuille.belongsTo);
        Feuille.belongsTo(Arbre, { foreignKey: 'aid' });
        assert.isDefined(Feuille.prototype.linkToArbre);
        assert.isDefined(Feuille.prototype.belongsToArbre);
        assert.isDefined(Feuille.prototype.arbre);

        var db = {
          arbres: [new Arbre().save().instance],
          feuilles: [new Feuille().save().instance]
        };

        // 1 ------------------
        var f = db.feuilles[0],
          a = db.arbres[0];
        assert.isDefined(f.linkToArbre);
        assert.isDefined(f.arbre);

        f.linkToArbre(a);
        f.linkToArbre(a);
        f.linkToArbre(a);
        a.save();
        var arbre = f.arbre();
        assert.equal(arbre, a);
        assert(f.belongsToArbre(a) == true);

        // 2 ------------------
        db.feuilles.push(new Feuille());
        db.feuilles.push(new Feuille());
        [1, 2].forEach(function(i) {
          var _f = db.feuilles[i];
          _f.linkToArbre(a);
          a.save();
          var arbre = _f.arbre();
          assert.equal(arbre, a);
        });

        var arbre = f.arbre();
        assert.equal(arbre, a);

        // 3 ------------------
        a.linkToFeuille(f);
        a.linkToFeuille(f);
        a.linkToFeuille(f);
        f.save();
        var feuilles = a.feuilles();
        assert.equal(feuilles[0], f);

        // 4 ------------------
        db.feuilles.push(new Feuille());
        db.feuilles.push(new Feuille());
        [1, 2].forEach(function(i) {
          var _f = db.feuilles[i];
          a.linkToFeuille(_f);
          _f.save();
        });

        assert.equal(a.feuilles().length, 3);
      });

      it('PersistedModel.belongsTo - scenario 2', function() {
        function Arbre() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.aid = Utilities.getUuid();
        }
        Arbre.SHEET_NAME = 'Arbres';
        _.inherit(Arbre, PersistedModel);

        function Feuille() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.fid = Utilities.getUuid();
        }
        _.inherit(Feuille, PersistedModel);
        Feuille.SHEET_NAME = 'Feuilles';

        Feuille.belongsTo(Arbre, { foreignKey: 'aid', relateTo: 'id' });

        var f = new Feuille().save().instance,
          a = new Arbre().save().instance;
        f.linkToArbre(a);
        assert.equal(f.aid, a.id);
        f.save();
        var arbre = f.arbre();
        assert.equal(arbre, a);
      });

      it('relation query caching - MANY TO ONE', function() {
        spyOn(PersistedModel, 'find').andCallThrough();

        function Arbre() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
        }
        Arbre.SHEET_NAME = 'Arbres';
        _.inherit(Arbre, PersistedModel);

        function Feuille() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.fid = Utilities.getUuid();
        }
        _.inherit(Feuille, PersistedModel);
        Feuille.SHEET_NAME = 'Feuilles';

        Feuille.belongsTo(Arbre, { foreignKey: 'aid', relateTo: 'id' });

        /**
         * Many To One
         *
         */

        var f = new Feuille().save().instance,
          a = new Arbre();
        f.linkToArbre(a);
        a.save();

        f.arbre('fromCache');
        f.arbre('fromCache');
        f.arbre('fromCache');
        var _a = f.arbre('fromCache');
        assert.equal(a, _a);
        assert.hasBeenCalledTimes(PersistedModel.find, 1);

        /* is faster from cache */
        var f = new Feuille().save().instance,
          a = new Arbre();
        f.linkToArbre(a);
        a.save();

        timerStart();
        f.arbre('fromCache');
        var t1 = timerEnd();
        timerStart();
        f.arbre('fromCache');
        var t2 = timerEnd();
        Logger.log('time to fetch from DB=%s', t1);
        Logger.log('time to fetch from cache=%s', t2);
        /**
         * /!\ Fortes variations s'il y a des appels à "mLogger" en chemin
         *
         */
        assert(t1 > t2 + 100);
      });

      it('relation query caching - MANY TO ONE', function() {
        spyOn(PersistedModel, 'findAll').andCallThrough();

        function Arbre() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
        }
        Arbre.SHEET_NAME = 'Arbres';
        _.inherit(Arbre, PersistedModel);

        function Feuille() {
          PersistedModel.call(this, TEST_SPREADHSEET_ID);
          this.fid = Utilities.getUuid();
        }
        _.inherit(Feuille, PersistedModel);
        Feuille.SHEET_NAME = 'Feuilles';

        Arbre.hasMany(Feuille, { foreignKey: 'id' });

        var a = new Arbre().save().instance;
        var feuilles = [0, 1, 2].map(function() {
          var f = new Feuille();
          a.linkToFeuille(f);
          return f.save().instance;
        });

        a.feuilles('fromCache');
        a.feuilles('fromCache');
        a.feuilles('fromCache');
        var _feuilles = a.feuilles('fromCache');
        assert.equal(feuilles, _feuilles);
        assert.hasBeenCalledTimes(PersistedModel.findAll, 1);

        /* is faster from cache */
        var a = new Arbre().save().instance;
        var feuilles = [0, 1, 2].map(function() {
          var f = new Feuille();
          a.linkToFeuille(f);
          return f.save().instance;
        });

        timerStart();
        a.feuilles('fromCache');
        var t1 = timerEnd();
        timerStart();
        a.feuilles('fromCache');
        var t2 = timerEnd();
        Logger.log('time to fetch from DB=%s', t1);
        Logger.log('time to fetch from cache=%s', t2);
        /**
         * /!\ Fortes variations s'il y a des appels à "mLogger" en chemin
         *
         */
        assert(t1 > t2 + 100);
      });
    });
  });
}
