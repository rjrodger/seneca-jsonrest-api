![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# seneca-jsonrest-api

![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]


## Seneca HTTP JSON REST API Plugin

Exposes your data entities as a [REST
API](http://en.wikipedia.org/wiki/Representational_state_transfer). For
example, if you have a data entity called _foo_, then the following
end points will become available:

   * GET _/api/rest/foo_: return a list of all foo entities
   * GET _/api/rest/foo/:id_: return a single foo entity by identifier
   * POST _/api/rest/foo_: create a new foo entity
   * PUT _/api/rest/foo/:id_: update a foo entity

You can use the plugin options to change the URL prefix, and to add
additional behaviours.

Note that it is not necessary for the underlying entity to be
persistent. You can define a virtual entity _foo_ by providing actions for
the patterns:

   * _role:entity,name:foo,cmd:save_
   * _role:entity,name:foo,cmd:load_
   * _role:entity,name:foo,cmd:list_
   * _role:entity,name:foo,cmd:remove_


## Options

You can `seneca.use this plugin multiple times to create multiple
independent API end points, so long as you specify different
prefixes. The _prefix_ option is used to create separate action
patterns so that they do not conflict.

   * _prefix_: a custom prefix
   * _pins_: an array of entity pins, with properties _name,base,zone_. These define the data entities that will be exposed.

## Examples

   * [tests](https://github.com/rjrodger/seneca-jsonrest-api/tree/master/test) in this repository
   * [seneca-examples/api-server](https://github.com/rjrodger/seneca-examples/tree/master/api-server)
   * [seneca-data-editor](https://github.com/rjrodger/seneca-data-editor)


## Support
[Annotated Source Code](http://rjrodger.github.io/seneca-jsonrest-api/doc/jsonrest-api.html).

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

## Install

To install and add to the dependencies list in the package.json file
for your project:

```sh
npm install seneca-jsonrest-api --save
```

And in your code:

```js
var seneca = require('seneca')()
    .use( 'jsonrest-api' )
```

[npm-badge]: https://badge.fury.io/js/seneca-jsonrest-api.svg
[npm-url]: https://badge.fury.io/js/seneca-jsonrest-api
[travis-badge]: https://travis-ci.org/rjrodger/seneca-jsonrest-api.png?branch=master
[travis-url]: https://travis-ci.org/rjrodger/seneca-jsonrest-api
[coveralls-badge]: https://coveralls.io/repos/rjrodger/badge.svg?branch=master&service=github
[coveralls-url]:  https://coveralls.io/github/rjrodger?branch=master
[david-badge]: https://david-dm.org/toymachiner62/hapi-authorization.svg
[david-url]: https://david-dm.org/seneca-jsonrest-api
[gitter-badge]: https://badges.gitter.im/rjrodger/seneca-jsonrest-api.svg
[gitter-url]: https://gitter.im/rjrodger/seneca-jsonrest-api

