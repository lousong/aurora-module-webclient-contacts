'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	Utils = require('%PathToCoreWebclientModule%/js/utils/Common.js'),
	
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	CJua = require('%PathToCoreWebclientModule%/js/CJua.js'),
	CSelector = require('%PathToCoreWebclientModule%/js/CSelector.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	Screens = require('%PathToCoreWebclientModule%/js/Screens.js'),
	
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	CPageSwitcherView = require('%PathToCoreWebclientModule%/js/views/CPageSwitcherView.js'),
	
	Popups = require('%PathToCoreWebclientModule%/js/Popups.js'),
	ConfirmPopup = require('%PathToCoreWebclientModule%/js/popups/ConfirmPopup.js'),
	
	LinksUtils = require('modules/%ModuleName%/js/utils/Links.js'),
	
	Ajax = require('modules/%ModuleName%/js/Ajax.js'),
	ContactsCache = require('modules/%ModuleName%/js/Cache.js'),
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	CContactListItemModel = require('modules/%ModuleName%/js/models/CContactListItemModel.js'),
	CContactModel = require('modules/%ModuleName%/js/models/CContactModel.js'),
	CGroupModel = require('modules/%ModuleName%/js/models/CGroupModel.js'),
	
	CImportView = require('modules/%ModuleName%/js/views/CImportView.js')
;

/**
 * @constructor
 */
function CContactsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.browserTitle = ko.observable(TextUtils.i18n('%MODULENAME%/HEADING_BROWSER_TAB'));
	
	this.contactCount = ko.observable(0);
	this.uploaderArea = ko.observable(null);
	this.bDragActive = ko.observable(false);
	this.bDragActiveComp = ko.computed(function () {
		return this.bDragActive();
	}, this);

	this.sImportContactsLink = Settings.ImportContactsLink;

	this.allowSendEmails = ko.observable(false);
//	this.allowSendEmails = ko.computed(function () {
//		return AppData.App.AllowWebMail && AppData.Accounts.isCurrentAllowsMail();
//	}, this);
	this.loadingList = ko.observable(false);
	this.preLoadingList = ko.observable(false);
	this.loadingList.subscribe(function (bLoading) {
		this.preLoadingList(bLoading);
	}, this);
	this.loadingViewPane = ko.observable(false);
	
	this.showPersonalContacts = ko.observable(false);
	this.showGlobalContacts = ko.observable(false);
	this.showSharedToAllContacts = ko.observable(false);

	this.showAllContacts = ko.computed(function () {
		return 1 < [this.showPersonalContacts() ? '1' : '',
			this.showGlobalContacts() ? '1' : '',
			this.showSharedToAllContacts() ? '1' : ''
		].join('').length;
	}, this);
	
	this.recivedAnimShare = ko.observable(false).extend({'autoResetToFalse': 500});
	this.recivedAnimUnshare = ko.observable(false).extend({'autoResetToFalse': 500});

	this.isGlobalStorageSelected = ko.observable(false);
	this.isNotGlobalStorageSelected = ko.observable(false);
	this.allowDropToPersonal = ko.observable(false);
	this.hiddenSelectedStorage = ko.observable(Settings.DefaultStorage);
	this.selectedStorage = ko.computed({
		'read': function () {
			return this.hiddenSelectedStorage();
		},
		'write': function (sValue) {
			this.hiddenSelectedStorage(($.inArray(sValue, Settings.Storages) !== -1) ? sValue : Settings.DefaultStorage);
			if (this.hiddenSelectedStorage() !== 'group')
			{
				this.selectedGroupInList(null);
				this.selectedItem(null);
				this.selector.listCheckedOrSelected(false);
				this.requestContactList();
				this.currentGroupUUID('');
			}
			this.isGlobalStorageSelected(this.hiddenSelectedStorage() === 'global');
			this.isNotGlobalStorageSelected(this.hiddenSelectedStorage() !== 'global');
			this.allowDropToPersonal(this.hiddenSelectedStorage() === 'group' || this.isGlobalStorageSelected() || this.hiddenSelectedStorage() === 'all');
		},
		'owner': this
	});

	this.selectedGroupInList = ko.observable(null);

	this.selectedGroupInList.subscribe(function () {
		var oPrev = this.selectedGroupInList();
		if (oPrev)
		{
			oPrev.selected(false);
		}
	}, this, 'beforeChange');

	this.selectedGroupInList.subscribe(function (oGroup) {
		if (oGroup && this.showPersonalContacts())
		{
			oGroup.selected(true);
			this.selectedStorage('group');
			this.requestContactList();
		}
	}, this);

	this.selectedGroup = ko.observable(null);
	this.selectedContact = ko.observable(null);
	this.selectedGroupEmails = ko.observableArray([]);
	
	this.currentGroupUUID = ko.observable('');

	this.oContactModel = new CContactModel();
	this.oGroupModel = new CGroupModel();
	
	this.oImportView = new CImportView(this);

	this.selectedOldItem = ko.observable(null);
	this.selectedItem = ko.computed({
		'read': function () {
			return this.selectedContact() || this.selectedGroup() || null;
		},
		'write': function (oItem) {
			if (oItem instanceof CContactModel)
			{
				this.oImportView.visibility(false);
				this.selectedGroup(null);
				this.selectedContact(oItem);
			}
			else if (oItem instanceof CGroupModel)
			{
				this.oImportView.visibility(false);
				this.selectedContact(null);
				this.selectedGroup(oItem);
				this.currentGroupUUID(oItem.uuid());
			}
			else
			{
				this.selectedGroup(null);
				this.selectedContact(null);
			}

			this.loadingViewPane(false);
		},
		'owner': this
	});

	this.collection = ko.observableArray([]);
	this.contactUidForRequest = ko.observable('');
	this.collection.subscribe(function () {
		if (this.collection().length > 0 && this.contactUidForRequest() !== '')
		{
			this.requestContact(this.contactUidForRequest());
			this.contactUidForRequest('');
		}
	}, this);
	
	this.isSearchFocused = ko.observable(false);
	this.searchInput = ko.observable('');
	this.search = ko.observable('');

	this.groupFullCollection = ko.observableArray([]);

	this.selectedContact.subscribe(function (oContact) {
		if (oContact)
		{
			var aGroupUUIDs = oContact.groups();
			_.each(this.groupFullCollection(), function (oItem) {
				oItem.checked(oItem && 0 <= $.inArray(oItem.UUID(), aGroupUUIDs));
			});
		}
	}, this);

	this.pageSwitcherLocked = ko.observable(false);
	this.oPageSwitcher = new CPageSwitcherView(0, Settings.ContactsPerPage);
	this.oPageSwitcher.currentPage.subscribe(function () {
		if (!this.pageSwitcherLocked())
		{
			Routing.setHash(LinksUtils.getContacts(this.selectedStorage(), this.currentGroupUUID(), this.search(), this.oPageSwitcher.currentPage()));
		}
	}, this);
	this.currentPage = ko.observable(1);

	this.search.subscribe(function (sValue) {
		this.searchInput(sValue);
	}, this);

	this.searchSubmitCommand = Utils.createCommand(this, function () {
		Routing.setHash(LinksUtils.getContacts(this.selectedStorage(), this.currentGroupUUID(), this.searchInput()));
	});

	this.searchMessagesInInbox = ModulesManager.run('MailWebclient', 'getSearchMessagesInInbox');
	this.bAllowSearchMessagesInInbox = $.isFunction(this.searchMessagesInInbox);
	this.composeMessageToAddresses = ModulesManager.run('MailWebclient', 'getComposeMessageToAddresses');
	this.bAllowComposeMessageToAddresses = $.isFunction(this.composeMessageToAddresses);
	this.selector = new CSelector(this.collection, _.bind(this.viewContact, this), _.bind(this.deleteContact, this), this.bAllowComposeMessageToAddresses ? _.bind(this.composeMessageToContact, this) : null);

	this.checkAll = this.selector.koCheckAll();
	this.checkAllIncomplite = this.selector.koCheckAllIncomplete();

	this.isCheckedOrSelected = ko.computed(function () {
		return 0 < this.selector.listCheckedOrSelected().length;
	}, this);
	this.isEnableAddContacts = this.isCheckedOrSelected;
	this.isEnableRemoveContactsFromGroup = this.isCheckedOrSelected;
	this.isEnableDeleting = this.isCheckedOrSelected;
	this.isEnableSharing = this.isCheckedOrSelected;
	this.visibleShareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'personal';
	}, this);
	this.visibleUnshareCommand = ko.computed(function () {
		return this.showPersonalContacts() && this.showSharedToAllContacts() && this.selectedStorage() === 'shared';
	}, this);

	this.isExport = ko.computed(function () {
		return this.contactCount();
	}, this);
	
	this.isExactlyOneContactSelected = ko.computed(function () {
		return 1 === this.selector.listCheckedOrSelected().length;
	}, this);

	this.newContactCommand = Utils.createCommand(this, this.executeNewContact, this.isNotGlobalStorageSelected);
	this.newGroupCommand = Utils.createCommand(this, this.executeNewGroup);
	this.addContactsCommand = Utils.createCommand(this, function () {}, this.isEnableAddContacts);
	this.deleteCommand = Utils.createCommand(this, this.deleteContact, this.isEnableDeleting);
	this.shareCommand = Utils.createCommand(this, this.executeShare, this.isEnableSharing);
	this.removeFromGroupCommand = Utils.createCommand(this, this.executeRemoveFromGroup, this.isEnableRemoveContactsFromGroup);
	this.importCommand = Utils.createCommand(this, this.executeImport);
	this.exportCSVCommand = Utils.createCommand(this, this.executeCSVExport, this.isExport);
	this.exportVCFCommand = Utils.createCommand(this, this.executeVCFExport, this.isExport);
	this.saveCommand = Utils.createCommand(this, this.executeSave);
	this.updateSharedToAllCommand = Utils.createCommand(this, this.executeUpdateSharedToAll, this.isExactlyOneContactSelected);
	this.composeMessageCommand = Utils.createCommand(this, this.composeMessage, this.isCheckedOrSelected);

	this.selector.listCheckedOrSelected.subscribe(function (aList) {
		this.oGroupModel.newContactsInGroupCount(aList.length);
	}, this);

	this.isSearch = ko.computed(function () {
		return this.search() !== '';
	}, this);
	this.isEmptyList = ko.computed(function () {
		return 0 === this.collection().length;
	}, this);

	this.searchText = ko.computed(function () {
		return TextUtils.i18n('%MODULENAME%/INFO_SEARCH_RESULT', {
			'SEARCH': this.search()
		});
	}, this);
	
	this.bVisibleDragNDropDescription = !App.isMobile();
	this.sGroupsToolbarTemplate = App.isMobile() ? '%ModuleName%_Toolbar_GroupsMobileView' : '%ModuleName%_Toolbar_GroupsView';
	this.sContactsToolbarTemplate = App.isMobile() ? '%ModuleName%_Toolbar_ContactsMobileView' : '%ModuleName%_Toolbar_ContactsView';
	this.sBeforeContactToolbarTemplate = App.isMobile() ? '%ModuleName%_Toolbar_ContactMobileView' : '';
	this.sContactToolbarTemplate = App.isMobile() ? '' : '%ModuleName%_Toolbar_ContactView';
	this.selectedPanel = ko.observable(Enums.MobilePanel.Items);
	this.selectedItem.subscribe(function () {
		
		var bViewGroup = this.selectedItem() && this.selectedItem() instanceof CGroupModel &&
				!this.selectedItem().isNew();
		
		if (this.selectedItem() && !bViewGroup)
		{
			this.gotoViewPane();
		}
		else
		{
			this.gotoContactList();
		}
	}, this);
	
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CContactsView.prototype, CAbstractScreenView.prototype);

