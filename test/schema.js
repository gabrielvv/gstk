function test_schema(){
  TestRunner(function(){
    describe("Schema", function(){

      it("validation throws when the object is not valid", function(){
        var mSchema = new Schema({
          id: {type: String},
        })
        assert.throw(mSchema.validate.bind(mSchema, {}), assert.AnyError);
      });

      it("works", function(){

        var mSchema = new Schema({
          id: {type: String},
        });

        assert.not.throw(mSchema.validate.bind(mSchema, {id: "foo"}), assert.AnyError);
        assert.throw(mSchema.validate.bind(mSchema, {id: 123}), assert.AnyError);
        assert.throw(mSchema.validate.bind(mSchema, {}), assert.AnyError);

        assert.not.throw(mSchema.validate.bind(mSchema, mSchema.generate()), assert.AnyError);
      });

      it("allows short definition", function(){
        var mSchema = new Schema({
          id: String,
        });

        assert.not.throw(mSchema.validate.bind(mSchema, {id: "foo"}), assert.AnyError);
        assert.throw(mSchema.validate.bind(mSchema, {id: 123}), assert.AnyError);

        assert.not.throw(mSchema.validate.bind(mSchema, mSchema.generate()), assert.AnyError);
      });

      it("allows schema fusion", function(){

        var mSchemaA = new Schema({
          id: String,
        });

        var mSchemaB = Schema.fusion(mSchemaA, {
          n: Number,
        });

        assert.equal(mSchemaB.keys(), ["n", "id"]);
        assert.not.throw(mSchemaB.validate.bind(mSchemaB, {id: "foo", n: 123}), assert.AnyError);
        assert.throw(mSchemaB.validate.bind(mSchemaB, {id: "foo"}), assert.AnyError); // => missing n
        assert.throw(mSchemaB.validate.bind(mSchemaB, {n: 123}), assert.AnyError); // => missing id

        assert.not.throw(mSchemaB.validate.bind(mSchemaB, mSchemaB.generate()), assert.AnyError);

      });

      it("allows schema fusion with black list", function(){

        var mSchemaA = new Schema({
          id: String,
        });

        var mSchemaB = Schema.fusion(mSchemaA, {
          n: Number,
          TestId: String
        }, {"id":"TestId"});

        assert.equal(mSchemaB.keys(), ["n", "TestId"]);
        assert.not.throw(mSchemaB.validate.bind(mSchemaB, {TestId: "foo", n: 123}), assert.AnyError);
        assert.throw(mSchemaB.validate.bind(mSchemaB, {n: 123}), assert.AnyError);

        assert.not.throw(mSchemaB.validate.bind(mSchemaB, mSchemaB.generate()), assert.AnyError);

      });
    });
  });
}
