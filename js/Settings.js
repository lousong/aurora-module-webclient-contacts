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
	AddressBooks: [],
	Storages: [],
	DefaultStorage: 'personal',
	ImportExportFormats: [],
	SaveVcfServerModuleName: '',

	EContactsPrimaryEmail: {},
	EContactsPrimaryPhone: {},
	EContactsPrimaryAddress: {},
	EContactSortField: {},
	
	/**
	 * Initializes settings from AppData object sections.
	 * 
	 * @param {Object} oAppData Object contained modules settings.
	 */
	init: function (oAppData)
	{
		var oAppDataSection = oAppData[this.ServerModuleName];
		
		if (!_.isEmpty(oAppDataSection))
		{
			this.ContactsPerPage = Types.pPositiveInt(oAppDataSection.ContactsPerPage, this.ContactsPerPage);
			this.ImportContactsLink = Types.pString(oAppDataSection.ImportContactsLink, this.ImportContactsLink);

			var aStorages = Types.pArray(oAppDataSection.Storages, this.Storages);
			this.AddressBooks = _.filter(aStorages, function (oStorage) {
				return _.indexOf(['personal', 'collected', 'shared', 'team'], oStorage.Id) === -1;
			});
			this.Storages = _.map(aStorages, function (oStorage) {
				return oStorage.Id;
			});
			if (this.Storages.length > 0)
			{
				this.Storages.push('all');
				this.Storages.push('group');
			}
			console.log('this.Storages', this.Storages);

			this.ImportExportFormats = Types.pArray(oAppDataSection.ImportExportFormats, this.ImportExportFormats);
			this.SaveVcfServerModuleName = Types.pString(oAppDataSection.SaveVcfServerModuleName, this.SaveVcfServerModuleName);
			
			this.EContactsPrimaryEmail = Types.pObject(oAppDataSection.PrimaryEmail);
			this.EContactsPrimaryPhone = Types.pObject(oAppDataSection.PrimaryPhone);
			this.EContactsPrimaryAddress = Types.pObject(oAppDataSection.PrimaryAddress);
			this.EContactSortField = Types.pObject(oAppDataSection.SortField);
		}
	},
	
	/**
	 * Updates contacts per page after saving to server.
	 * 
	 * @param {number} iContactsPerPage
	 */
	update: function (iContactsPerPage)
	{
		this.ContactsPerPage = iContactsPerPage;
	}
};
