'use strict';

var
	$ = require('jquery'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	LinksUtils = {}
;

/**
 * @param {number=} iType
 * @param {string=} sGroupId
 * @param {string=} sSearch
 * @param {number=} iPage
 * @param {string=} sUid
 * @returns {Array}
 */
LinksUtils.getContacts = function (iType, sGroupId, sSearch, iPage, sUid)
{
	var aParams = [Settings.HashModuleName];
	
	if (typeof iType === 'number')
	{
		aParams.push(iType);
	}
	
	if (sGroupId && sGroupId !== '')
	{
		aParams.push(sGroupId);
	}
	
	if (sSearch && sSearch !== '')
	{
		aParams.push(sSearch);
	}
	
	if (Types.isNumber(iPage))
	{
		aParams.push('p' + iPage);
	}
	
	if (sUid && sUid !== '')
	{
		aParams.push('cnt' + sUid);
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
		iIdGroup = 0,
		sSearch = '',
		iPage = 1,
		iIdContact = 0
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
				iIdGroup = Types.pInt(aParam[iIndex]);
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
			iIdContact = Types.pInt(aParam[iIndex].substr(3));
			iIndex++;
		}
	}
	
	return {
		'Storage': sStorage,
		'IdGroup': iIdGroup,
		'Search': sSearch,
		'Page': iPage,
		'IdContact': iIdContact
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
	return ('cnt' === sTemp.substr(0, 3) && (/^[1-9][\d]*$/).test(sTemp.substr(3)));
};

module.exports = {
	getContacts: LinksUtils.getContacts,
	parseContacts: LinksUtils.parseContacts
};
