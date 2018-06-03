var A = (function(modularize){
  "use strict";
  modularize.module("A", []).factory("serviceA", function(){
    return {
      quux: "toto"
    }
  });
})(modularize)

var B = (function(modularize){
  "use strict";
  modularize.module("B", ["C"]).factory("serviceB", ["serviceC", function(serviceC){
    return {
      foo: "bar"
    }
  }]);
})(modularize)

var C = (function(modularize){
  "use strict";
  modularize.module("C", ["A"]).factory("serviceC", function(){
    return {
      foo: "bar"
    }
  });
})(modularize)

modularize.bootstrap();