CContactsView.prototype.ViewTemplate = '%ModuleName%_ContactsScreenView';
CContactsView.prototype.ViewConstructorName = 'CContactsView';

/**
 * 
 * @param {?} mValue
 * @param {Object} oElement
 */
CContactsView.prototype.groupDropdownToggle = function (mValue, oElement) {
	this.currentGroupDropdown(mValue);
};

CContactsView.prototype.gotoGroupList = function ()
{
	this.changeSelectedPanel(Enums.MobilePanel.Groups);
};

CContactsView.prototype.gotoContactList = function ()
{
	this.changeSelectedPanel(Enums.MobilePanel.Items);
	return true;
};

CContactsView.prototype.gotoViewPane = function ()
{
	this.changeSelectedPanel(Enums.MobilePanel.View);
};

CContactsView.prototype.backToContactList = function ()
{
	Routing.setHash(LinksUtils.getContacts(this.selectedStorage(), this.currentGroupUUID(), this.search(), this.oPageSwitcher.currentPage()));
};

/**
 * @param {number} iPanel
 */
CContactsView.prototype.changeSelectedPanel = function (iPanel)
{
	if (App.isMobile())
	{
		this.selectedPanel(iPanel);
	}
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.executeSave = function (oData)
{
	var
		oContact = {},
		aList = []
	;

	if (oData === this.selectedItem() && this.selectedItem().canBeSave())
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			_.each(this.groupFullCollection(), function (oItem) {
				if (oItem && oItem.checked())
				{
					aList.push(oItem.UUID());
				}
			});

			oData.groups(aList);

			if (oData.edited())
			{
				oData.edited(false);
			}

			if (this.selectedItem())
			{
				ContactsCache.clearInfoAboutEmail(this.selectedItem().email());
			}

			if (oData.isNew())
			{
				this.selectedItem(null);
			}
			
			if (this.selectedStorage() === 'global' || this.selectedStorage() === 'all')
			{
				this.recivedAnimUnshare(true);
			}

			oContact = oData.toObject();
			
			if (oData.isNew())
			{
				oContact.Storage = 'personal';
			}

			Ajax.send(oData.isNew() ? 'CreateContact' : 'UpdateContact', { Contact: oContact }, this.onCreateContactResponse, this);
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			this.gotoGroupList();
			
			if (oData.edited())
			{
				oData.edited(false);
			}

			if (oData.isNew() && !App.isMobile())
			{
				this.selectedItem(null);
			}
			
			var aContactUUIDs = _.map(this.selector.listCheckedOrSelected(), function (oItem) { return oItem.UUID(); });
			Ajax.send(oData.isNew() ? 'CreateGroup' : 'UpdateGroup', {'Group': oData.toObject(aContactUUIDs)}, this.onCreateGroupResponse, this);
		}
	}
	else
	{
		Screens.showError(TextUtils.i18n('%MODULENAME%/ERROR_EMAIL_OR_NAME_BLANK'));
	}
};

