'use strict';

module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		$ = require('jquery'),
		
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		oSettings = _.extend({}, oAppData[Settings.ServerModuleName] || {}, oAppData['%ModuleName%'] || {}),
		
		ManagerSuggestions = require('modules/%ModuleName%/js/manager-suggestions.js'),
		SuggestionsMethods = ManagerSuggestions(),

		ManagerComponents = require('modules/%ModuleName%/js/manager-components.js'),
		ComponentsMethods = ManagerComponents(),
		fComponentsStart = ComponentsMethods.start
	;

	Settings.init(oSettings);
	
	require('modules/%ModuleName%/js/enums.js');
	
	if (App.getUserRole() === Enums.UserRole.NormalUser)
	{
		if (App.isMobile())
		{
			return _.extend({
				start: function (ModulesManager) {
					App.subscribeEvent('MailWebclient::RegisterMessagePaneController', function (fRegisterMessagePaneController) {
						fRegisterMessagePaneController(require('modules/%ModuleName%/js/views/VcardAttachmentView.js'), 'BeforeMessageBody');
					});
				},
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						return require('modules/%ModuleName%/js/views/ContactsView.js');
					};
					return oScreens;
				},
				getHeaderItem: function () {
					return {
						item: require('modules/%ModuleName%/js/views/HeaderItemView.js'),
						name: Settings.HashModuleName
					};
				}
			}, SuggestionsMethods);
		}
		else if (App.isNewTab())
		{
			return ComponentsMethods;
		}
		else
		{
			require('modules/%ModuleName%/js/MainTabExtMethods.js');
			
			return _.extend(ComponentsMethods, {
				start: function (ModulesManager) {
					ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [function () { return require('modules/%ModuleName%/js/views/ContactsSettingsPaneView.js'); }, Settings.HashModuleName, TextUtils.i18n('%MODULENAME%/LABEL_SETTINGS_TAB')]);
					if ($.isFunction(fComponentsStart))
					{
						fComponentsStart(ModulesManager);
					}
				},
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						return require('modules/%ModuleName%/js/views/ContactsView.js');
					};
					return oScreens;
				},
				getHeaderItem: function () {
					return {
						item: require('modules/%ModuleName%/js/views/HeaderItemView.js'),
						name: Settings.HashModuleName
					};
				},
				isTeamContactsAllowed: function () {
					return _.indexOf(Settings.Storages, 'team') !== -1;
				},
				getMobileSyncSettingsView: function () {
					return require('modules/%ModuleName%/js/views/MobileSyncSettingsView.js');
				}
			});
		}
	}
	
	return null;
};
