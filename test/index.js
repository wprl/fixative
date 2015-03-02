var fixative = require('..');
var expect = require('expect.js');

describe('tasks', function () {
  var fixture;

  beforeEach(function () {
    fixture = fixative();
  });

  describe('define', function () {
    it('requires setting a name', function () {
      function f () { fixture.task({}) }
      expect(f).to.throwError(/task name was not set/i);
    });

    it('defines a task', function (done) {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });
      fixture.create('test1', function (error, o) {
        if (error) return done(error);
        expect(o).to.be.ok();
        expect(fixture).to.have.property('test1', o);
        expect(fixture.test1).to.have.property('a', 1);
        done();
      });
    });

    it('allows setting dependencies', function (done) {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });
      fixture.task({
        name: 'test2',
        dependencies: 'test1',
        example: function () { return { d: 4 } }
      });
      fixture.create('test2', function (error, o) {
        if (error) return done(error);
        expect(o).to.be.ok();
        expect(fixture).to.have.property('test1');
        expect(fixture).to.have.property('test2', o);
        expect(fixture.test1).to.have.property('a', 1);
        expect(fixture.test2).to.have.property('d', 4);
        done();
      });
    });

    it('allows setting children', function (done) {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });
      fixture.task({
        name: 'test2',
        dependencies: 'test1',
        example: function () { return { d: 4 } }
      });
      fixture.task({
        name: 'test3',
        children: 'test2',
        example: function () { return { e: 5 } }
      });
      fixture.create('test3', function (error, o) {
        if (error) return done(error);
        expect(o).to.be.ok();
        expect(fixture).to.have.property('test3', o);
        expect(fixture.test3).to.have.property('e', 5);
        expect(fixture).to.have.property('test1');
        expect(fixture.test1).to.have.property('a', 1);
        expect(fixture).to.have.property('test2');
        expect(fixture.test2).to.have.property('d', 4);
        done();
      });
    });

    it.skip('allows overriding a task by named scenario', function () {
      fixture.task({
        name: 'test3',
        scenario: 'alternate',
        example: function () { return { f: 6 } }
      });

      fixture.create('test3', 'alternate', function (error, o) {
        if (error) return done(error);
        expect(o).to.be.ok();
        expect(fixture).to.have.property('test1');
        expect(fixture).to.have.property('test2');
        expect(fixture).to.have.property('test3');

        expect(fixture.test3).to.be.an(Array);
        expect(fixture.test3).to.have.length(2);
        expect(fixture.test3[0]).to.have.property('e', 5);
        expect(fixture.test3[1]).to.have.property('f', 6);
        done();
      });
    });
  });

  describe('example', function () {
    it('creates a single example', function () {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });

      var o = fixture.example('test1');
      expect(o).to.be.ok();
      expect(o).to.have.property('a', 1);
    });

    it('creates an array of examples', function () {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });

      var os = fixture.example(3, 'test1');
      expect(os).to.be.ok();
      expect(os).to.be.an(Array);
      expect(os).to.have.length(3);
      os.forEach(function (o) {
        expect(o).to.have.property('a', 1);
      });
    });

    it('allows overriding an example', function () {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });

      var o = fixture.example('test1', { b: 2, c: 3 });
      expect(o).to.be.ok();
      expect(o).to.have.property('a', 1);
      expect(o).to.have.property('b', 2);
      expect(o).to.have.property('c', 3);
    });
  });

  describe('cleanup', function () {
    it('tracks created tasks');
    it('cleans up tasks');
    it("doesn't track cleaned up tasks anymore");
  });

  describe('helpers', function () {

  });
});