CContactsView.prototype.executeNewContact = function ()
{
	if (this.showPersonalContacts())
	{
		var oGr = this.selectedGroupInList();
		this.oContactModel.switchToNew();
		this.oContactModel.groups(oGr ? [oGr.UUID()] : []);
		this.selectedItem(this.oContactModel);
		this.selector.itemSelected(null);
		this.gotoViewPane();
	}
};

CContactsView.prototype.executeNewGroup = function ()
{
	this.oGroupModel.switchToNew();
	this.selectedItem(this.oGroupModel);
	this.selector.itemSelected(null);
	this.gotoViewPane();
};

CContactsView.prototype.deleteContact = function ()
{
	var sStorage = this.selectedStorage();
	if (sStorage === 'personal' || sStorage === 'shared')
	{
		var
			aChecked = _.filter(this.selector.listCheckedOrSelected(), function (oItem) {
				return !oItem.ReadOnly();
			}),
			iCount = aChecked.length,
			sConfirmText = TextUtils.i18n('%MODULENAME%/CONFIRM_DELETE_CONTACTS_PLURAL', {}, null, iCount),
			fDeleteContacts = _.bind(function (bResult) {
				if (bResult)
				{
					this.deleteContacts(aChecked);
				}
			}, this)
			;

		Popups.showPopup(ConfirmPopup, [sConfirmText, fDeleteContacts]);
	}
	else if (sStorage === 'group')
	{
		this.removeFromGroupCommand();
	}
};

