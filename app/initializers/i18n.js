import Ember from 'ember';
import t from 'app/translations/main';

var key = (Ember.$.cookie('lang') || '').toLowerCase().replace(/[^a-z]*/gi, '').substr(0,2);

var TRANSLATIONS = t[key] || t.en;

var i18nInitializer = {
  name: 'i18n',
  initialize: function() {
    Ember.I18n.translations = TRANSLATIONS;
  }
};

export default i18nInitializer;
