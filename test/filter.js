function test_filter(){

  TestRunner(function(){
    describe("compare", function(){
      it("compares two values", function(){
        assert(!compare(null, 1))
        assert(!compare("foo", "bar"))
        assert(compare(null, null))
        assert(compare([1, "foo", false], [1, "foo", false]))
        assert(!compare([1, "foo", false], [1, "foo", true]))
      });

      it("try to find a in b when b is an Array", function(){
        assert(compare("foo", [1, "foo", false]))
        assert(!compare("bar", [1, "foo", false]))
      });
    });

    describe("get", function(){

      /**
      * Il y a 2 cas:
      * - query = {foo: "bar"} et on aimerait retourner les objets de type {foo: ["bar", "quux"]} → $in → {$in : {foo: "bar"}}
      * - query = {foo: ["bar", "quux"]} et on aimerait retourner les objets de type {foo: "bar"} ou {foo: "quux"} → $or → {foo : {$or: ["bar", "quux"]}}
      *
      * Le $in est le comportement par défaut de la fonction "compare" utilisée par "get"
      * compare(queryValue="foo", objValue=["foo", "bar"]) => true
      */
      describe("$in query operator" , function(){
        it("works", function(){
          var list = [ {coo: ["foo", "bar"]} ];
          var query = {coo:"foo"};
          var result = filter(list, query);
          assert(result.length === 1);
        });
      });

      /* @todo deep $any */
      describe("$any query operator", function(){
        xit("works for simple case", function(){

          var list = [{coo: 1, foo: 2, boo: "boo"}, {tar: null, bar: 2}, {quux: 3, buux: "lol"}];
          var query = {"$any": 2};
          var result = filter(list, query);
          assert(result.length === 2);
          assert(result[0].foo === 2);
          assert(result[1].bar === 2);
          assert(list.length === 3); // assert that there is no side effect on list

          var list = [{coo: 1, foo: 2, boo: "boo"}, {tar: null, bar: 2}, {quux: 2, buux: "lol"}];
          var query = {"$any": 2, buux: "lol"};
          var result = filter(list, query);

          assert(result.length === 1);
          assert(result[0].buux === "lol");
        });
      });// $any in query

      it("works for simple case", function(){
        var list = [{foo: 2}, {bar: 2}];
        var query = {"foo": 2};
        var result = filter(list, query);
        assert(result.length === 1);
        assert(result[0].foo === 2);

        var list = [{foo: 2}, {bar: 2}, {foo: 2}];
        var query = {"foo": 2};
        var result = filter(list, query);
        assert(result.length === 2);
      });

      it("works for query with several fields", function(){
        var list = [{foo: 2,bar: 3}, {foo: 2,bar: 4}];
        var query = {"foo": 2,"bar": 3};
        var result = filter(list, query);
        assert(result.length === 1);
        assert(result[0].foo === 2);
      });

      it("manages deep properties", function(){
        var list = [{foo: {bar: 2}}, {foo: {bar: 2}}];
        var query = {"foo.bar": 2};
        var result = filter(list, query);
        assert.equal(result.length, 2);
        assert.equal(result[0].foo.bar, 2);

        var list = [{foo: {bar: {quux: "lol"}}}];
        var query = {"foo.bar.quux": "lol"};
        var result = filter(list, query);
        assert.equal(result[0].foo.bar.quux, "lol");
      });

    });

    describe("$filter operator", function(){
      it("prefilters before querying", function(){
        var list = [
         {foo: {bar: 2}, quux:3},
         {foo: {bar: 2}, quux:4},
         {foo: {bar: 2}, quux:5},
         {foo: {bar: 2}, quux:6},
        ];
        var query = {
          "foo.bar": 2,
          "$filter": function(it){
            return it.quux > 4;
          }
        };
        var results = filter(list, query);
        assert.equal(results.length, 2);
      });
    });

    // @deprecated
    xdescribe("filter.findOne", function(){
      it("returns the first matching object", function(){
        var list = [{foo:2, bar:3}, {foo:2, bar:4}];
        var query = {foo: 2};
        var result = filter.findOne(list, query);
        assert.equal(result.bar, 3);
      });
    });

    describe("filter.findUnique", function(){
      it("returns a single matching object", function(){
        var list = [{foo:2, bar:3}, {foo:3, bar:4}];
        var query = {foo: 2};
        var result = filter.findUnique(list, query);
        assert.equal(result.bar, 3);
      });

      it("throws if not unique", function(){
        var list = [{foo:2, bar:3}, {foo:2, bar:4}];
        var query = {foo: 2};
        assert.throw(filter.findUnique.bind(this, list, query), assert.AnyError);
      });

      it("by default throws if there isnt any result", function(){
        var list = [{foo:4}, {foo:3}];
        var query = {foo: 2};
        assert.throw(filter.findUnique.bind(this, list, query), assert.AnyError);
      });
    });

  });//TestRunner
}

function test_filter(){

  TestRunner(function(){
    describe("get", function(){

      it("works for simple case", function(){
        var list = [{foo: 2}, {bar: 2}];
        var query = {"foo": 2};
        var result = filter(list, query);
        assert(result[0].foo === 2);

        var result = filter(list, {"quux": 2});
        assert(result.length === 0);

        var list = [{foo: 2}, {bar: 2}, {foo: 2}];
        var query = {"foo": 2};
        var result = filter(list, query);
        assert(result.length === 2);
      });

      it("manages deep properties", function(){
        var list = [{foo: {bar: 2}}];
        var query = {"foo.bar": 2};
        var result = filter(list, query);
        assert(result[0].foo.bar === 2);
      });

    });

    describe("or", function(){
      it("works", function(){
        var list = [{foo: 2}, {foo: 1}];
        var query = {"foo": [2,1]};
        var result = filter(list, query);
        assert(result.length === 2);
      });
    });

    describe("filter.findOne", function(){
      it("works for simple case", function(){
        var list = [{foo: 2}, {bar: 2}];
        var query = {"foo": 2};
        var result = filter.findOne(list, query);
        assert(result.foo === 2);

        var list = [{foo: 2}, {bar: 2}];
        var query = {"quux": 2};
        var result = filter.findOne(list, query);
        assert(!result);
      });
    });

    describe("filter.findIndex", function(){
      it("works for simple case", function(){
        var list = [{foo: "foo"}, {bar: "bar"}];
        var query = {"bar": "bar"};
        var index = filter.findIndex(list, query);
        assert(index === 1);

        var list = [{foo: 2}, {bar: 2}];
        var query = {"quux": 2};
        var index = filter.findIndex(list, query);
        assert(index === -1);
      });
    });
  });

}//test_get
