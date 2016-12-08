'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CContactsSettingsPaneView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.contactsPerPageValues = ko.observableArray(Types.getAdaptedPerPageList(Settings.ContactsPerPage));
	
	this.contactsPerPage = ko.observable(Settings.ContactsPerPage);
}

_.extendOwn(CContactsSettingsPaneView.prototype, CAbstractSettingsFormView.prototype);

CContactsSettingsPaneView.prototype.ViewTemplate = '%ModuleName%_ContactsSettingsPaneView';

CContactsSettingsPaneView.prototype.getCurrentValues = function ()
{
	return [
		this.contactsPerPage()
	];
};

CContactsSettingsPaneView.prototype.revertTeamValues = function ()
{
	this.contactsPerPage(Settings.ContactsPerPage);
};

CContactsSettingsPaneView.prototype.getParametersForSave = function ()
{
	return {
		'ContactsPerPage': this.contactsPerPage()
	};
};

CContactsSettingsPaneView.prototype.applySavedValues = function (oParameters)
{
	Settings.update(oParameters.ContactsPerPage);
};

module.exports = new CContactsSettingsPaneView();
