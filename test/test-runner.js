function test_TestRunner(){

  TestRunner(function(){
    describe("contains fit", function(){
      fit("executed", function(){
      })

      it("is not ran", function(){
      })
    });

    describe("contains it", function(){
      it("not executed", function(){
      })
    });

    fdescribe("fdescribe", function(){
      it("is ran", function(){
      });
    });
  });

  return
  TestRunner(function(){

    fdescribe("fdescribe 1", function(){
      it("is ran", function(){
      });

      xit("should not", function(){

      });
    });

    describe("TestRunner", function(){
      fit("should", function(){
        throw new Error("TestError");
      });

      it("should not", function(){

      });

      describe("describe in describe", function(){
        it("should", function(){
          throw new Error("TestError");
        });

        it("should not", function(){

        });
      });
    });

    fdescribe("fdescribe 2", function(){
      it("is ran", function(){
      });
    });

    xdescribe("xdescribe", function(){
    });
  })
}
