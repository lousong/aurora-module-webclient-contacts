'use strict';

var
	$ = require('jquery'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	LinksUtils = {}
;

/**
 * @param {number=} sStorage
 * @param {string=} sGroupUUID
 * @param {string=} sSearch
 * @param {number=} iPage
 * @param {string=} sContactUUID
 * @returns {Array}
 */
LinksUtils.getContacts = function (sStorage, sGroupUUID, sSearch, iPage, sContactUUID)
{
	var aParams = [Settings.HashModuleName];
	
	if (sStorage && sStorage !== '')
	{
		aParams.push(sStorage);
	}
	
	if (sGroupUUID && sGroupUUID !== '')
	{
		aParams.push(sGroupUUID);
	}
	
	if (sSearch && sSearch !== '')
	{
		aParams.push(sSearch);
	}
	
	if (Types.isNumber(iPage))
	{
		aParams.push('p' + iPage);
	}
	
	if (sContactUUID && sContactUUID !== '')
	{
		aParams.push('cnt' + sContactUUID);
	}
	
	return aParams;
};

/**
 * @param {Array} aParam
 * 
 * @return {Object}
 */
LinksUtils.parseContacts = function (aParam)
{
	var
		iIndex = 0,
		sStorage = '',
		sGroupUUID = '',
		sSearch = '',
		iPage = 1,
		sContactUUID = ''
	;

	if (Types.isNonEmptyArray(aParam))
	{
		sStorage = Types.pString(aParam[iIndex]);
		iIndex++;
		if (-1 === $.inArray(sStorage, Settings.Storages))
		{
			sStorage = Settings.DefaultStorage;
		}
		
		if (sStorage === 'group')
		{
			if (aParam.length > iIndex)
			{
				sGroupUUID = Types.pString(aParam[iIndex]);
				iIndex++;
			}
			else
			{
				sStorage = Settings.DefaultStorage;
			}
		}
		
		if (aParam.length > iIndex && !LinksUtils.isPageParam(aParam[iIndex]) && !LinksUtils.isContactParam(aParam[iIndex]))
		{
			sSearch = Types.pString(aParam[iIndex]);
			iIndex++;
		}
		
		if (aParam.length > iIndex && LinksUtils.isPageParam(aParam[iIndex]))
		{
			iPage = Types.pInt(aParam[iIndex].substr(1));
			iIndex++;
			if (iPage <= 0)
			{
				iPage = 1;
			}
		}
		
		if (aParam.length > iIndex && LinksUtils.isContactParam(aParam[iIndex]))
		{
			sContactUUID = Types.pString(aParam[iIndex].substr(3));
			iIndex++;
		}
	}
	
	return {
		'Storage': sStorage,
		'GroupUUID': sGroupUUID,
		'Search': sSearch,
		'Page': iPage,
		'ContactUUID': sContactUUID
	};
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
LinksUtils.isPageParam = function (sTemp)
{
	return ('p' === sTemp.substr(0, 1) && (/^[1-9][\d]*$/).test(sTemp.substr(1)));
};

/**
 * @param {string} sTemp
 * 
 * @return {boolean}
 */
LinksUtils.isContactParam = function (sTemp)
{
	return 'cnt' === sTemp.substr(0, 3);
};

module.exports = {
	getContacts: LinksUtils.getContacts,
	parseContacts: LinksUtils.parseContacts
};
