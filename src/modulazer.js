var logger =
  (window && window.console.log) || (Logger && Logger.log) || function() {};

var utilities = Utilities || {
  getUuid: function() {
    throw 'TODO';
  }
};

var annotate = (function() {
  'use strict';

  var isFunction = function(f) {
    return 'function' === typeof f;
  };
  var forEach = function(arr, fn) {
    return Array.prototype.forEach.call(arr, fn);
  };
  var isArray = function(a) {
    return a instanceof Array;
  };
  var isString = function(s) {
    return 'string' === typeof s;
  };
  /**
   * @see https://github.com/angular/angular.js/blob/master/src/Angular.js
   * throw error if the argument is falsy.
   */
  function assertArg(arg, name, reason) {
    if (!arg) {
      throw new Error(
        'areq',
        'Argument "{0}" is {1}',
        name || '?',
        reason || 'required'
      );
    }
    return arg;
  }

  function assertArgFn(arg, name, acceptArrayAnnotation) {
    if (acceptArrayAnnotation && isArray(arg)) {
      arg = arg[arg.length - 1];
    }

    assertArg(
      isFunction(arg),
      name,
      'not a function, got ' +
        (arg && typeof arg === 'object'
          ? arg.constructor.name || 'Object'
          : typeof arg)
    );
    return arg;
  }

  var ARROW_ARG = /^([^(]+?)=>/;
  var FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
  var minErr = function(name) {
    return function() {
      throw new Error(name + ' : ' + arguments);
    };
  };
  var $injectorMinErr = minErr('$injector');

  function extractArgs(fn) {
    var fnText = Function.prototype.toString
        .call(fn)
        .replace(STRIP_COMMENTS, ''),
      args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
    return args;
  }

  function anonFn(fn) {
    // For anonymous functions, showing at the very least the function signature can help in
    // debugging.
    var args = extractArgs(fn);
    if (args) {
      return 'function(' + (args[1] || '').replace(/[\s\r\n]+/, ' ') + ')';
    }
    return 'fn';
  }

  function annotate(fn, strictDi, name) {
    var $inject, argDecl, last;

    if (typeof fn === 'function') {
      if (!($inject = fn.$inject)) {
        $inject = [];
        if (fn.length) {
          if (strictDi) {
            if (!isString(name) || !name) {
              name = fn.name || anonFn(fn);
            }
            throw $injectorMinErr(
              'strictdi',
              '{0} is not using explicit annotation and cannot be invoked in strict mode',
              name
            );
          }
          argDecl = extractArgs(fn);
          forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg) {
            arg.replace(FN_ARG, function(all, underscore, name) {
              $inject.push(name);
            });
          });
        }
        fn.$inject = $inject;
      }
    } else if (isArray(fn)) {
      last = fn.length - 1;
      assertArgFn(fn[last], 'fn');
      $inject = fn.slice(0, last);
    } else {
      assertArgFn(fn, 'fn', true);
    }
    return $inject;
  }

  return annotate;
})();

/**
 * @see http://blog.benoitvallon.com/data-structures-in-javascript/the-graph-data-structure/
 *
 *
 */
