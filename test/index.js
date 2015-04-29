var fixative = require('..');
var expect = require('expect.js');

describe('tasks', function () {
  describe('define', function () {
    var fixture;

    beforeEach(function () {
      fixture = fixative.instantiate();
    });

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

    it("doesn't allow creating a task that doesn't exist", function (done) {
      fixture.create('test3', function (error, o) {
        expect(error).to.be.ok();
        done();
      });
    });

    it('runs the initialization function if present', function (done) {
      var wasCalled = false;
      fixture.task({
        name: 'test1',
        initialize: function () {
          wasCalled = true;
        }
      });
      fixture.create('test1', function (error, o) {
        if (error) return done(error);
        expect(o).not.to.be.ok();
        expect(wasCalled).to.be.ok();
        done();
      });
    });

    it("doesn't set the value on the fixture if no example", function (done) {
      fixture.task({
        name: 'test1',
        initialize: function () {
          // noop
        }
      });
      fixture.create('test1', function (error, o) {
        if (error) return done(error);
        expect(o).to.be(undefined);
        expect(fixture).not.to.have.property('test1');
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
    var fixture;

    beforeEach(function () {
      fixture = fixative.instantiate();
    });

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

    it("doesn't require an example to be set", function () {
      fixture.task({
        name: 'test1'
      });

      var o = fixture.example('test1');
      expect(o).to.be(undefined);
    });

    it('handles override of single object, array, fn, etc.');
  });

  describe('cleanup', function () {
    var fixture;

    beforeEach(function () {
      fixture = fixative.instantiate();
    });

    it('cleans up tasks', function (done) {
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } }
      });
      fixture.create('test1', function (error, o) {
        if (error) return done(error);
        expect(fixture).to.have.property('test1', o);
        fixture.clean(function (error, count) {
          if (error) return done(error);
          expect(count).to.be(1);
          expect(fixture).not.to.have.property('test1');
          done();
        });
      });
    });

    it('allows custom cleanup function', function (done) {
      var wasCalled = false;
      fixture.task({
        name: 'test1',
        example: function () { return { a: 1 } },
        clean: function (callback) {
          expect(fixture).to.have.property('test1');
          wasCalled = true;
          callback();
        }
      });
      fixture.create('test1', function (error, o) {
        if (error) return done(error);
        expect(fixture).to.have.property('test1', o);
        fixture.clean(function (error, count) {
          if (error) return done(error);
          expect(count).to.be(1);
          expect(fixture).not.to.have.property('test1');
          expect(wasCalled).to.be(true);
          done();
        });
      });
    });
  });

  describe('helpers', function () {
    var fixture;

    beforeEach(function () {
      fixture = fixative.instantiate();
    });

    it('allows adding helper methods', function (done) {
      fixture.helper({
        name: 'test',
        f: function () { expect(this).to.be(fixture) }
      });
      fixture.helper('test');
      done();
    });

    it('allows passing arguments', function (done) {
      fixture.helper({
        name: 'sum',
        f: function (a, b) { return a + b }
      });
      expect(fixture.helper('sum', 2, 3)).to.be(5);
      done();
    });

    it('requires name', function (done) {
      function f () { fixture.helper({}) }
      expect(f).to.throwError(/no helper name/i);
      done();
    });

    it('requires arguments', function (done) {
      function f () { fixture.helper() }
      expect(f).to.throwError(/no arguments/i);
      done();
    });
  });

  describe('mocha', function () {

    var fixture = fixative.instantiate();
    var wasCalled1 = false;
    var wasCalled2 = false;

    fixture.task({
      name: 'test1',
      example: function () { return { a: 1 } },
      clean: function (callback) {
        expect(fixture).to.have.property('test1');
        wasCalled1 = true;
        callback();
      }
    });

    fixture.task({
      name: 'test2',
      dependencies: ['test1'],
      initialize: function () {
        fixture.test1.b = 2;
      },
      clean: function (callback) {
        wasCalled2 = true;
        callback();
      }
    });

    fixture.task({
      name: 'test3',
      dependencies: ['test1']
    });

    before(fixture.hook('test1'));
    before(fixture.hook('test2'));
    //before(fixture.hook('test3'));
    afterEach(fixture.clean);

    it('creates as a mocha task', function (done) {
      expect(fixture).to.have.property('test1');
      expect(fixture).not.to.have.property('test2');
      expect(fixture.test1).to.have.property('a', 1);
      expect(fixture.test1).to.have.property('b', 2);
      done();
    });

    it('cleans as a mocha task', function (done) {
      expect(fixture).not.to.have.property('test1');
      expect(fixture).not.to.have.property('test2');
      expect(wasCalled1).to.be(true);
      expect(wasCalled2).to.be(true);
      done();
    });

  });
});
