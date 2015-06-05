# Fixative

Fixative is a module for node that helps organize your mocha fixtures and test helpers.

## Examples

Define a fixture task:

```javascript
var fixture = require('fixative');
var expect = require('expect.js');

fixture.task({
  name: 'user',
  example: function () { return { name: 'alex' } }
});

fixture.create('user', function (error, o) {
  if (error) throw error;
  expect(o === fixture.user);
  expect(o.name === 'alex');
});
```

Fixture tasks are compatible with mocha.

```javascript
describe('suite', function () {
  before(fixture.hook('user'));
  after(fixture.clean);

  it('does something', function () {
    expect(fixture.user).to.be.ok();
  });
});
```

You can also add helpers to your fixtures.

```javascript
fixture.helper({
  name: 'lol',
  f: function () {
    return ('ha ha');
  }
});

expect(fixture.helper('lol')).to.be('ha ha');
```

## Config

fixative uses the [`rc`](https://www.npmjs.com/package/rc) module for configuration.  That means you can use a `.fixativerc` file or environment variables to configure fixative.

### preload

Use this option to specify a directory or directories of fixture tasks to preload when fixative is `require`d.

Put this in the project's `.fixativerc`:

```javascript
{
  "preload": "./test/fixture,./node_modules/common-fixtures"
}
```

Alternatively, set an environment variable:

```bash
fixative_preload=./test/fixture npm test
```
