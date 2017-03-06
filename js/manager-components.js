'use strict';

module.exports = function () {
	var
		_ = require('underscore'),

		ManagerSuggestions = require('modules/%ModuleName%/js/manager-suggestions.js'),
		SuggestionsMethods = ManagerSuggestions()
	;

	return _.extend({
		start: function (ModulesManager) {
			ModulesManager.run('MailWebclient', 'registerMessagePaneController', [require('modules/%ModuleName%/js/views/VcardAttachmentView.js'), 'BeforeMessageBody']);
		},
		applyContactsCards: function ($Addresses) {
			var ContactCard = require('modules/%ModuleName%/js/ContactCard.js');
			ContactCard.applyTo($Addresses);
		}
	}, SuggestionsMethods);
};
