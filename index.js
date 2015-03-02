'use strict';
// ## Dependencies
var deco = require('deco');
var debug = require('debug')('fixative');
var Orchestrator = require('orchestrator');
// ## Private Module Members
function isReal (n) {
  if (typeof n !== 'number') return false;
  if (!isFinite(n)) return false;
  return true;
}

function isInteger (n) {
  if (!isReal(n)) return false;
  if (Math.floor(n) !== n) return false;
  return true;
}
// ## Module Definition
var fixative = module.exports = deco(function (options) {
  // ### Private Instance Members
  var self = this;
  var orchestrator = new Orchestrator();
  var exampleFor = {};
  var clean = [];
  // ### Public Instance Members
  self.helpers = {};
  // #### Method to define a fixture task
  self.task = function (definition) {
    var name = definition.name;

    if (!name) throw new Error('Task name was not set.');

    exampleFor[name] = definition.example;

    orchestrator.add(name, function (done) {
      // TODO hand off to plugin if option set
      self[name] = self.example(name);
      clean.push(definition.clean);
      done();
    });
  };
  // #### Method to define a helper method
  self.helper = function (name, f) {
    if (!name) {
      throw new Error('No helper name given.');
    }
    if (!f) {
      throw new Error('No helper function given.');
    }
    if (self.helpers[name]) {
      throw new Error('A helper is already registered with the name "' + name + '"');
    }

    self.helpers[name] = f.bind(self);
    return self;
  };

  self.create = function (n, name, override, callback) {
    if (!isReal(n)) {
      override = name || null;
      name = n;
      n = 1;
    }

    var f = function (done) {
      debug('Creating %s...', name);
      self[name] = self.example(n, name, override);
      debug('Created %s: %o', name, self[name]);
      // done(null);
    };

    if (callback) process.nextTick(callback);
    return f;
  };

  self.example = function (n, name, override) {
    if (!isReal(n)) {
      override = name || null;
      name = n;
      n = 1;
    }

    if (n < 1) throw new Error('Can only create a positive number of examples.');
    if (!isInteger(n)) throw new Error('Can only create an integer number of examples.');

    debug('Generating %s example(s) of "%s..."', n, name);

    var examples = [];

    for (n; n > 0; n -= 1) {
      var e = exampleFor[name]();
      // TODO expand override to handle single object, array, fn, etc.
      if (override) examples.push(deco.merge(e, override));
      examples.push(e);
    }

    if (examples.length === 1) return examples[0];
    return examples;
  };

  self.clean = function (name) {
    cleanup.forEach(function (worker) {
      // TODO delete worker
    });
    // Stop tracking cleaned up tasks.
    cleanup = [];
  };

  self.plugin = function (name, definition) {
    // use the same interface for local and npm-installed plugins
  };

});
