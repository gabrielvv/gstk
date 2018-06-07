modulazer.module('gstk', ['gs']).factory('spyOn', function() {
  // https://jasmine.github.io/2.4/introduction.html#section-Spies

  /**
   *
   * @property {string} name
   * @property {Array} calls
   * @property {function} callFn
   * @property {number} count
   */
  function Spy(name, returnValue, fn) {
    var self = this;
    this.name = name;
    this.callThrough = false;
    this.calls = [];
    this.returnValue = returnValue;

    /**
     * @see spyOn
     * Will be called in the context of the spied object
     */
    this.callFn = function() {
      self.calls.push(arguments);
      return self.callThrough && fn
        ? fn.apply(this, arguments)
        : self.returnValue;
    };

    Object.defineProperty(this, 'count', {
      get: function() {
        return this.calls.length;
      }
    });
  }

  Spy.prototype.andCallThrough = function() {
    this.callThrough = true;
  };

  /**
   *
   * @property {Spy}      {spyId}
   * @property {number}   counter
   * @property {function} retrieveSpy
   *
   * @param {object} o
   * @param {string} functionName
   *
   */
  function spyOn(o, functionName, returnValue) {
    var $$spy = 'fn:' + spyOn.counter++;
    var spy = new Spy(functionName, returnValue, o[functionName].bind(o));
    o[functionName] = function() {
      return spy.callFn.apply(o, arguments);
    };
    spyOn[$$spy] = spy;
    o[functionName].$$spy = $$spy;

    return spy;
  }
  spyOn.counter = 0;

  /**
   * @param  {function} fn
   * @return {Spy} spy
   *
   */
  spyOn.retrieveSpy = function(fn) {
    return spyOn[fn.$$spy];
  };

  return spyOn;
});
