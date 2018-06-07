/** test framework façon mochajs */

modularize.module('gstk', ['gs']).factory('TestRunner', function(global, _) {
  var MODE = {
    NORMAL: 'NORMAL',
    INHIBIT: 'INHIBIT',
    FOCUS: 'FOCUS'
  };

  /**
   *
   * @property {array.<Descriptor>} describe
   * @property {array.<Report>}     reports
   *
   *
   * @param {function} register
   */
  function TestRunner(register) {
    // @see https://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
    var BreakException = {};

    Logger.log(
      '\n------------------------------------------------- TEST FRAMEWORK START ---------------------------------------------\n'
    );
    TestRunner.descriptors = [];
    TestRunner.mode = MODE.NORMAL;
    var reports = [];
    register();

    try {
      TestRunner.descriptors.forEach(function(d) {
        var itArray = d.it;

        // TestRunner.focus is set by a call to fdescribe or fit
        if (TestRunner.mode == MODE.FOCUS && d.mode != MODE.FOCUS) {
          d.mode = MODE.INHIBIT;
        }

        if (
          d.mode == MODE.INHIBIT &&
          itArray.every(function(it) {
            return it.mode != MODE.FOCUS;
          })
        ) {
          Logger.log('SKIP - %s', d.text);
          return;
        }

        Logger.log('%s', d.text);

        try {
          d.beforeAll && d.beforeAll();
        } catch (e) {
          reports.push(new Report('beforeAll failure', e));
          throw BreakException;
        }

        itArray.forEach(function(itter) {
          //Logger.log("%s %s", d.mode, itter.mode);

          /**
           * S'il y a FOCUS
           * le "it" doit avoir un parent "fdescribe" ou être "fit" pour être exécuté
           */
          if (TestRunner.mode == MODE.FOCUS) {
            if (d.mode != MODE.FOCUS && itter.mode != MODE.FOCUS) {
              itter.mode = MODE.INHIBIT;
            }
          }

          if (itter.mode == MODE.INHIBIT) {
            Logger.log('\t\u2749\t\t' + itter.text); //star
            return;
          }

          try {
            d.beforeEach && d.beforeEach();
          } catch (e) {
            reports.push(new Report('beforeEach failure', e));
            throw BreakException;
          }

          try {
            itter.cb();
          } catch (e) {
            Logger.log('\t\u2718\t\t' + itter.text); //cross
            reports.push(new Report(itter.text, e));
            return;
          }

          Logger.log('\t\u2714\t\t' + itter.text); //check

          try {
            d.afterEach && d.afterEach();
          } catch (e) {
            reports.push(new Report('afterEach failure', e));
            throw BreakException;
          }
        }); //forEach in itArray

        try {
          d.afterAll && d.afterAll();
        } catch (e) {
          reports.push(new Report('afterAll failure', e));
          throw BreakException;
        }
      }); //forEach TestRunner.descriptor
    } catch (e) {
      if (e !== BreakException) {
        throw e;
      }
    }

    reports.forEach(function(entry, i) {
      /** i est une string, donc i === 0 donnerait false */
      if (i == 0) {
        Logger.log(
          '\n------------------------------------------------- ERROR REPORT ----------------------------------------------------\n'
        );
      }
      Logger.log('%s\t\t%s', entry.text, entry.e.message + entry.e.stack);
    });
    Logger.log(
      '\n------------------------------------------------- TEST FRAMEWORK END ------------------------------------------------\n'
    );
  }

  /**
   * @todo Super Object with text, focus, inhibit...
   *
   * @param {string} text
   * @param {str} mode=MODE.NORMAL
   *
   * @property {string} text
   * @property {array.<Itter>}  it
   * @property {array.<Itter>}  xit
   * @property {boolean} inhibit=false
   * @property {boolean} focus=false
   */
  function Descriptor(text, mode) {
    this.text = text;
    this.it = [];
    this.xit = [];

    this.id = Utilities.getUuid();

    this.beforeAll = null;
    this.beforeEach = null;
    this.afterEach = null;
    this.afterAll = null;

    this.mode = _.defaultTo(mode, MODE.NORMAL);
  }

  /**
   * @todo Super Object with text, focus, inhibit...
   *
   * @property {string}  text
   * @property {function}cb
   * @property {MODE} mode=MODE.NORMAL
   *
   */
  function Itter(text, cb, mode) {
    this.text = text;
    this.cb = cb;
    this.mode = _.defaultTo(mode, MODE.NORMAL);
    this.id = Utilities.getUuid();
  }

  /**
   *
   * @property {string} text
   * @property {Error}  e
   *
   */
  function Report(text, e) {
    this.text = text;
    this.e = e;
    this.id = Utilities.getUuid();
  }

  /**
   *
   * @param {string} text
   * @param {function} cb
   *
   */
  function describe(text, cb) {
    TestRunner.descriptors = TestRunner.descriptors || [];
    TestRunner.descriptors.push(new Descriptor(text));
    cb();
  }

  /**
   *
   * @param {string} text
   * @param {function} cb
   *
   */
  function xdescribe(text, cb) {
    TestRunner.descriptors = TestRunner.descriptors || [];
    TestRunner.descriptors.push(new Descriptor(text, MODE.INHIBIT));
    cb();
  }

  /**
   *
   * @param {string} text
   * @param {function} cb
   *
   */
  function fdescribe(text, cb) {
    TestRunner.mode = MODE.FOCUS;
    TestRunner.descriptors = TestRunner.descriptors || [];
    TestRunner.descriptors.push(new Descriptor(text, MODE.FOCUS));
    cb();
  }

  /**
   *
   * @param {string} text
   * @param {function} cb
   *
   */
  function it(text, cb) {
    var l = TestRunner.descriptors.length;
    TestRunner.descriptors[l - 1].it.push(new Itter(text, cb));
  }

  function fit(text, cb) {
    var l = TestRunner.descriptors.length;
    var desc = TestRunner.descriptors[l - 1];
    desc.it.push(new Itter(text, cb, MODE.FOCUS));
    TestRunner.mode = MODE.FOCUS;
  }

  function xit(text, cb) {
    var l = TestRunner.descriptors.length;
    TestRunner.descriptors[l - 1].it.push(new Itter(text, cb, MODE.INHIBIT));
  }

  ['afterAll', 'afterEach', 'beforeAll', 'beforeEach'].forEach(function(name) {
    this[name] = function(fn) {
      var l = TestRunner.descriptors.length;
      TestRunner.descriptors[l - 1][name] = fn;
    };
  });

  global.TestRunner = TestRunner;
  global.describe = describe;
  global.xdescribe = xdescribe;
  global.fdescribe = fdescribe;
  global.it = it;
  global.xit = xit;
  global.fit = fit;
});
