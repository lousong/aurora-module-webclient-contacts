'use strict';

var
	$ = require('jquery'),
	ko = require('knockout'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
 * @constructor
 */
function CMobileSyncSettingsView()
{
	this.bVisiblePersonalContacts = -1 !== $.inArray('personal', Settings.Storages);
	this.bVisibleSharedWithAllContacts = -1 !== $.inArray('shared', Settings.Storages);
	this.bVisibleGlobalContacts = -1 !== $.inArray('global', Settings.Storages);

	this.davPersonalContactsUrl = ko.observable('');
	this.davCollectedAddressesUrl = ko.observable('');
	this.davSharedWithAllUrl = ko.observable('');
	this.davGlobalAddressBookUrl = ko.observable('');
}

CMobileSyncSettingsView.prototype.ViewTemplate = '%ModuleName%_MobileSyncSettingsView';

/**
 * @param {Object} oDav
 */
CMobileSyncSettingsView.prototype.populate = function (oDav)
{
	if (oDav.Contacts)
	{
		this.davPersonalContactsUrl(oDav.Contacts.PersonalContactsUrl);
		this.davCollectedAddressesUrl(oDav.Contacts.CollectedAddressesUrl);
		this.davSharedWithAllUrl(oDav.Contacts.SharedWithAllUrl);
		this.davGlobalAddressBookUrl(oDav.Contacts.GlobalAddressBookUrl);
	}
};

module.exports = new CMobileSyncSettingsView();
