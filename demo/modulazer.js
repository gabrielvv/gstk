var A = (function(modularize) {
  'use strict';
  modularize.module('A', []).factory('serviceA', function() {
    return {
      quux: 'toto'
    };
  });
})(modularize);

var B = (function(modularize) {
  'use strict';
  modularize.module('B', ['C']).factory('serviceB', [
    'serviceC',
    function(serviceC) {
      return {
        foobar: 'foo' + serviceC.bar
      };
    }
  ]);
})(modularize);

var C = (function(modularize) {
  'use strict';
  modularize.module('C', ['A']).factory('serviceC', function() {
    return {
      bar: 'bar'
    };
  });
})(modularize);

modularize.bootstrap();