CContactsView.prototype.deleteContacts = function (aChecked)
{
	var
		self = this,
		oMainContact = this.selectedContact(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.UUID();
		})
	;

	if (0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());

				if (oMainContact && !oContact.IsGroup() && !oContact.ReadOnly() && !oMainContact.readOnly() && oMainContact.uuid() === oContact.UUID())
				{
					oMainContact = null;
					this.selectedContact(null);
				}
			}
		}, this);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('DeleteContacts', { 'ContactUUIDs': aContactUUIDs }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_DELETE_CONTACTS'));
			}
			this.requestContactList();
		}, this);
		
		ContactsCache.markVcardsNonexistentByUid(aContactUUIDs);
	}
};

CContactsView.prototype.executeRemoveFromGroup = function ()
{
	var
		self = this,
		oGroup = this.selectedGroupInList(),
		aChecked = this.selector.listCheckedOrSelected(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.ReadOnly() ? '' : oItem.UUID();
		})
	;

	aContactUUIDs = _.compact(aContactUUIDs);

	if (oGroup && 0 < aContactUUIDs.length)
	{
		this.preLoadingList(true);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		Ajax.send('RemoveContactsFromGroup', {
			'GroupUUID': oGroup.UUID(),
			'ContactUUIDs': aContactUUIDs
		}, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestContactList();
		}, this);
	}
};

CContactsView.prototype.executeImport = function ()
{
	this.selectedItem(null);
	this.oImportView.visibility(true);
	this.selector.itemSelected(null);
	this.selectedStorage('personal');
	this.gotoViewPane();
};

CContactsView.prototype.executeCSVExport = function ()
{
	UrlUtils.downloadByUrl('?/Download/' + Settings.ServerModuleName + '/DownloadContactsAsCSV/');
};

CContactsView.prototype.executeVCFExport = function ()
{
	UrlUtils.downloadByUrl('?/Download/' + Settings.ServerModuleName + '/DownloadContactsAsVCF/');
};

CContactsView.prototype.executeCancel = function ()
{
	var
		oData = this.selectedItem()
	;

	if (oData)
	{
		if (oData instanceof CContactModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				this.selectedItem(null);
			}
			else if (oData.edited())
			{
				oData.edited(false);
			}
		}
		else if (oData instanceof CGroupModel && !oData.readOnly())
		{
			if (oData.isNew())
			{
				this.selectedItem(null);
			}
			else if (oData.edited())
			{
				this.selectedItem(this.selectedOldItem());
				oData.edited(false);
			}
			this.gotoGroupList();
		}
	}

	this.oImportView.visibility(false);
};

/**
 * @param {Object} oGroup
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroup = function (oGroup, aContactUUIDs)
{
	if (oGroup && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		oGroup.recivedAnim(true);

		this.executeAddContactsToGroupUUID(oGroup.UUID(), aContactUUIDs);
	}
};

/**
 * @param {string} sGroupUUID
 * @param {Array} aContactUUIDs
 */
CContactsView.prototype.executeAddContactsToGroupUUID = function (sGroupUUID, aContactUUIDs)
{
	if (sGroupUUID && _.isArray(aContactUUIDs) && 0 < aContactUUIDs.length)
	{
		Ajax.send('AddContactsToGroup', {
			'GroupUUID': sGroupUUID,
			'ContactUUIDs': aContactUUIDs
		}, this.onAddContactsToGroupResponse, this);
	}
};

