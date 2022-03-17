'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	
	AddressUtils = require('%PathToCoreWebclientModule%/js/utils/Address.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js')
;

/**
 * 
 * @param {object} oRequest
 * @param {function} fResponse
 * @param {string} storage
 * @param {boolean} addContactGroups
 * @param {boolean} addUserGroups
 * @param {string} exceptEmail
 * @returns {undefined}
 */
function Callback(oRequest, fResponse, {storage = 'all', addContactGroups = false, addUserGroups = false, exceptEmail = ''})
{
	var
		sTerm = oRequest.term,
		oParameters = {
			'Search': sTerm,
			'Storage': storage,
			'SortField': Enums.ContactSortField.Frequency,
			'SortOrder': 1,
			'WithGroups': addContactGroups,
			'WithUserGroups': addUserGroups,
			'WithoutTeamContactsDuplicates': true
		}
	;

	Ajax.send('GetContactSuggestions', oParameters, function (oResponse) {
		var aList = [];
		if (oResponse && oResponse.Result && oResponse.Result.List)
		{
			aList = _.map(oResponse.Result.List, function (oItem) {
				var
					sValue = oItem.ViewEmail,
					sLabel = ''
				;
				if (oItem.FullName && 0 < $.trim(oItem.FullName).length)
				{
					if (oItem.ForSharedToAll)
					{
						sValue = oItem.FullName;
					}
					else if (oItem.IsGroup)
					{
						sLabel = ('"' + oItem.FullName + '" (' + oItem.ViewEmail + ')');
						sValue = oItem.ViewEmail;
					}
					else
					{
						sValue = ('"' + oItem.FullName + '" <' + oItem.ViewEmail + '>');
					}
				} else if (oItem.IsGroup && oItem.Name) {
					return {
						label: oItem.Name,
						value: oItem.Name,
						name: oItem.Name,
						email: oItem.Name,
						groupId: oItem.Id
					};
				}
				if (oItem && oItem.ViewEmail && oItem.ViewEmail !== exceptEmail) {
					return {
						label: sLabel ? sLabel : sValue,
						value: sValue,
						name: oItem.FullName,
						email: oItem.ViewEmail,
						frequency: oItem.Frequency,
						id: oItem.UUID,
						storage: oItem.Storage,
						team: oItem.Storage === 'team',
						sharedToAll: oItem.Storage === 'shared',
						hasKey: oItem.HasPgpPublicKey,
						encryptMessage: oItem.PgpEncryptMessages,
						signMessage: oItem.PgpSignMessages
					};
				}
				return null;
			});

			aList = _.sortBy(_.compact(aList), function(oItem){
				return -oItem.frequency;
			});
		}

		fResponse(aList);

	});
}

/**
 * @param {Object} oContact
 */
function DeleteHandler(oContact)
{
	Ajax.send('UpdateContact', { 'Contact': { 'UUID': oContact.id, 'Frequency': -1, 'Storage': oContact.storage } });
}

module.exports = {
	callback: Callback,
	deleteHandler: DeleteHandler
};
