var A = (function(modulazer) {
  'use strict';
  modulazer.module('A', []).factory('serviceA', function() {
    return {
      quux: 'toto'
    };
  });
})(modulazer);

var B = (function(modulazer) {
  'use strict';
  modulazer.module('B', ['C']).factory('serviceB', [
    'serviceC',
    function(serviceC) {
      return {
        foobar: 'foo' + serviceC.bar
      };
    }
  ]);
})(modulazer);

var C = (function(modulazer) {
  'use strict';
  modulazer.module('C', ['A']).factory('serviceC', function() {
    return {
      bar: 'bar'
    };
  });
})(modulazer);

modulazer.bootstrap();
