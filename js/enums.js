'use strict';

var
	_ = require('underscore'),
	
	UserSettings = require('modules/%ModuleName%/js/Settings.js'),
	
	Enums = {}
;

Enums.ContactsStorage = UserSettings.EContactsStorage;
Enums.ContactsStorage.SubGroup = 4;
Enums.ContactsPrimaryEmail = UserSettings.EContactsPrimaryEmail;
Enums.ContactsPrimaryPhone = UserSettings.EContactsPrimaryPhone;
Enums.ContactsPrimaryAddress = UserSettings.EContactsPrimaryAddress;
Enums.ContactSortField = UserSettings.EContactSortField;

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
