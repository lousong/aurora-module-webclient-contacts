'use strict';

module.exports = function () {
	var
		_ = require('underscore'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),

		ManagerSuggestions = require('modules/%ModuleName%/js/manager-suggestions.js'),
		SuggestionsMethods = ManagerSuggestions()
	;

	return _.extend({
		start: function (ModulesManager) {
			App.subscribeEvent('MailWebclient::RegisterMessagePaneController', function (fRegisterMessagePaneController) {
				fRegisterMessagePaneController(require('modules/%ModuleName%/js/views/VcardAttachmentView.js'), 'BeforeMessageBody');
			});
		},
		applyContactsCards: function ($Addresses) {
			var ContactCard = require('modules/%ModuleName%/js/ContactCard.js');
			ContactCard.applyTo($Addresses);
		}
	}, SuggestionsMethods);
};