CContactsView.prototype.onAddContactsToGroupResponse = function (oResponse)
{
	if (!oResponse.Result)
	{
		Api.showErrorByCode(oResponse);
	}
	this.requestContactList();
	if (this.selector.itemSelected())
	{
		this.requestContact(this.selector.itemSelected().UUID());
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.executeAddSelectedContactsToGroup = function (oGroup)
{
	var
		aList = this.selector.listCheckedOrSelected(),
		aContactUUIDs = []
	;

	if (oGroup && _.isArray(aList) && 0 < aList.length)
	{
		_.each(aList, function (oItem) {
			if (oItem && !oItem.IsGroup())
			{
				aContactUUIDs.push(oItem.UUID());
			}
		}, this);
	}

	this.executeAddContactsToGroup(oGroup, aContactUUIDs);
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.groupsInContactView = function (oContact)
{
	var
		aResult = [],
		aGroupUUIDs = []
	;
	
	if (oContact && !oContact.groupsIsEmpty())
	{
		aGroupUUIDs = oContact.groups();
		aResult = _.filter(this.groupFullCollection(), function (oItem) {
			return 0 <= $.inArray(oItem.UUID(), aGroupUUIDs);
		});
	}
	
	return aResult;
};

CContactsView.prototype.onShow = function ()
{
	this.selector.useKeyboardKeys(true);
	
	this.oPageSwitcher.show();
	this.oPageSwitcher.perPage(Settings.ContactsPerPage);

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(true);
	}
};

CContactsView.prototype.onHide = function ()
{
	this.selector.listCheckedOrSelected(false);
	this.selector.useKeyboardKeys(false);
	this.selectedItem(null);
	
	this.oPageSwitcher.hide();

	if (this.oJua)
	{
		this.oJua.setDragAndDropEnabledStatus(false);
	}
};

CContactsView.prototype.onBind = function ()
{
	this.selector.initOnApplyBindings(
		'.contact_sub_list .item',
		'.contact_sub_list .selected.item',
		'.contact_sub_list .item .custom_checkbox',
		$('.contact_list', this.$viewDom),
		$('.contact_list_scroll.scroll-inner', this.$viewDom)
	);

	var self = this;

	this.$viewDom.on('click', '.content .item.add_to .dropdown_helper .item', function () {

		if ($(this).hasClass('new-group'))
		{
			self.executeNewGroup();
		}
		else
		{
			self.executeAddSelectedContactsToGroup(ko.dataFor(this));
		}
	});

	this.showPersonalContacts(-1 !== $.inArray('personal', Settings.Storages));
	this.showGlobalContacts(-1 !== $.inArray('global', Settings.Storages));
	this.showSharedToAllContacts(-1 !== $.inArray('shared', Settings.Storages));
	
	this.selectedStorage(this.selectedStorage());
	
	this.oImportView.onBind();
	this.requestGroupFullList();

	this.hotKeysBind();

	this.initUploader();
};

CContactsView.prototype.hotKeysBind = function ()
{
	var bFirstContactFlag = false;

	$(document).on('keydown', _.bind(function(ev) {
		var
			nKey = ev.keyCode,
			oFirstContact = this.collection()[0],
			bListIsFocused = this.isSearchFocused(),
			bFirstContactSelected = false
		;

		if (this.shown() && !Utils.isTextFieldFocused() && !bListIsFocused && ev && nKey === Enums.Key.s)
		{
			ev.preventDefault();
			this.searchFocus();
		}

		else if (oFirstContact)
		{
			bFirstContactSelected = oFirstContact.selected();

			if (oFirstContact && bListIsFocused && ev && nKey === Enums.Key.Down)
			{
				this.isSearchFocused(false);
				this.selector.itemSelected(oFirstContact);

				bFirstContactFlag = true;
			}
			else if (!bListIsFocused && bFirstContactFlag && bFirstContactSelected && ev && nKey === Enums.Key.Up)
			{
				this.isSearchFocused(true);
				this.selector.itemSelected(false);
				
				bFirstContactFlag = false;
			}
			else if (bFirstContactSelected)
			{
				bFirstContactFlag = true;
			}
			else if (!bFirstContactSelected)
			{
				bFirstContactFlag = false;
			}
		}
	}, this));
};

CContactsView.prototype.requestContactList = function ()
{
	var
		sGroupUUID = this.selectedStorage() === 'group' && this.selectedGroupInList() ? this.selectedGroupInList().UUID() : '',
		sStorage = sGroupUUID !== '' ? 'all' : this.selectedStorage()
	;
	
	this.loadingList(true);
	Ajax.send('GetContacts', {
		'Offset': (this.currentPage() - 1) * Settings.ContactsPerPage,
		'Limit': Settings.ContactsPerPage,
		'SortField': Enums.ContactSortField.Email,
		'Search': this.search(),
		'GroupUUID': sGroupUUID,
		'Storage': sStorage
	}, this.onGetContactsResponse, this);
};

CContactsView.prototype.requestGroupFullList = function ()
{
	Ajax.send('GetGroups', null, this.onGetGroupsResponse, this);
};

/**
 * @param {string} sContactUUID
 */
CContactsView.prototype.requestContact = function (sContactUUID)
{
	this.loadingViewPane(true);
	
	var oItem = _.find(this.collection(), function (oItm) {
		return oItm.UUID() === sContactUUID;
	});
	
	if (oItem)
	{
		this.selector.itemSelected(oItem);
		Ajax.send('GetContact', { 'UUID': oItem.UUID() }, this.onGetContactResponse, this);
	}
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.editGroup = function (oData)
{
	var oGroup = new CGroupModel();
	oGroup.populate(oData);
	this.selectedOldItem(oGroup);
	oData.edited(true);
};

/**
 * @param {string} sStorage
 */
CContactsView.prototype.changeGroupType = function (sStorage)
{
	Routing.setHash(LinksUtils.getContacts(sStorage));
};

/**
 * @param {Object} oData
 */
CContactsView.prototype.onViewGroupClick = function (oData)
{
	Routing.setHash(LinksUtils.getContacts('group', oData.UUID()));
};

/**
 * @param {Array} aParams
 */
CContactsView.prototype.onRoute = function (aParams)
{
	var
		oParams = LinksUtils.parseContacts(aParams),
		bGroupOrSearchChanged = this.selectedStorage() !== oParams.Storage || this.currentGroupUUID() !== oParams.GroupUUID || this.search() !== oParams.Search,
		bGroupFound = true,
		bRequestContacts = false
	;
	
	this.pageSwitcherLocked(true);
	if (bGroupOrSearchChanged)
	{
		this.oPageSwitcher.clear();
	}
	else
	{
		this.oPageSwitcher.setPage(oParams.Page, Settings.ContactsPerPage);
	}
	this.pageSwitcherLocked(false);
	if (oParams.Page !== this.oPageSwitcher.currentPage())
	{
		Routing.replaceHash(LinksUtils.getContacts(oParams.Storage, oParams.GroupUUID, oParams.Search, this.oPageSwitcher.currentPage()));
	}
	if (this.currentPage() !== oParams.Page)
	{
		this.currentPage(oParams.Page);
		bRequestContacts = true;
	}
	
	if (-1 !== $.inArray(oParams.Storage, Settings.Storages) && oParams.Storage !== 'group')
	{
		this.selectedStorage(oParams.Storage);
	}
	else if (this.currentGroupUUID() !== oParams.GroupUUID || oParams.ContactUUID === '')
	{
		bGroupFound = this.viewGroup(oParams.GroupUUID);
		if (bGroupFound)
		{
			bRequestContacts = false;
		}
		else
		{
			Routing.replaceHash(LinksUtils.getContacts());
		}
	}
	
	if (this.search() !== oParams.Search)
	{
		this.search(oParams.Search);
		bRequestContacts = true;
	}
	
	this.contactUidForRequest('');
	
	if (oParams.ContactUUID)		
	{
		if (this.collection().length === 0)
		{
			this.contactUidForRequest(oParams.ContactUUID);
		}
		else
		{
			this.requestContact(oParams.ContactUUID);
		}
	}
	else
	{
		this.selector.itemSelected(null);
		this.gotoContactList();
	}

	if (bRequestContacts)
	{
		this.requestContactList();
	}

	this.createNewContact();
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.viewGroup = function (sGroupUUID)
{
	var
		oGroup = _.find(this.groupFullCollection(), function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		})
	;
	
	if (oGroup)
	{
		this.oGroupModel.clear();
		this.oGroupModel
			.uuid(oGroup.UUID())
			.name(oGroup.Name())
		;
		if (oGroup.IsOrganization())
		{
			this.requestGroup(oGroup);
		}

		this.selectedGroupInList(oGroup);
		this.selectedItem(this.oGroupModel);
		this.selector.itemSelected(null);
		this.selector.listCheckedOrSelected(false);
		
		Ajax.send('GetGroupEvents', { 'GroupUUID': sGroupUUID }, this.onGetGroupEventsResponse, this);
	}
	
	return !!oGroup;
};

/**
 * @param {string} sGroupUUID
 */
CContactsView.prototype.deleteGroup = function (sGroupUUID)
{
	if (sGroupUUID)
	{
		Ajax.send('DeleteGroup', { 'GroupUUID': sGroupUUID }, function (oResponse) {
			if (!oResponse.Result)
			{
				Api.showErrorByCode(oResponse);
			}
			this.requestGroupFullList();
		}, this);

		this.selectedStorage(Settings.DefaultStorage);

		this.groupFullCollection.remove(function (oItem) {
			return oItem && oItem.UUID() === sGroupUUID;
		});
	}
};

/**
 * @param {Object} oGroup
 */
CContactsView.prototype.mailGroup = function (oGroup)
{
	if (this.bAllowComposeMessageToAddresses && oGroup)
	{
		Ajax.send('GetContacts', {
			'Offset': 0,
			'Limit': 99,
			'SortField': Enums.ContactSortField.Email,
			'GroupUUID': oGroup.uuid()
		}, function (oResponse) {
			var
				aList = oResponse && oResponse.Result && oResponse.Result.List,
				aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oRawContactItem) {
					var oContactItem = new CContactListItemModel();
					oContactItem.parse(oRawContactItem);
					return oContactItem.getFullEmail();
				})) : [],
				sEmails = aEmails.join(', ')
			;

			if (sEmails !== '')
			{
				this.composeMessageToAddresses(sEmails);
			}
		}, this);
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.dragAndDropHelper = function (oContact)
{
	if (oContact)
	{
		oContact.checked(true);
	}

	var
		oSelected = this.selector.itemSelected(),
		oHelper = Utils.draggableItems(),
		nCount = this.selector.listCheckedOrSelected().length,
		aUids = 0 < nCount ? _.map(this.selector.listCheckedOrSelected(), function (oItem) {
			return oItem.UUID();
		}) : []
	;

	if (oSelected && !oSelected.checked())
	{
		oSelected.checked(true);
	}

	oHelper.data('p7-contatcs-type', this.selectedStorage());
	oHelper.data('p7-contatcs-uids', aUids);
	
	$('.count-text', oHelper).text(TextUtils.i18n('%MODULENAME%/LABEL_DRAG_CONTACTS_PLURAL', {
		'COUNT': nCount
	}, null, nCount));

	return oHelper;
};

/**
 * @param {Object} oToGroup
 * @param {Object} oEvent
 * @param {Object} oUi
 */
CContactsView.prototype.contactsDrop = function (oToGroup, oEvent, oUi)
{
	if (oToGroup)
	{
		var
			oHelper = oUi && oUi.helper ? oUi.helper : null,
			aUids = oHelper ? oHelper.data('p7-contatcs-uids') : null
		;

		if (null !== aUids)
		{
			Utils.uiDropHelperAnim(oEvent, oUi);
			this.executeAddContactsToGroup(oToGroup, aUids);
		}
	}
};

CContactsView.prototype.contactsDropToGroupType = function (iGroupType, oEvent, oUi)
{
	var
		oHelper = oUi && oUi.helper ? oUi.helper : null,
		iType = oHelper ? oHelper.data('p7-contatcs-type') : null,
		aUids = oHelper ? oHelper.data('p7-contatcs-uids') : null
	;

	if (iGroupType !== iType)
	{
		if (null !== iType && null !== aUids)
		{
			Utils.uiDropHelperAnim(oEvent, oUi);
			this.executeShare();
		}
	}
};

CContactsView.prototype.searchFocus = function ()
{
	if (this.selector.useKeyboardKeys() && !Utils.isTextFieldFocused())
	{
		this.isSearchFocused(true);
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.viewContact = function (oContact)
{
	if (oContact)
	{
		var
			sStorage = this.selectedStorage(),
			sGroupUUID = (sStorage === 'group') ? this.currentGroupUUID() : ''
		;
		
		Routing.setHash(LinksUtils.getContacts(sStorage, sGroupUUID, this.search(), this.oPageSwitcher.currentPage(), oContact.UUID()));
	}
};

/**
 * @param {Object} oContact
 */
CContactsView.prototype.composeMessageToContact = function (oContact)
{
	var sEmail = oContact ? oContact.getFullEmail() : '';
	
	if (sEmail !== '')
	{
		this.composeMessageToAddresses(sEmail);
	}
};

CContactsView.prototype.composeMessage = function () {
	var
		aList = this.selector.listCheckedOrSelected(),
		aEmails = Types.isNonEmptyArray(aList) ? _.compact(_.map(aList, function (oItem) {
			return oItem.getFullEmail();
		})) : [],
		sEmails = aEmails.join(', ')
	;

	if (sEmails !== '')
	{
		this.composeMessageToAddresses(sEmails);
	}
};

CContactsView.prototype.onClearSearchClick = function ()
{
	// initiation empty search
	this.searchInput('');
	this.searchSubmitCommand();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	if (oResult)
	{
		var
			oObject = new CContactModel(),
			oSelected  = this.selector.itemSelected()
		;

		oObject.parse(oResult);
		
		if (oSelected && oSelected.UUID() === oObject.uuid())
		{
			this.selectedItem(oObject);
		}
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateContactResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		if (oResponse.Method === 'CreateContact')
		{
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CONTACT_SUCCESSFULLY_ADDED'));
		}
		else
		{
			Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_CONTACT_SUCCESSFULLY_UPDATED'));
		}
	}
	else
	{
		if (oResponse.Method === 'CreateContact')
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_CREATE_CONTACT'));
		}
		else
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_UPDATE_CONTACT'));
		}
	}
	
	this.requestContactList();
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetContactsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iContactCount = Types.pInt(oResult.ContactCount),
			aNewCollection = Types.isNonEmptyArray(oResult.List) ? _.compact(_.map(oResult.List, function (oRawContactItem) {
				var oContactItem = new CContactListItemModel();
				oContactItem.parse(oRawContactItem);
				return oContactItem;
			})) : [],
			oSelected  = this.selector.itemSelected(),
			oNewSelected  = oSelected ? _.find(aNewCollection, function (oContactItem) {
				return oSelected.UUID() === oContactItem.UUID();
			}) : null,
			aChecked = this.selector.listChecked(),
			aCheckedIds = (aChecked && 0 < aChecked.length) ? _.map(aChecked, function (oItem) {
				return oItem.UUID();
			}) : []
		;

		if (Types.isNonEmptyArray(aCheckedIds))
		{
			_.each(aNewCollection, function (oContactItem) {
				oContactItem.checked(-1 < $.inArray(oContactItem.UUID(), aCheckedIds));
			});
		}

		this.collection(aNewCollection);
		this.oPageSwitcher.setCount(iContactCount);
		this.contactCount(iContactCount);

		if (oNewSelected)
		{
			this.selector.itemSelected(oNewSelected);
			this.requestContact(oNewSelected.UUID());
		}

		this.selectedGroupEmails(this.selectedGroup() ? _.uniq(_.flatten(_.map(this.collection(), function (oContactItem) {
			return oContactItem.aEmails;
		}))) : []);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
	
	this.loadingList(false);
};

CContactsView.prototype.viewAllMails = function ()
{
	if (this.selectedGroupEmails().length > 0)
	{
		this.searchMessagesInInbox('email:' + this.selectedGroupEmails().join(','));
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupsResponse = function (oResponse, oRequest)
{
	var oResult = oResponse.Result;
	
	if (oResult)
	{
		var
			iIndex = 0,
			iLen = 0,
			aList = [],
			oSelected  = _.find(this.groupFullCollection(), function (oItem) {
				return oItem.selected();
			}),
			oObject = null
		;

		this.groupFullCollection(aList);
		
		for (iLen = oResult.length; iIndex < iLen; iIndex++)
		{
			if (oResult[iIndex])
			{
				oResult[iIndex].IsGroup = true;
				oObject = new CContactListItemModel();
				oObject.parse(oResult[iIndex]);
				
				if (oObject.IsGroup())
				{
					if (oSelected && oSelected.UUID() === oObject.UUID())
					{
						this.selectedGroupInList(oObject);
					}

					aList.push(oObject);
				}
			}
		}
		
		this.groupFullCollection(aList);
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onCreateGroupResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		if (!App.isMobile())
		{
			this.selectedItem(null);
			this.selector.itemSelected(null);
		}

		Screens.showReport(TextUtils.i18n('%MODULENAME%/REPORT_GROUP_SUCCESSFULLY_ADDED'));
	}
	else
	{
		Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_SAVE_GROUP'));
	}
	
	this.requestContactList();
	this.requestGroupFullList();
};

CContactsView.prototype.executeShare = function ()
{
	var
		self = this,
		aChecked = this.selector.listCheckedOrSelected(),
		oMainContact = this.selectedContact(),
		aContactUUIDs = _.map(aChecked, function (oItem) {
			return oItem.ReadOnly() ? '' : oItem.UUID();
		})
	;

	aContactUUIDs = _.compact(aContactUUIDs);

	if (0 < aContactUUIDs.length)
	{
		_.each(aChecked, function (oContact) {
			if (oContact)
			{
				ContactsCache.clearInfoAboutEmail(oContact.Email());

				if (oMainContact && !oContact.IsGroup() && !oContact.ReadOnly() && !oMainContact.readOnly() && oMainContact.uuid() === oContact.UUID())
				{
					oMainContact = null;
					this.selectedContact(null);
				}
			}
		}, this);

		_.each(this.collection(), function (oContact) {
			if (-1 < $.inArray(oContact, aChecked))
			{
				oContact.deleted(true);
			}
		});

		_.delay(function () {
			self.collection.remove(function (oItem) {
				return oItem.deleted();
			});
		}, 500);

		if ('shared' === this.selectedStorage())
		{
			this.recivedAnimUnshare(true);
		}
		else
		{
			this.recivedAnimShare(true);
		}
	
		Ajax.send('UpdateShared', { 'ContactUUIDs': aContactUUIDs });
	}
};

/**
 * @param {Object} oItem
 */
CContactsView.prototype.requestGroup = function (oItem)
{
	this.loadingViewPane(true);
	
	if (oItem)
	{
		Ajax.send('GetGroup', {
			'GroupUUID': oItem.UUID()
		}, this.onGetGroupResponse, this);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var oGroup = oResponse.Result;
		this.oGroupModel
			.uuid(Types.pString(oGroup.GroupUUID))
			.name(oGroup.Name)
			.isOrganization(oGroup.IsOrganization)
			.company(oGroup.Company)
			.country(oGroup.Country)
			.state(oGroup.State)
			.city(oGroup.City)
			.street(oGroup.Street)
			.zip(oGroup.Zip)
			.phone(oGroup.Phone)
			.fax(oGroup.Fax)
			.email(oGroup.Email)
			.web(oGroup.Web)
		;
	}
	else
	{
		Api.showErrorByCode(oResponse);
	}
};

/**
 * @param {Object} oResponse
 * @param {Object} oRequest
 */
CContactsView.prototype.onGetGroupEventsResponse = function (oResponse, oRequest)
{
	if (oResponse.Result)
	{
		var Events = oResponse.Result;
		this.oGroupModel.events(Events);
	}
};

CContactsView.prototype.reload = function ()
{
	this.requestContactList();
};

CContactsView.prototype.initUploader = function ()
{
	var self = this;

	if (this.uploaderArea())
	{
		this.oJua = new CJua({
			'action': '?/Api/',
			'name': 'jua-uploader',
			'queueSize': 2,
			'dragAndDropElement': this.uploaderArea(),
			'disableAjaxUpload': false,
			'disableFolderDragAndDrop': false,
			'disableDragAndDrop': false,
			'hidden': _.extendOwn({
				'Module': Settings.ServerModuleName,
				'Method': 'UploadContacts',
				'Parameters':  function () {
					return JSON.stringify({
						'GroupUUID': self.currentGroupUUID(),
						'Storage': self.selectedStorage()
					});
				}
			}, App.getCommonRequestParameters())
		});

		this.oJua
			.on('onComplete', _.bind(this.onContactUploadComplete, this))
			.on('onBodyDragEnter', _.bind(this.bDragActive, this, true))
			.on('onBodyDragLeave', _.bind(this.bDragActive, this, false))
		;
	}
};

CContactsView.prototype.onContactUploadComplete = function (sFileUid, bResponseReceived, oResponse)
{
	var bError = !bResponseReceived || !oResponse || oResponse.Error|| oResponse.Result.Error || false;

	if (!bError)
	{
		this.reload();
	}
	else
	{
		if (oResponse.ErrorCode)
		{
			Api.showErrorByCode(oResponse, TextUtils.i18n('%MODULENAME%/ERROR_FILE_NOT_CSV_OR_VCF'));
		}
		else
		{
			Screens.showError(TextUtils.i18n('COREWEBCLIENT/ERROR_UNKNOWN'));
		}
	}
};

CContactsView.prototype.createNewContact = function ()
{
	var oNewContactParams = ContactsCache.getNewContactParams();
	if (oNewContactParams)
	{
		this.newContactCommand();
		this.selectedItem().extented(true);
		_.each(oNewContactParams, function (sValue, sKey) {
			if(this.oContactModel[sKey])
			{
				this.oContactModel[sKey](sValue);
			}
		}, this);
	}
};

module.exports = new CContactsView();