var Graph = (function(logger) {
  'use strict';

  function Graph() {
    this.vertices = [];
    this.edges = [];
    this.numberOfEdges = 0;
  }

  Graph.prototype.addVertex = function(vertex) {
    if (!~this.vertices.indexOf(vertex)) {
      this.vertices.push(vertex);
      this.edges[vertex] = [];
    }
  };
  Graph.prototype.removeVertex = function(vertex) {
    var index = this.vertices.indexOf(vertex);
    if (~index) {
      this.vertices.splice(index, 1);
    }
    while (this.edges[vertex].length) {
      var adjacentVertex = this.edges[vertex].pop();
      this.removeEdge(adjacentVertex, vertex);
    }
  };
  Graph.prototype.addEdge = function(vertex1, vertex2) {
    this.edges[vertex1].push(vertex2);
    //this.edges[vertex2].push(vertex1);
    this.numberOfEdges++;
  };
  Graph.prototype.removeEdge = function(vertex1, vertex2) {
    var index1 = this.edges[vertex1]
      ? this.edges[vertex1].indexOf(vertex2)
      : -1;
    var index2 = this.edges[vertex2]
      ? this.edges[vertex2].indexOf(vertex1)
      : -1;
    if (~index1) {
      this.edges[vertex1].splice(index1, 1);
      this.numberOfEdges--;
    }
    if (~index2) {
      this.edges[vertex2].splice(index2, 1);
    }
  };
  Graph.prototype.size = function() {
    return this.vertices.length;
  };
  Graph.prototype.relations = function() {
    return this.numberOfEdges;
  };
  Graph.prototype.traverseDFS = function(vertex, fn) {
    if (!~this.vertices.indexOf(vertex)) {
      throw new Error('Vertex not found');
    }
    var visited = [];
    this._traverseDFS(vertex, visited, fn);
  };
  Graph.prototype._traverseDFS = function(vertex, visited, fn) {
    visited[vertex] = true;
    if (this.edges[vertex] !== undefined) {
      fn(vertex);
    }
    for (var i = 0; i < this.edges[vertex].length; i++) {
      if (!visited[this.edges[vertex][i]]) {
        this._traverseDFS(this.edges[vertex][i], visited, fn);
      }
    }
  };
  Graph.prototype.traverseBFS = function(vertex, fn) {
    if (!~this.vertices.indexOf(vertex)) {
      throw new Error('Vertex not found');
    }
    var queue = [];
    queue.push(vertex);
    var visited = [];
    visited[vertex] = true;

    while (queue.length) {
      vertex = queue.shift();
      fn(vertex);
      for (var i = 0; i < this.edges[vertex].length; i++) {
        if (!visited[this.edges[vertex][i]]) {
          visited[this.edges[vertex][i]] = true;
          queue.push(this.edges[vertex][i]);
        }
      }
    }
  };
  Graph.prototype.pathFromTo = function(vertexSource, vertexDestination) {
    if (!~this.vertices.indexOf(vertexSource)) {
      throw new Error('Vertex not found');
    }
    var queue = [];
    queue.push(vertexSource);
    var visited = [];
    visited[vertexSource] = false;
    var paths = [];

    while (queue.length) {
      var vertex = queue.shift();
      for (var i = 0; i < this.edges[vertex].length; i++) {
        if (!visited[this.edges[vertex][i]]) {
          visited[this.edges[vertex][i]] = true;
          queue.push(this.edges[vertex][i]);
          // save paths between vertices
          paths[this.edges[vertex][i]] = vertex;
        }
      }
    }
    if (!visited[vertexDestination]) {
      return undefined;
    }

    var path = [];
    for (var j = vertexDestination; j != vertexSource; j = paths[j]) {
      path.push(j);
    }
    path.push(j);
    return path.reverse().join('-');
  };
  Graph.prototype.print = function() {
    logger(
      this.vertices
        .map(function(vertex) {
          return (vertex + ' -> ' + this.edges[vertex].join(', ')).trim();
        }, this)
        .join(' | ')
    );
  };

  return Graph;
})(logger);

/**
 * @see https://github.com/angular/angular.js/blob/master/src/auto/injector.js
 * @see https://github.com/angular/angular.js/blob/master/src/loader.js
 *
 * Module API
 * @see https://docs.angularjs.org/api/ng/function/angular.module
 * @see https://docs.angularjs.org/api/ng/type/angular.Module
 *
 * Module Lifecycle
 * @see https://docs.angularjs.org/guide/module#module-loading
 * @see http://www.mikeobrien.net/blog/angular-consts-values-services-factories-and-providers-oh-my
 *
 * Dependency Injection
 * @see https://docs.angularjs.org/guide/di#using-dependency-injection
 * @see https://docs.angularjs.org/api/auto/service/$injector
 * @see https://docs.angularjs.org/api/auto/service/$provide
 *
 *
 * @property {function} module - module registration and retrieval
 * @property {function} bootstrap - app bootstraping
 * @property {Array.<Module>} _modules
 *
 */
