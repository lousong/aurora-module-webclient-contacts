'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
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
	this.populate();
};

CAddressBooksSettingsFormView.prototype.populate = function ()
{
	this.loading(true);
	Ajax.send('Contacts', 'GetAddressBooks', {}, function (oResponse) {
		this.loading(false);
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

CAddressBooksSettingsFormView.prototype.deleteAddressBook = function (sEntityId, sDisplayName)
{
	var
		sConfirm = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_ADDRESSBOOK', { 'NAME': sDisplayName }),
		fOnConfirm = _.bind(function (bOk) {
			if (bOk)
			{
				Ajax.send('Contacts', 'DeleteAddressBook', {'EntityId': sEntityId}, function (oResponse) {
					if (!oResponse || !oResponse.Result) {
						Api.showErrorByCode(oResponse);
					}
					this.populate();
				}, this);
			}
		}, this)
	;

	Popups.showPopup(ConfirmPopup, [sConfirm, fOnConfirm]);
};

module.exports = new CAddressBooksSettingsFormView();
