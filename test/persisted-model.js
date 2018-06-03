var TEST_SPREADHSEET_ID = "PUT_YOUR_TEST_SPREADSHEET_ID_HERE";

function test_persisted_model(){

  TestRunner(function(){
    fdescribe("inherit", function(){

      it("A inherits from B's prototype", function(){
        function A(){
          this.lol = "lol";
        }

        function B(){
        }

        B.prototype.foo = function(){ return "bar"; }

        _.inherit(A, B);

        var instance = new A();
        assert(!!instance.foo);
        assert(instance.foo() === "bar");
        assert(instance.lol === "lol");
      });

      it("inheritance of PersistedModel binds a default deserializer", function(){

        function Arbre(){
        }
        _.inherit(Arbre, PersistedModel)
        assert.isDefined(Arbre.deserialize);
        var a = Arbre.deserialize({});
        assert(a instanceof Arbre, "a instanceof Arbre");
        assert(Arbre.deserialize.call(Arbre, {}) instanceof Arbre);
      });

    });

    describe("PersistedModel", function(){

      beforeEach(function(){
        var sp = SpreadsheetApp.openById(TEST_SPREADHSEET_ID);
        ["Arbres", "Parts", "Tests", "Feuilles", "Qraps"/*, "Users"*/].forEach(function(sheetName){
          var sh = sp.getSheetByName(sheetName);
          if(!sh){
            sp.insertSheet(sheetName);
          }else{
            sh.clear();
          }
        });
      });

      it("PersistedModel.deserialize returns a PersistedModel", function(){
        var p = PersistedModel.deserialize({});
        assert(p instanceof PersistedModel, "instanceof PersistedModel");

        var deserializer = PersistedModel.deserialize.bind(String);
        var str = deserializer({});
        assert(str instanceof String, "str instanceof String")
      });

      it("allows to define a custom uid", function(){
        function Arbre(){
          PersistedModel.call(this, /*_db*/"lol", "aid");
        }
        var a = new Arbre();
        assert.isDefined(a.aid);
      });

      // https://developers.google.com/apps-script/reference/spreadsheet/sheet#getlastrow
      it("appendRow == getRange(1,1).setValue() when lastRow=0", function(){
        var sd = new SheetDescriptor(TEST_SPREADHSEET_ID, "Tests");

        function Test(){
          this.TestId = Utilities.getUuid();
          PersistedModel.call(this, Test.DB, "TestId");
        }
        _.inherit(Test, PersistedModel);
        Test.DB = TEST_SPREADHSEET_ID;
        Test.SHEET_NAME = "Tests";

        sd.getSheet().clear();
        var t1 = new Test();
        assert.equal(sd.getSheet().getLastRow(), 0);
        sd.getSheet().getRange(1,1).setValue( JSON.stringify(t1) );
        assert.equal(PersistedModel.findByIndex(0, sd).TestId, t1.TestId);

        sd.getSheet().clear();
        var t2 = new Test();
        assert.not.equal(t1.TestId, t2.TestId);
        assert.equal(sd.getSheet().getLastRow(), 0);
        sd.getSheet().appendRow( [ JSON.stringify(t2) ] );
        assert.equal(PersistedModel.findByIndex(0, sd).TestId, t2.TestId);

      });

      it("PersistedModel_save DB_MODELS.COLUMNS", function(){
         var Email = "foo@bar.com";

        var obj = {
          _db: TEST_SPREADHSEET_ID,
          Index: -1,
          Email: Email,
        }
        var obj = PersistedModel_save(obj, "Users", DB_MODELS.COLUMNS);
        obj = JSON.parse(obj).instance;
        assert(obj.Index >= 0, "obj.Index >= 0");

        var users = PersistedModel.findAll({Index: obj.Index}, new SheetDescriptor(TEST_SPREADHSEET_ID, "Users"), DB_MODELS.COLUMNS);
        assert.equal(users.length, 1);
        assert.equal(users[0].Email, Email);
        assert.equal(users[0].Index, obj.Index);

      });

      it("PersistedModel_save DB_MODELS.JSON (default behaviour)", function(){

        var obj = {
          _db: TEST_SPREADHSEET_ID,
          Index: -1,
          bar: "foo",
        }
        var obj = PersistedModel_save(obj, "Tests", DB_MODELS.JSON);
        obj = JSON.parse(obj).instance;
        assert(obj.Index >= 0, "obj.Index >= 0");
        var tests = PersistedModel.findAll({Index: obj.Index}, new SheetDescriptor(TEST_SPREADHSEET_ID, "Tests"), DB_MODELS.JSON);
        assert.equal(tests.length, 1);
        assert.equal(tests[0].bar, "foo");
        assert.equal(tests[0].Index, obj.Index);
      });

      it("PersistedModel_bulkSave", function(){
        throw new Error("Not implemented");
      });

      it("PersistedModel.findAll", function(){
        var query = {
          $filter: function(it){
            return true;
          }
        }
        var deserializer = function(it){
          it.foo = "bar";
          return it;
        }
        var users = PersistedModel.findAll(query, new SheetDescriptor(TEST_SPREADHSEET_ID, "Users"), DB_MODELS.COLUMNS, deserializer);
        assert(users.length > 0, "There are at least 1 User");
        assert(users.every(function(u){ return u.foo == "bar"; }));
      });

      it("PersistedModel.find", function(){
        throw new Error("Not Implemented");
      });

      it("PersistedModel.findByIndex with '$last' index", function(){

        var sd = new SheetDescriptor(TEST_SPREADHSEET_ID, "Tests");

        /** 1 - THERE ARE OBJECTS IN DB */
        var obj = {
          _db: TEST_SPREADHSEET_ID,
          Index: -1,
          bar: "foo",
        };
        var obj = PersistedModel_save(obj, "Tests", DB_MODELS.JSON);
        obj = JSON.parse(obj).instance;

        var last = PersistedModel.findByIndex("$last", sd, DB_MODELS.JSON);
//        Logger.log("Index="+obj.Index);
        assert.equal(last.Index, obj.Index);

        /** 2 - THERE AREN'T ANY OBJECTS IN DB */
        sd.getSheet().clear();

        var last = PersistedModel.findByIndex("$last",sd, DB_MODELS.JSON);
        assert(!last, "last is undefined");
        assert(!_.parse("Name")(last), "last is undefined");
      });

      it("PersistedModel.findByIndex DB_MODELS.JSON (default behaviour)", function(){
        var o = new PersistedModel(TEST_SPREADHSEET_ID);
        o.Index = 0;
        o.foo = "bar";
        o.save({sheetName: "Tests"});
        /************/
        var t = PersistedModel.findByIndex(0, new SheetDescriptor(TEST_SPREADHSEET_ID, "Tests"), DB_MODELS.JSON)
        assert.equal(t.foo, "bar");
      });

      it("PersistedModel.findByIndex DB_MODELS.COLUMNS", function(){
        var o = new PersistedModel(TEST_SPREADHSEET_ID);
        o.Index = 0;
        o.foo = "bar";
        o.save({sheetName: "Tests"});
        /************/
        var u = PersistedModel.findByIndex(0, new SheetDescriptor(TEST_SPREADHSEET_ID, "Users"), DB_MODELS.COLUMNS)
        assert.equal(u.Email, "antoine.bach@valeo.com");
      });

      it("PersistedModel.prototype.validate", function(){
        var o = new PersistedModel(TEST_SPREADHSEET_ID);
        assert.not.throw(function(){ o.save({sheetName: "Tests"}); }, assert.AnyError)

        delete o.id;
        assert.throw(function(){ o.save({sheetName:  "Tests"}); }, assert.AnyError)
      });

    });
  });
}
