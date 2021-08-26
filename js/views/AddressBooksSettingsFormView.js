'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass')
;

/**
 * @constructor
 */
function CAddressBooksSettingsFormView()
{
	CAbstractSettingsFormView.call(this);
	
	this.addressBooks = ko.observableArray([]);
	this.loading = ko.observable(false);
}

_.extendOwn(CAddressBooksSettingsFormView.prototype, CAbstractSettingsFormView.prototype);

CAddressBooksSettingsFormView.prototype.ViewTemplate = '%ModuleName%_AddressBooksSettingsFormView';

CAddressBooksSettingsFormView.prototype.onShow = function ()
{
	this.loading(true);
	Ajax.send('Contacts', 'GetAddressBooks', {}, function (oResponse) {
		this.loading(false);
		console.log('oResponse', oResponse);
		if (_.isArray(oResponse && oResponse.Result)) {
			this.addressBooks(oResponse.Result);
		} else {
			Api.showErrorByCode(oResponse);
		}
	}, this);
};

CAddressBooksSettingsFormView.prototype.addAddressBook = function ()
{
	console.log('addAddressBook');
};

CAddressBooksSettingsFormView.prototype.deleteAddressBook = function (sId)
{
	console.log('deleteAddressBook', sId);
};

module.exports = new CAddressBooksSettingsFormView();