var mdl = (function(global, Graph, annotate, utilities) {
  'use strict';

  var isArray = function(a) {
    return a instanceof Array;
  };

  /**
   *
   * @param {string} name
   * @param {Array.<String>} requires
   *
   * @property {Graph} dependencyGraph
   * @property {string} name
   * @property {Array.<String>} requires
   * @property {Object} factories
   * @property {Function} factory
   *
   */
  function Module(name, requires) {
    this.name = name;
    this.factories = {};
    this.values = {};
    this.requires = requires || [];
    this.dependencyGraph = new Graph();
  }

  Module.prototype.info = function() {};

  Module.prototype.provider = function() {};

  Module.prototype.factory = Module.prototype.controller = function(
    serviceName,
    factory
  ) {
    var self = this;
    if (this.factories[serviceName]) {
      throw 'already declared';
    }

    var fn,
      requires = [];
    if ('function' === typeof factory) {
      fn = factory;
      requires = annotate(fn);
    } else if (isArray(factory)) {
      fn = factory[factory.length - 1];
      requires = annotate(fn);
    }

    self.dependencyGraph.addVertex(serviceName);
    requires.forEach(function(r) {
      self.dependencyGraph.addVertex(r);
      self.dependencyGraph.addEdge(serviceName, r);
    });

    var path;
    if ((path = self.dependencyGraph.pathFromTo(serviceName, serviceName))) {
      // @todo print the full path
      throw 'Circular Dependency : ' + path;
    }

    this.factories[serviceName] = {
      name: serviceName,
      fqn: self.name + '.' + serviceName,
      fn: fn,
      requires: requires || []
    };

    return this;
  };

  Module.prototype.value = function(name, value) {
    this.values[name] = value;
  };

  var mdl = {
    _modules: {}
  };

  var mDependencyGraph = new Graph();

  /**
   * @param {string} modName
   * @param {Array.<string>} requires
   *
   */
  mdl.module = function(modName, requires) {
    // module registration
    if (requires) {
      var module = new Module(modName, requires);

      mDependencyGraph.addVertex(modName);
      requires.forEach(function(r) {
        mDependencyGraph.addVertex(r);
        mDependencyGraph.addEdge(modName, r);
      });

      var path;
      if ((path = mDependencyGraph.pathFromTo(modName, modName))) {
        // @todo print the full path
        throw 'Circular Dependency : ' + path;
      }

      this._modules[modName] = module;
      return module;
    }

    // module retrieval
    if (!this._modules[modName]) {
      throw new Error('cannot find module "' + modName + '"');
    }
    return this._modules[modName];
  };

  /**
   * /!\ On instantie même si on ne se sert pas du service!
   *
   */
  var instantiateService = function(mod, service) {
    if (!mod) {
      throw 'mod undefined';
    }
    if (!service) {
      throw 'service undefined';
    }
    var args = service.requires.map(function(depName) {
      return (
        mdl._depCache[depName] ||
        instantiateService(mod, mod.factories[depName])
      );
    });

    var instance = service.fn.apply(service.fn, args);
    mdl._depCache[service.name] = instance;
    return instance;
  };

  /**
   * /!\ On instancie même si on ne se sert pas du module!
   *
   */
  var instantiateMod = function(mod) {
    for (var key in mod.values) {
      mdl._depCache[key] = mod.values[key];
    }

    mod.requires.map(function(modName) {
      return mdl._mCache[modName] || instantiateMod(mdl._modules[modName]);
    });

    for (var k in mod.factories) {
      instantiateService(mod, mod.factories[k]);
    }

    return (mdl._mCache[mod.name] = 1);
  };

  mdl._depCache = {};
  mdl._mCache = {};

  mdl.bootstrap = function(name) {
    return instantiateMod(mdl._modules[name]);
  };

  mdl.id = utilities.getUuid();
  return mdl;
})(this, Graph, annotate, utilities);
