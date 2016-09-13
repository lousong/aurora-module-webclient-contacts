'use strict';

module.exports = function () {
	var
		_ = require('underscore'),

		ManagerSuggestions = require('modules/%ModuleName%/js/manager-suggestions.js'),
		SuggestionsMethods = ManagerSuggestions(),
		ContactCard = require('modules/%ModuleName%/js/ContactCard.js')
	;

	return _.extend({
		start: function (ModulesManager) {
			ModulesManager.run('MailWebclient', 'registerMessagePaneController', [require('modules/%ModuleName%/js/views/VcardAttachmentView.js'), 'BeforeMessageBody']);
		},
		applyContactsCards: function ($Addresses) {
			ContactCard.applyTo($Addresses);
		}
	}, SuggestionsMethods);
};
