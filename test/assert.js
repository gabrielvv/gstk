function test_assert() {
  TestRunner(function() {
    describe('assert', function() {
      it('assert', function() {
        assert.throw(assert.bind(this, 'foo' === 'bar'), 'AssertError');
        assert.not.throw(assert.bind(this, 'quux' === 'quux'), 'AssertError');
      });

      it('assert.not', function() {
        assert.not.throw(assert.not.bind(this, 'foo' === 'bar'), 'AssertError');
        assert.throw(assert.not.bind(this, 'quux' === 'quux'), 'AssertError');
      });

      it('assert.isArray', function() {
        assert.not.throw(assert.isArray.bind(this, []), 'AssertError');
        ['lol', null, undefined, function() {}, 123, false].forEach(function(
          value
        ) {
          assert.throw(assert.isArray.bind(this, value), 'AssertError');
        });
      });

      it('assert.isFunction', function() {
        assert.not.throw(
          assert.isFunction.bind(this, function() {}),
          'AssertError'
        );
        assert.throw(assert.isFunction.bind(this, 'lol'), 'AssertError');
      });

      it('assert.isDefined', function() {
        assert.not.throw(assert.isDefined.bind(this, null), 'AssertError');
        assert.throw(assert.isDefined.bind(this, undefined), 'AssertError');

        assert.throw(assert.not.isDefined.bind(this, 'foo'), 'AssertError');
      });

      it('assert.isObject', function() {
        assert.not.throw(assert.isObject.bind(this, {}), 'AssertError');
        assert.throw(assert.isObject.bind(this, 'lol'), 'AssertError');
      });

      it('assert.equal', function() {
        assert.throw(
          assert.equal.bind(this, { a: 'a' }, { a: 'b' }),
          'AssertError'
        );
        assert.not.throw(
          assert.equal.bind(this, { a: 'a' }, { a: 'a' }),
          'AssertError'
        );
      });

      it('assert.throw', function() {
        assert.throw(assert.throw.bind(this, function() {}), 'AssertError');
        assert.not.throw(
          assert.throw.bind(this, function() {
            throw 'UTestError';
          }),
          'AssertError'
        );
      });
    });
  });
} //test_assert
