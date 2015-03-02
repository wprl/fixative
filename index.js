'use strict';
// ## Dependencies
var deco = require('deco');
var async = require('async');
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
  var definitionFor = {};
  var clean = [];
  // ### Public Instance Members
  self.helpers = {};
  // #### Method to define a fixture task
  self.task = function (definition) {
    var name = definition.name;
    definition.dependencies = definition.dependencies ? [].concat(definition.dependencies) : [];
    definition.children = definition.children ? [].concat(definition.children) : [];

    if (!name) throw new Error('Task name was not set.');

    exampleFor[name] = definition.example;
    definitionFor[name] = definition;

    var task = function (callback) {
      debug('Running "%s" task...', name);

      clean.push(definition.clean);
      debug('Added clean up task for "%s."', name);

      self[name] = self.example(name);
      debug('Set "%s:" %o', name, self[name]);

      callback();
    };

    if (definition.dependencies.length === 0) return orchestrator.add(name, task);
    return orchestrator.add(name, definition.dependencies, task);
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

  // self.create = function (n?, name, override?, callback) {
  self.create = function (name, callback) {
    debug('Creating "%s..."', name);
    orchestrator.start(name, function (error) {
      if (error) return callback(error);
      debug('Created "%s."', name);
      async.each(definitionFor[name].children, self.create, function (error) {
        if (error) return callback(error);
        callback(null, self[name]);
      });
    });
  };

  self.example = function (n, name, override) {
    if (!isReal(n)) {
      override = name || null;
      name = n;
      n = 1;
    }

    if (n < 0) throw new Error('Can only create a positive number of examples.');
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
