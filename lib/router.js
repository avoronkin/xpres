'use strict';

var debug = require('debug')('do:router');
var ware = require('ware');
var mixin = require('merge-descriptors');
var routeFactory = require('./route');


var proto = {
  use: function(path) {
    var noPath = ('string' !== typeof path);
    var argumentsOffset = noPath ? 0 : 1;
    var handlers = Array.prototype.slice.call(arguments, argumentsOffset);
    path = (noPath ? '(.*)' : path);

    if (handlers.length === 1) {
      handlers = handlers[0];
    }

    this.addHandler(path, handlers);
  },
  addHandler: function(path, handler) {
    path = this.getPath() + path;
    var route;

    if (handler.isRouter) {
      route = handler;
      route.mountpath = path;
    } else {
      route = routeFactory(path, handler);
    }

    route.parent = this;

    this.ware.use.call(this.ware, route);
  },
  getPath: function() {
    var path = this.parent ? this.parent.getPath() + this.mountpath : '';
    return path;
  }
};

function routerFactory() {
  var middleware = ware();
  var router = function(req, res, next) {
    middleware.run(req, res, function(err) {
      if (err) {
        next(err);
      }
    });
  };

  router.ware = middleware;

  mixin(router, proto, false);

  router.locals = {};

  router.mountpath = '';
  //alias
  router.get = router.use;

  router.isRouter = true;

  return router;
}

module.exports = routerFactory;