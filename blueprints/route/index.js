var Blueprint   = require('ember-cli/lib/models/blueprint');
var SilentError = require('ember-cli/lib/errors/silent');
var chalk       = require('chalk');
var fs          = require('fs-extra');
var inflection  = require('inflection');
var path        = require('path');
var EOL         = require('os').EOL;
var _           = require('lodash');

var KIND_MAP = {
  auth: 'AuthRoute',
  base: 'BaseRoute',
  ember: 'Ember.Route'
},
KIND_PATH = {
  auth: "import AuthRoute from 'app/routes/auth';",
  base: "import BaseRoute from 'app/routes/base';",
  ember: 'ember'
};

module.exports = {
  beforeInstall: function(options) {
    var type = options.type;

    if (type && !/^(resource|route)$/.test(type)) {
      throw new SilentError('Unknown route type "' + type + '". Should be "route" or "resource".');
    }
  },

  afterInstall: function(options) {
    var entity  = options.entity;
    var isIndex = /index$/.test(entity.name);

    if (!isIndex && !options.dryRun) {
      addRouteToRouter(entity.name, {
        type: options.type
      });

      addImportToTranslations(entity.name, {
        type: options.type
      });
    }
  },

  beforeUninstall: function(options) {
    var type = options.type,
    kind = options.kind;

    if (type && !/^(resource|route)$/.test(type)) {
      throw new SilentError('Unknown route type "' + type + '". Should be "route" or "resource".');
    }

    if (kind && !TYPE_MAP[kind]) {
      throw new SilentError('Unknown route kind "' + kind + '". Should be "base", "auth", or "ember".');
    }

  },

  afterUninstall: function(options) {
    var entity  = options.entity;
    var isIndex = /index$/.test(entity.name);

    if (!isIndex && !options.dryRun) {
      removeRouteFromRouter(entity.name, {
        type: options.type
      });

      removeImportFromTranslations(entity.name, {
        type: options.type
      });
    }
  },

  locals: function(options) {
    var kindClass,
    kindPath;

    if (options.kind) {
      kindClass = KIND_MAP[options.kind];

      if (options.kind !== 'ember'){

        kindPath = KIND_PATH[options.kind];

      }

    } else {
      this.ui.writeLine(chalk.yellow('Warning: no route "kind" was specified, defaulting to authenticated route.'));
      kindClass = KIND_MAP.auth;
      kindPath = KIND_PATH.auth;
    }

    return {
      kindClass: kindClass,
      kindPath: kindPath
    };
  }
};

function removeRouteFromRouter(name, options) {
  var type       = options.type || 'route';
  var routerPath = path.join(process.cwd(), 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (!existence.test(oldContent)) {
    return;
  }

  if (name === 'basic') { return; }

  switch (type) {
    case 'route':
      var re = new RegExp('\\s*this.route\\((["\'])'+ name +'(["\'])\\);');
      newContent = oldContent.replace(re, '');
      break;
    case 'resource':
      plural = inflection.pluralize(name);

      if (plural === name) {
        var re = new RegExp('\\s*this.resource\\((["\'])'+ name +'(["\'])\\);');
        newContent = oldContent.replace(re, '');
      } else {
        var re = new RegExp('\\s*this.resource\\((["\'])'+ name +'(["\']),.*\\);');
        newContent = oldContent.replace(re, '');
      }
      break;
  }

  fs.writeFileSync(routerPath, newContent);
}

function addRouteToRouter(name, options) {
  var type       = options.type || 'route';
  var routerPath = path.join(process.cwd(), 'app', 'router.js');
  var oldContent = fs.readFileSync(routerPath, 'utf-8');
  var existence  = new RegExp("(?:route|resource)\\s*\\(\\s*(['\"])" + name + "\\1");
  var newContent;
  var plural;

  if (existence.test(oldContent)) {
    return;
  }

  if (name === 'basic') { return; }

  switch (type) {
    case 'route':
      newContent = oldContent.replace(
        /(map\(function\(\) {[\s\S]+)}\)/,
        "$1  this.route('" + name + "');" + EOL + "})"
      );
      break;
    case 'resource':
      plural = inflection.pluralize(name);

      if (plural === name) {
        newContent = oldContent.replace(
          /(map\(function\(\) {[\s\S]+)}\)/,
          "$1  this.resource('" + name + "');" + EOL + "})"
        );
      } else {
        newContent = oldContent.replace(
          /(map\(function\(\) {[\s\S]+)}\)/,
          "$1  this.resource('" + name + "', { path: '" + plural + "/:" + name + "_id' });" + EOL + "})"
        );
      }
      break;
  }

  fs.writeFileSync(routerPath, newContent);
}

function addImportToTranslations(name, options) {
  var filePath = path.join(process.cwd(), 'app', 'translations', 'main.js'),
  oldContent = fs.readFileSync(filePath, 'utf-8'),
  existence  = new RegExp("import .*" + name, 'gi'),
  newContent,
 // importName = name.replace(/(.*)\/(.*)$/, '$2'); // gets last path name
  importName = name.replace(/[/]/gi, '_');

  var langs = ['en', 'es'];

  if (existence.test(oldContent)) {
    return;
  }

  newContent = oldContent.replace(
    /(\/\/ @imports[\s\S]+)(\/\/ @endImports)/,
    "$1import en_" + importName + " from 'app/translations/en/routes/" + name + "';" + "\n" +
    "import es_" + importName + " from 'app/translations/es/routes/" + name + "';" + EOL + "$2"
  );

  _.each(langs, function(l, i) {
    newContent = newContent.replace(
      new RegExp("\(\.\*extend\.\*\)\+\(\\)\)\(\.\*\\/\\/ @extend \("+l+"\)\)", 'gi'),
      "$1, $4_"+importName+")$3"
    );
  });

  fs.writeFileSync(filePath, newContent);
}

function removeImportFromTranslations(name, options) {
  var filePath = path.join(process.cwd(), 'app', 'translations', 'main.js'),
  oldContent = fs.readFileSync(filePath, 'utf-8'),
  existence  = new RegExp("import.*" + name + '.*', 'gi'),
  newContent,
  importName = name.replace(/[/]/gi, '_');

  if (!existence.test(oldContent)) {
    return;
  }

  var re = new RegExp("import.*" + name + '.*\\n', 'gi'),
  newContent = oldContent.replace(re, '');

  re = new RegExp('\,\*\\s\*\\\w+_\?' + importName, 'gi'),
  newContent = newContent.replace(re, '');

  fs.writeFileSync(filePath, newContent);
}
