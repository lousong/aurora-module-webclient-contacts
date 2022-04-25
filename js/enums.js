'use strict';

var
	_ = require('underscore'),
	
	UserSettings = require('modules/%ModuleName%/js/Settings.js'),
	
	Enums = {}
;

Enums.ContactsPrimaryEmail = UserSettings.EContactsPrimaryEmail;
Enums.ContactsPrimaryPhone = UserSettings.EContactsPrimaryPhone;
Enums.ContactsPrimaryAddress = UserSettings.EContactsPrimaryAddress;
Enums.ContactSortField = UserSettings.EContactSortField;

/**
 * @enum {number}
 */
Enums.SharedAddressbookAccess = {
	'NoAccess': 0,
	'Write': 1,
	'Read': 2
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
