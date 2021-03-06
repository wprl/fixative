'use strict';
// ## Config
var config = require('rc')('fixative', {
  preload: ''
});
// ## Dependencies
var fs = require('fs');
var path = require('path');
var deco = require('deco');
var util = require('util');
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
var fixative = deco(function (options) {
  // ### Private Instance Members
  var self = this;
  var orchestrator = new Orchestrator();
  var helperFor = {};
  var definitionFor = {};
  var clean = [];
  // #### Method to instantiate a new fixture object
  self.instantiate = function (options2) {
    return fixative(options2);
  };
  // #### Method to define a fixture task
  self.task = function (definition) {
    var name = definition.name;
    definition.dependencies = definition.dependencies ? [].concat(definition.dependencies) : [];
    definition.children = definition.children ? [].concat(definition.children) : [];

    if (!name) throw new Error('Task name was not set.');

    definitionFor[name] = definition;
    definition.wasRun = false;

    var task = function (callback) {
      if (definition.wasRun) {
        debug('Already ran "%s" task...', name);
        return callback();
      }

      debug('Running "%s" task...', name);

      if (definition.initialize) {
        definition.initialize();
        debug('Ran initialize task for "%s".', name);
      }

      clean.push(definition);
      debug('Added clean up task for "%s."', name);

      if (definition.example) {
        self[name] = self.example(name);
        debug('Set "%s:" %o', name, self[name]);
      }

      definition.wasRun = true;
      callback();
    };

    if (definition.dependencies.length === 0) return orchestrator.add(name, task);
    return orchestrator.add(name, definition.dependencies, task);
  };
  // #### Method to define a helper method
  self.helper = function (definition) {
    var args;

    if (typeof definition === 'string') {
      args = Array.prototype.slice.call(arguments, 1);
      return helperFor[definition].apply(self, args);
    }

    if (!definition) throw new Error('No arguments supplied to helper.');
    if (!definition.name) throw new Error('No helper name.');

    var name = definition.name;

    if (helperFor[name]) {
      throw new Error('A helper is already registered with the name "' + name + '"');
    }

    helperFor[name] = definition.f.bind(self);
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

  self.hook = function (name) {
    debug('Adding test hook for "%s..."', name);
    return function (done) {
      self.create(name, done);
    };
  };

  self.example = function (n, name, override) {
    if (!isReal(n)) {
      override = name || null;
      name = n;
      n = 1;
    }

    if (!definitionFor[name].example) return undefined;

    if (n < 0) throw new Error('Can only create a positive number of examples.');
    if (!isInteger(n)) throw new Error('Can only create an integer number of examples.');

    debug('Generating %s example(s) of "%s..."', n, name);

    var examples = [];

    for (n; n > 0; n -= 1) {
      var e = definitionFor[name].example();
      if (override) examples.push(deco.merge(e, override));
      else examples.push(e);
    }

    if (examples.length === 1) return examples[0];
    return examples;
  };

  self.clean = function (callback) {
    debug('Running clean up tasks.');
    var count = clean.length;
    async.each(clean, function (definition, next) {
      if (!definition.clean) {
        delete self[definition.name];
        definition.wasRun = false;
        next();
        return;
      }

      definition.clean(function (error) {
        if (error) return next(error);
        delete self[definition.name];
        definition.wasRun = false;
        next();
        return;
      });
    }, function (error) {
      if (error) return callback(error);
      // Stop tracking cleaned up tasks.
      clean = [];
      callback(null, count);
    });
  };

  self.plugin = function (name, definition) {
    // Use the same interface for local and npm-installed plugins
    throw new Error('Not implemented.');
  };

});

var defaultFixture = module.exports = fixative();

if (config.preload) {
  try {
    var testBinDirectory = path.dirname(require.main.filename);
    // In tests we'll be in `node_modules/.bin`
    var mainDirectory = path.resolve(testBinDirectory, '../../..');

    config.preload.split(',').forEach(function (preloadPath) {
      var preloadDirectory = path.resolve(mainDirectory, preloadPath);
      deco.require(fs.realpathSync(preloadDirectory));
    });
  }
  catch (e) {
    e.originalMessage = e.message;
    e.message = util.format('Could not preload fixture tasks: "%s".',
      e.message);
    throw e;
  }
}
