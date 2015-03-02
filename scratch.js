'use strict';
// ## Dependencies
var deco = require('deco');
var orchestrator = require('orchestrator');
// ## Module Definition
var fixative = module.exports = deco(function (options) {
  // ### Private Instance Members
  var self = this;
  var exampleFor = {};
  var clean = [];
  // ### Public Instance Members
  self.helpers = {};
  // #### Method to define a fixture task
  self.task = function (definition) {
    var name = definition.name;
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

  self.create = function (n?, name, override?, callback?) {
    var f = function (done) {
      self[name] = self.example(n, name, override);
      done(null);
    };

    if (callback) process.nextTick(callback);
    return f;
  };

  self.example = function (n, name, override) {
    if (!isNumber(n)) {
      override = name || null;
      name = n;
      n = 1;
    }

    if (n < 1) throw new Error('Can only create a positive number of examples.');
    if (notInteger(n)) throw new Error('Can only create an integer number of examples.');

    var examples = Array.call([], n).map(function () {
      var e = tasks[name].example();
      // TODO expand override to handle single object, array, fn, etc.
      if (override) return deco.merge(e, override);
      return e;
    });

    if (examples.length === 1) return examples[0];
    return examples;
  };

  self.clean = function (name?) {
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

// Multi
//   Store in array or get as needed
// Combo
//   Define all together and access simply
//   Basically, reverses dependency chain
//     We want user but want to also create userRelatedData
//     but it depends on user.

fixative.task('user', {
  dependencies: 'registration', // these tasks are run before
  children: ['userRelatedData', 'otherData'], // these tasks are run after
  example: { x: 'y' }
});

fixative.task('user', {
  scenario: 'image and history',
  dependencies: 'imageUpload',
  children: {
    imageName: 2, // run this task twice afterward
    history: {
      times: 4, // run 4 times applying an override
      override: { private: false }
    }
  },
  example: { // override example
    name: 'joe'
  }
});

fixative.override('user', { height: '6ft' });

beforeEach(fixative.create(10, 'user', 'image and history'));
beforeEach(fixative.create(2, 'user'));

fixative.users[11]; // second "vanilla" user
// or...
fixative.users('image and history', 3); // fourth image and history user
fixative.users(1); // second vanilla user
// allow...
fixative.users(); // all vanilla users
fixative.users('image and history'); // all special users.

// Override
//   This pattern allows override to work pretty well I think...
fixative.override('user', { ... }); // override all
fixative.override('user', [ ... , ... ]); // override according to index
fixative.override('user', { // this conflicts with 2 lines above
  'image and history': /* same as other overrides, all same */,
  '0': /* override first, same as other formats, all same */,
  '100': /* override the hundredth */,
});
fixative.override('user', function (user, i) { // override function executed on each example
  return { ... };
});

// Fixtures with dependencies
//   Example build deps (partially) or leaves empty?

var example = {
  user_id: fixative.later('user.id', -1) // get the value from dep if possible, otherwise uses default.
};

// Also allow register helper methods
// Create/example ovveride should accept functions that
//   are executed during example creation.
// If callback supplied to create, execute in test
//   i.e. allow using create in the test, outside of
//   beforeEach for maximum flexibility
// Allow descriptivity to aid in literate doc generation
//   fixture.define('user', 'registered', ...);
//   fixture.define('user', 'not verified', ...);
//   ... later
//   beforeEach(fixture.create('user', 'not verified'));
//   Sometimes you just want a bunch of an object, but
//   sometimes you want similar objects in different
//   well-defined scenarios and this would be for the
//   latter case.
// Better organize related data e.g. avoid pu in:
//    fixture.user, fixture.partner, fixture.partnerUser
//    Instead...
//      fixture.suite.user or something
// fixture.helper.assertResponseBody(...)
//   do `var helper = fixture.helper;` for sugar
//   load helpers from /test/helpers by default
// Plugins
//   fixture.task('seneca', { cmd: x, role: y });
//   you never have to explicitly require fixative-seneca
//   it would be handled internally and you just
//   specify plugin name

// This is a singleton
var fixative = require('fixative');
// This returns an object local to a test file.
var fixture = fixative();
// Maybe even make it recursive.  But maybe just make another fixative()
var subfixture = fixture();

// Singleton fixture loads defines from /test/fixture by default
// Singleton fixture loads helpers from /test/helpers by default

// private helpers/tasks

fixture.helper(...); // why would you do a private helper?  One reason might be to have a helper that access the fixtuer through `this`.
fixture.task(...);

beforeEach(fixture.create(3, 'dwarf'));
afterEach(fixture.cleanup());

it('does something', function (done) {
  assert(fixture.dwarves.length === 3);

  var elves = fixture.example(7, 'elf');
  assert(!fixture.elves);
  assert(elves.length === 7);

  fixture.create(9, 'mortal man', function (err, men) {
    assert(!err);
    assert(men.length === 9);
    assert(!fixture.men); // not stored in fixture
    // maybe give the men array a .clean method
    men.clean(function (err) {
      assert(!err);
      fixture.dwarves.clean(done);
      // or fixture.clean('dwarves', done);
    });
  });
});

// Idea: one argument for local tasks

var task = fixative.task({ // local task not on fixture, but tracked for cleanup
  height: '600ft'
}); // or function e.g. using casual

// later...

it('does another thing', function (done) {
  task(function (err, example) {
    expect(!err);
    assert(example.height === '600ft');
    example.clean(done);
  });
});


// Question: would this syntax be better?
// First set up the fixture
fixture.override(...);
fixture.create(...); // maybe this would be called declare or something
fixture.create(...); // maybe this would be called declare or something
// Then use it from one function:
beforeEach(fixture.create());
afterEach(fixture.cleanup())









'use strict';

var _ = require('lodash');
var requireindex = require('requireindex');
var async = require('async');
var debug = require('../lib/common/logging')('epi:fixture');
var Orchestrator = require('orchestrator');

var orchestrator = new Orchestrator();
var forCleanup = [];

var overrideData = {};

var fixture = module.exports = {};

// Construct a task to create an object via seneca
function senecaCreate (options) {
  return function (done) {
    if (!fixture.seneca) {
      return done(new Error('seneca was not set on the fixture.  ' +
        'You probably want to run the create server task first.'));
    }

    var example = options.example();
    if(overrideData[options.name]) {
      _.assign(example, overrideData[options.name]);
    }
    var create;
    var pattern;
    var entity;

    if (options.resource) {
      pattern = { role: options.resource, cmd: options.cmd || 'create' };
      create = _.bind(fixture.seneca.act, fixture.seneca, pattern, example);
    }
    else {
      entity = fixture.seneca.make$(options.entity);
      create = _.bind(entity.save$, entity, example);
    }

    create(function (err,saved) {
      if (err) {
        debug('error in create for "%s"', options.name);
        debug(err);
        return done(err);
      }
      debug('successfully created "%s"', options.name);
      // Set the property on the fixture so tests can use it
      fixture[options.name] = saved;
      done();
    });
  };
}

// Create a cleanup callback for seneca entities.
function senecaCleanup (options) {
  return function (done) {
    // Don't execute if there's nothing to clean up.
    if (!(options.name in fixture)) {
      return done();
    }
    // Date stored in fixture.
    var data = fixture[options.name];
    // Don't execute if it doesn't have a DB ID
    if (!isFinite(data.id)) {
      return done();
    }
    // Remove from DB and delete from the fixture.
    var query = { id: data.id };

    fixture.seneca.make(options.entity).remove$(query, function (err, status) {
      if (err) {
        return done();
      }

      delete fixture[options.name];
      debug('deleted data for "%s"', options.name);
      debug('rows affected: %s', status.affectedRows);
      done();
    });
  };
}

fixture.defineTask = function (options) {
  var dependencies = options.dependencies || [];
  var task;
  var cleanup;
  // If a create callback was passed in use it and any
  // supplied remove callback.  Otherwise, build a task
  // that uses seneca to create and remove the fixture
  // data.
  if (options.create) {
    task = options.create;
    if (options.remove) {
      cleanup = options.remove;
    }
  }
  else {
    task = senecaCreate(options);
    cleanup = senecaCleanup(options);
  }
  // Create the full task in orcestrator.  This is what gets
  // called from tests when the add tasks with `fixture.create`.
  orchestrator.add(options.name, dependencies, function (done) {
    // Don't recreate the data if the task has already run.
    if (options.name in fixture) {
      debug('task "%s" already ran:', options.name);
      return done();
    }
    // Execute the task and store the cleanup callback for later.
    // Cleanup callbacks will be executed in the opposite order
    // as tasks.
    task(function (err) {
      if (err) {
        return done(err);
      }

      if (cleanup) {
        forCleanup.unshift(cleanup);
      }

      done();
    });
  });

  return options;
};
// Returns a mocha callback for use in before/beforeEach/etc.
fixture.create = function (name, override) {
  if(override) {
    overrideData[name] = override;
  }
  return function (done) {
    orchestrator.start(name, done);
  };
};

// A mocha callback to cleanup all fixture data.
fixture.cleanup = function (done) {
  debug('cleaning up %s tasks...', forCleanup.length);
  async.series(forCleanup, function (err) {
    if (err) {
      return done(err);
    }
    forCleanup = [];
    done();
  });
};

// Load tasks
var tasks = requireindex(__dirname + '/fixture');
// Expose tasks by name
fixture.tasks = {};

_.each(tasks, function (task) {
  var definition = task(fixture);
  fixture.defineTask(definition);
  fixture.tasks[definition.name] = definition;
});


