'use strict';

var
	_ = require('underscore'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js')
;

module.exports = {
	ServerModuleName: 'Contacts',
	HashModuleName: 'contacts',
	
	ContactsPerPage: 20,
	ImportContactsLink: '',
	Storages: ['personal', 'global', 'shared'],
	DefaultStorage: 'personal',
	
	init: function (oAppDataSection) {
		if (oAppDataSection)
		{
			this.ContactsPerPage = Types.pInt(oAppDataSection.ContactsPerPage);
			this.ImportContactsLink = Types.pString(oAppDataSection.ImportingContacts);
			this.Storages = _.isArray(oAppDataSection.Storages) ? oAppDataSection.Storages : [];
			this.Storages.push('all');
			this.Storages.push('group');
			
			this.EContactsPrimaryEmail = oAppDataSection.EContactsPrimaryEmail;
			this.EContactsPrimaryPhone = oAppDataSection.EContactsPrimaryPhone;
			this.EContactsPrimaryAddress = oAppDataSection.EContactsPrimaryAddress;
			this.EContactSortField = oAppDataSection.EContactSortField;
		}
	}
};