'use strict';

module.exports = function () {
	var
		SuggestionsAutocomplete = require('modules/%ModuleName%/js/SuggestionsAutocomplete.js')
	;

	return {
		getSuggestionsAutocompleteCallback: function () {
			return SuggestionsAutocomplete.callback;
		},
		getSuggestionsAutocompleteComposeCallback: function () {
			return SuggestionsAutocomplete.composeCallback;
		},
		getSuggestionsAutocompletePhoneCallback: function () {
			return SuggestionsAutocomplete.phoneCallback;
		},
		getSuggestionsAutocompleteDeleteHandler: function () {
			return SuggestionsAutocomplete.deleteHandler;
		},
		requestUserByPhone: function (sNumber, fCallBack, oContext) {
			SuggestionsAutocomplete.requestUserByPhone(sNumber, fCallBack, oContext);
		}
	};
};
