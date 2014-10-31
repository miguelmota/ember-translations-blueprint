# Ember Translations Blueprint

[Ember CLI](http://www.ember-cli.com/) blueprint to generate translation files following the route structure.

Can be used in conjuction with [Ember-I18n](https://github.com/jamesarosen/ember-i18n). Take a look at the example `app/` files.

Not an "out-of-the-box" solution, you will need to teak `blueprints/index.js` for your own project.

# Usage

```bash
ember g route dashboard/settings
```

```bash
create app/routes/dashboard/settings.js
create app/templates/dashboard/settings.hbs
create app/translations/en/routes/dashboard/settings.js
create app/translations/es/routes/dashboard/settings.js
create tests/unit/routes/dashboard/settings-test.js
```

# License

MIT
