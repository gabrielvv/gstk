/**
 * @summary Assertion suits
 * @description
 * Les librairies de tests comme chai.js sont écrites pour Node.js ou le browser
 * Elles sont difficilement adaptables en Google Script
 *
 * @property {function} equal
 * @property {function} isDefined
 * @property {function} isFunction
 * @property {function}
 *
 * @see {@link http://chaijs.com/api/assert/ chai assert suits}
 */
modularize.module('gstk', ['gs']).factory('assert', [
  'Logger',
  'spyOn',
  '_',
  function assertFactory(Logger, spyOn, _) {
    var assert = function(condition, message) {
      if (!condition) {
        throw _.myNewError('AssertError', 'Assertion failed :' + message);
      }
      return condition;
    };

    assert.AnyError = 'ANY';

    /**
     * @desc
     * Check DEEP equality
     * Compare two variables and test their equality
     * Print a message if it fails
     *
     * @param {anything} actual
     * @param {anything} expected
     * @param {anything} message  The message describing the assertion if it fails
     */
    assert.equal = function(actual, expected, message, log) {
      var b;
      if (actual === expected) {
        b = true;
      }

      if (typeof actual !== typeof expected) {
        b = false;
      }

      if (actual !== expected) {
        b = false;
      }

      if (
        'object' === typeof actual &&
        actual !== null &&
        ('object' === typeof expected && actual !== null)
      ) {
        if (log) {
          Logger.log(
            '\t------------------------------------------------------'
          );
          Logger.log('\t' + actual);
          Logger.log('\t' + expected);
        }
        if (actual.length == expected.length) {
          /** ATTENTION: typeof null == object */
          var keys = Object.keys(actual);
          var l = keys.length;

          for (var i = 0; i < l; i++) {
            var key = keys[i];
            if (!assert.equal(actual[key], expected[key])) {
              i--;
              break;
            } /** foireux */
          }
          b = i === l ? true : false;
        } else {
          b = false;
        }
      }

      if (!b) {
        throw _.myNewError(
          'AssertError',
          '\tAssertion failed :' +
            (message || actual + '' + ' === ' + (expected + ''))
        );
      }
      return b;
    };

    assert.isDefined = function(actual, message) {
      var b = actual !== undefined;
      if (!b) {
        throw _.myNewError(
          'AssertError',
          '\tAssertion failed :' + (message || actual + ' undefined')
        );
      }
    };

    assert.isFunction = function(actual, message) {
      var b = 'function' === typeof actual;
      if (!b) {
        throw _.myNewError(
          'AssertError',
          message || '\tAssertion failed :' + actual + ' is a function'
        );
      }
    };

    assert.isObject = function(actual, message) {
      var b = 'object' === typeof actual && !!actual;
      if (!b) {
        throw _.myNewError(
          'AssertError',
          message || '\tAssertion failed :' + actual + ' is an object'
        );
      }
    };

    assert.isArray = function(actual, message) {
      var b = Array.isArray(actual);
      if (!b) {
        throw _.myNewError(
          'AssertError',
          message || '\tAssertion failed :' + actual + ' is an array'
        );
      }
    };

    assert.throw = function(fn, errorName, args) {
      var b, err, fnResult;

      try {
        fnResult = fn.apply(null, args);
      } catch (e) {
        err = e;
        b = errorName == assert.AnyError || err.name === errorName;
      }

      if (!b || !err) {
        throw _.myNewError(
          'AssertError',
          '\tAssertion failed :' + fn + ' does not throw ' + errorName,
          {
            returnValue: fnResult,
            message: null
          }
        );
      }

      return {
        returnValue: fnResult,
        message: err.name + ' thrown'
      };
    };

    //https://jasmine.github.io/2.4/introduction.html#section-Spies
    assert.hasBeenCalled = function(fn) {
      var spy = {};
      try {
        spy = spyOn.retrieveSpy(fn);
      } catch (e) {
        //      Logger.log("InternalError");
        assert(!e, 'InternalError');
      }
      assert(spy.count > 0, spy.name + ' HasBeenCalled');
    };

    assert.hasBeenCalledTimes = function(fn, times) {
      var spy = {};
      try {
        spy = spyOn.retrieveSpy(fn);
      } catch (e) {
        assert(!e, 'InternalError');
      }
      assert(
        spy.count == times,
        spy.name +
          ' HasBeenCalledTimes(' +
          times +
          ') +(' +
          spy.count +
          ' counted)'
      );
    };

    /************************* ASSERT.NOT toutes les variantes doivent être déclarées AVANT ***************/

    /**
     *
     * @desc Contraire de assert: lève une exception qd assert ne lève pas d'exception
     *
     */
    assert.not = function(condition, message) {
      var err;
      try {
        assert.apply(null, arguments);
      } catch (e) {
        err = e;
      }

      if (!err) {
        throw _.myNewError('AssertError', 'Assertion failed :' + message);
      }
      if (err.message.indexOf('InternalError') >= 0) {
        throw _.myNewError('AssertError', 'Assertion failed :' + err.message);
      }
    };

    /**
     * Déclaration de toutes les variantes de "assert.not"
     *
     *
     */
    for (var key in assert) {
      if (['not', 'AnyError'].indexOf(key) >= 0) {
        continue;
      }
      var fn = assert[key];
      assert.not[key] = notFactory(fn, key);
    } //for key

    /**
     * @param {function} fn
     *
     */
    function notFactory(fn, name) {
      return function() {
        var err, data;
        try {
          data = fn.apply(
            null /* dans ce cas, revient au même avec 'global' */,
            arguments
          );
        } catch (e) {
          err = e;
          if (err.message.indexOf('InternalError') >= 0) {
            throw _.myNewError(
              'AssertError',
              'Assertion failed :' + err.message
            );
          }
          return err.data;
        }

        if (!err) {
          throw _.myNewError(
            'AssertError',
            'Assertion failed : not.' +
              name +
              (name == 'throw' ? ' - ' + data.message : '')
          );
        }
        return data;
      };
    } //notFactory

    return assert;
  }
]);
