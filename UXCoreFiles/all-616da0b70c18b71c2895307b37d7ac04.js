$('.alert-dismissable button[data-dismiss="alert"]').on('click', function () {
	$(this).closest('.alert').hide();
});
$.fn.extend({
	nemoConfirm: function () {
		var args = arguments;
		$(this).each(function () {
			var $this = $(this),
				title,
				text,
				showInstant = args[3] || false,
				dialogMarkup;

			if (args.length > 2) {
				title = args[0];
				text = args[1];
				callback = args[2];
			} else if (args.length == 2) {
				title = args[0];
				callback = args[1];
			} else {
				callback = args[0];
			}

			title = title || $this.data('title') || "";
			text = text || $this.data('text') || "";
			callback = callback || function () {};

			dialogMarkup = '<div style="display: none" data-title="' + title + '" class="container">' + text + '</div>';
			function showDialog(callback) {
				if (title) {
					$(dialogMarkup).sfDialog({
						buttons: [{
							text: 'OK',
							onClick: $.proxy(callback, $this)
						}, {
							text: 'Cancel',
							cancel: true,
							enabledClasses: 'btn-link'
						}]
					});
				}
			}
			(function (callback, showInstant) {
				if (showInstant === true) {
					showDialog(callback);
				} else {
					$this.on('click', function () {
						showDialog(callback);
						return false;
					});
				}
			})(callback, showInstant);
		});
	}
});
$.fn.extend({
	nemoCountdown: function () {
		var args = arguments;
		$(this).each(function () {
			var $this = $(this),
				countdown,
				$container;


			function charCount($this) {
				if ($this.attr('maxlength')) {
					return +$this.attr('maxlength') - (+$this.val().length || 0);
				} else {
					return '';
				}
			}

			if ($this.is('input') || $this.is('textarea')) {
				countdown = charCount($this);

				$container = $('<div class="nemo-cd-container"><span class="nemo-cd">' + countdown + '</span></div>'),

				$container.insertAfter($this);
				$container.append($this.detach());

				$this.on('keyup', function () {
					countdown = charCount($this);
					$container.find('.nemo-cd').html(countdown);
				});
			}

		});
	}
});
$.fn.extend({
	nemoFlyout: function (config) {
		var $this = this,
			actions;


		actions = {
			show: function () {
				var flyout = $this.data('flyout');
				if (flyout) {
					this._setPosition(flyout);
					flyout.show();
					this._adjustHeight(flyout);
				}
			},
			hide: function () {
				var flyout = $this.data('flyout');
				if (flyout) {
					flyout.hide();
				}
			},
			setDisplay: function (value) {
				$this.find('.nemo-flyout-display').html(value);
			},
			_setPosition: function (flyout) {
				var offset = $this.offset(),
					parentHeight = $this.outerHeight(),
					top = offset.top + parentHeight,
					maxHeight = '',
					width = $this.data('config').width || $this.outerWidth(),
					zIndex = $this.data('config').zIndex || 9999999999,
					height = 300;

				maxHeight = $(window).height() - top - 10;

				if (height > maxHeight) {
					height = maxHeight;
				}

				if (flyout) {
					flyout.css({
						left: offset.left,
						top: top,
						width: width,
						height: height,
						maxHeight: maxHeight,
						zIndex: zIndex
					});
				}
			},
			_adjustHeight: function (flyout) {
				var height, maxHeight;
				
				maxHeight = $(window).height() - top;
				height = flyout.find('.nemo-flyout-wrapper > *').outerHeight() + 22 || 0;

				if (height > maxHeight) {
					height = maxHeight;
				}
				
				flyout.css({
					height: height,
					maxHeight: maxHeight
				});
			}
		};

		if (typeof config === 'string') {
			// Method call, assume already initialized
			if (actions[config]) {
				return actions[config].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		} else {
			// Create a new flyout
			var $flyout = $('<div class="nemo-flyout-container" style="display: none"><div class="nemo-flyout-wrapper"></div></div>'),
				container = config.container,
				isOpen = false;

			if (container) {
				container = (typeof container === 'string') ? $(container) : container;

				$flyout.find('.nemo-flyout-wrapper').append(container.detach().show());
				$('body').append($flyout);
			}

			$this.data('flyout', $flyout);
			$this.data('config', config);

			function addCloseListener() {
				$(document).on('click', function (event) {
					if (!$.contains($flyout[0], event.target)) {
						actions.hide();
						isOpen = false;
						$(document).off(event);
					}
				});
			}

			$(window).on('resize', function () {
				if (isOpen) {
					actions._setPosition($flyout);
					actions._adjustHeight($flyout);
				}
			});

			$(document).on('click', $this.selector, function () {
				if (!isOpen) {
					actions.show();
					isOpen = true;
					addCloseListener();
				} else {
					actions.hide();
					isOpen = false;
				}

				return false;
			});

		}
	}
});
$.fn.extend({
	permalink: function () {
		var args = arguments;

		function slugify(str) {
	        return str.replace(/^\s+|\s+$/gm, '').replace(/[\s]/g, '-').replace(/[^\w-]/g, '').toLowerCase();
	    }

	    function textWidth($node) {
	    	var font = $node.css('font') || '12px arial',
				$tmp = $('<div>' + $node.val() + '</div>'),
				width = 0;
			

			$tmp.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font});
			$tmp.appendTo($('body'));

			width = $tmp.width();

			$tmp.remove();

			return width + 12;
	    }

		$(this).each(function () {
			var $this = $(this),
				$container,
				$input;

		
			if ($this.is('input')) {
				$container = $(this).closest('div');
				$input = $(this);
			} else {
				$container = $(this);
				$input = $(this).find('input[type="text"]');
			}

			function validateInput() {
				var val = $input.val();
				$input.val(slugify(val));
			}

			function dynamicResize() {
				var width = textWidth($input);

				if (width < 20) {
					width = 20;
				}

				$input.css('width', width);
			}

			$container.find('a.btn').on('click', function () {
				$input.focus();
			});

			$input.on('blur', function () {
				validateInput();
				dynamicResize();
			});

			$input.on('focus', function () {
				$(this).css('width', 'auto');
			});

			$input.on('change', function () {
				validateInput();
				dynamicResize();
			});

			$input.attr('pattern', '[a-z0-9\-]+');

			validateInput();
			dynamicResize();
		});
	}
});
(function () {
    //intercept Enter keypress on all modal textboxes to auto-trigger form submit
    $(document).on('keydown', '.sf-dialog-inner.modal-body input[type="text"]', function (event) {
        //exclude multi-select textbox
        if ($(this).parent('li.search-field').size() > 0) return;

        if (event.keyCode === 13) {
            // Finds the ancestor with class .sf-dialog and execute a method on that
            var $dialog = $(this).closest('.sf-dialog-inner.modal-body').children();
            var buttons = $dialog.sfDialog('getButtons');
            var clickHandler = null;

            for (var i = buttons.length - 1; i >= 0; i--) {
                button = buttons[i];
                //skip cancel button or button without handler
                if (button.cancel || button.onClick === null) continue;
                //if data hook present, use the decorated button event
                if (button.attributes && button.attributes['data-hook'] === 'submit-on-enter' && !button.attributes['data-ignore-enter']) {
                    clickHandler = button.onClick;
                    break;
                }
                //otherwise, use first encountered (right-most) non-cancel button with onClick defined
                if (clickHandler === null && !button.attributes['data-ignore-enter']) {
                    clickHandler = button.onClick;
                }
            }
            //if a handler was located, use it
            if (clickHandler !== null) {
                event.preventDefault();
                clickHandler($dialog, button.id, button);
                return false;
            }
        }
    });
})();
// Custom confirm dialog (uxcore style).
// Currently only supports submission of forms (and not plain GET links)
(function () {
	$('.nemo-form-confirm').each(function (index) {
		var node = $(this),
			title = node.data('title'),
			text = node.data('text'),
			gaSuccess = node.data('ga-success'),
			dialogMarkup;

		dialogMarkup = '<div class="container" id="nemo-form-confirm-' + index + '" style="display: none" data-title="' + title + '">' + text + '</div>';
		$('body').append(dialogMarkup);

		node.on('click', function () {
			var parentForm = $(this).closest('form'),
				dialog = $('#nemo-form-confirm-' + index);

			if (parentForm) {
				function submit () {
					if (gaSuccess) {
						window.trackEvent(gaSuccess);
					}
					parentForm.submit();
					dialog.sfDialog('hide');
				};

				dialog.sfDialog({
					buttons: [{
						text: 'OK',
						onClick: submit
					}, {
						text: 'Cancel',
						cancel: true,
						enabledClasses: 'btn-link'
					}]
				});

				return false;
			}
		});
	});

})();
(function () {
	var Nemo = window.Nemo = window.Nemo || {};

	Nemo.prettySelect = function ($node, config) {
		var options = {},
			listId = ~~(Math.random() * 1000),
			selectedVal;

		config = config || {};
		
		$list = $('<ul id="nemo-list-' + listId + '" class="nemo-custom-select"></ul>');
		$list.insertBefore($node);

		$node.find('option').each(function () {

			var key = $(this).html(),
				val = $(this).val();

			$list.append('<li data-value="' + val + '" ' + ($(this).attr('selected') ? 'data-selected="true"' : "" ) + '><div data-main="true">' + key + '</div></li>');
		});

		require("starfield/sf.droplist", function() {

			function onValueChanged(droplistElement, liElement, value) {
				$node.val(value);
				$node.change();
			}

			$.extend(config, {
				onValueChanged: onValueChanged
			});

			$list.sfDropList(config);
			$node.hide();
		});
	};
})();
(function () {

	var Nemo = window.Nemo = window.Nemo || {};

	Nemo.formSubmit = function(url, options) {
		options = options || {};
		options._method = options._method || "patch";

		var authToken = $('meta[name="csrf-token"]').attr('content'),
			form = $('<form id="nemo-submit" accept-charset="UTF-8" action="' + url + '" method="POST"><input name="utf8" type="hidden" value="✓"><input name="authenticity_token" type="hidden" value="' + authToken + '"></form>');

		for (var opt in options) {
			var field = $('<input name="' + opt + '" type="hidden" value="' + options[opt] + '">');
			form.append(field);
		}
		$('body').append(form);
		$('#nemo-submit').submit();
	};
})();
$(function() {
    // Set a unique user id for Rack-mini-profiler
    if (!$.cookie('nemo_miniprofid')) {
        $.cookie('nemo_miniprofid', Math.random(), { secure: false, path: '/', expires: 3650 /* 10 years */  });
    }
});
(function () {

	$(document).on('change', '.nemo-pg-page', function () {
		var value = $(this).val(),
			href = window.location.href,
            key = "page";

        var expr = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
        var separator = href.indexOf('?') !== -1 ? "&" : "?";
        if (href.match(expr)) {
            href = href.replace(expr, '$1' + key + "=" + value + '$2');
        }
        else {
            href = href + separator + key + "=" + value;
        }

		window.location.href = href;
	});
})();
(function () {

	var Nemo = window.Nemo = window.Nemo || {};

	Nemo.showFormDialog = function (title, url, onSuccess, dialogWidth, onFail, onCancel, onShow) {

		function submit(elDialog, buttonId, button) {
			var $form = elDialog.find('form'),
				$errorNode = elDialog.find('.form-error-msg');

			elDialog.sfDialog('disable');
			elDialog.addClass('ajax-loading');

			$.ajax({
				type: 'POST',
				url: $form.attr('action'),
				data: $form.serialize()
			}).done(function (res) {

				if (res && res.status === 'success') {
					$errorNode.hide();
					elDialog.sfDialog('enable').sfDialog('hide');
					
					if (onSuccess) {
						onSuccess(elDialog, res);
					}
					
				} else {
					$errorNode.find('span').html(res.message);
					$errorNode.show();
					elDialog.sfDialog('resize');

					if (onFail) {
						onFail(elDialog, res);
					}
				}

			}).fail(function () {
				elDialog.sfDialog('enable');
				elDialog.removeClass('ajax-loading');
			}).always(function () {
				elDialog.sfDialog('enable');
				elDialog.removeClass('ajax-loading');
			});
		}

		function onLoad($dialog) {
			// Toggle dialog advanced/basic SEO options
			$dialog.find('.node-toggle-on .btn-toggle').on('click', function () {
				var $dialogInner = $dialog.closest('.sf-dialog-inner');

				$(this).closest('form').addClass('toggle-off');
				$dialogInner.scrollTop($dialogInner.height());
			});

			$dialog.find('.node-toggle-off .btn-toggle').on('click', function () {
				$(this).closest('form').removeClass('toggle-off');
			});

			if (onShow) {
				onShow();
			}
		}


		$('<div />').sfDialog({
			title: title,
			load: url,
			dialogWidthIdeal: dialogWidth || 500,
			buttons: [{
				text: 'Save',
				onClick: submit
			}, {
				text: 'Cancel',
				cancel: true,
				enabledClasses: 'btn-link'
			}],
			onClose: function (button, closeBox, $modal) {
				if ($modal && $modal.find) {
					$modal.find('.datepicker').sfDatePicker('destroy');	
				}
			},
			onCancel: function (button, closeBox, $modal) {
				if (onCancel) {
					onCancel(button, closeBox, $modal);
				}
			},
			onLoad: onLoad
		});
	};

})();
$('#save-and-add-another').click(function () {
	$(this).closest('form').append($('<input name="save_and_add_another" type="hidden" value="1">')).submit();
});
// Chosen, a Select Box Enhancer for jQuery and Prototype
// by Patrick Filler for Harvest, http://getharvest.com
//
// Version 1.0.0
// Full source at https://github.com/harvesthq/chosen
// Copyright (c) 2011 Harvest http://getharvest.com

// MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
// This file is generated by `grunt build`, do not edit it by hand.
(function() {
  var $, AbstractChosen, Chosen, SelectParser, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, option, _i, _len, _ref, _results;

      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        children: 0,
        disabled: group.disabled
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function(text) {
      var map, unsafe_chars;

      if ((text == null) || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function(chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, parser, _i, _len, _ref;

    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
    }

    AbstractChosen.prototype.set_default_values = function() {
      var _this = this;

      this.click_test_action = function(evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function(evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.result_single_selected = null;
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      return this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
    };

    AbstractChosen.prototype.set_default_text = function() {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      var _this = this;

      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout((function() {
            return _this.container_mousedown();
          }), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      var _this = this;

      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout((function() {
          return _this.blur_test();
        }), 100);
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, _i, _len, _ref;

      content = '';
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        if (data.group) {
          content += this.result_add_group(data);
        } else {
          content += this.result_add_option(data);
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(data.text);
          }
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, style;

      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      style = option.style.cssText !== "" ? " style=\"" + option.style + "\"" : "";
      return "<li class=\"" + (classes.join(' ')) + "\"" + style + " data-option-array-index=\"" + option.array_index + "\">" + option.search_text + "</li>";
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      return "<li class=\"group-result\">" + group.search_text + "</li>";
    };

    AbstractChosen.prototype.results_update_field = function() {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.result_single_selected = null;
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function() {
      var escapedSearchText, option, regex, regexAnchor, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;

      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regexAnchor = this.search_contains ? "" : "^";
      regex = new RegExp(regexAnchor + escapedSearchText, 'i');
      zregex = new RegExp(escapedSearchText, 'i');
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          if (!(option.group && !this.group_search)) {
            option.search_text = option.group ? option.label : option.html;
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(zregex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var part, parts, _i, _len;

      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function() {
      var option, _i, _len, _ref;

      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var stroke, _ref;

      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            return this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            return this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            return this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.results_search();
      }
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.browser_is_supported = function() {
      if (window.navigator.appName === "Microsoft Internet Explorer") {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
        return false;
      }
      if (/Android/i.test(window.navigator.userAgent)) {
        if (/Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;

        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy' && chosen) {
          chosen.destroy();
        } else if (!chosen) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;

      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'style': "width: " + (this.container_width()) + ";",
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      if (this.is_multiple) {
        this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop"><ul class="chosen-results"></ul></div>');
      } else {
        this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop"><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>');
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      this.set_label_behavior();
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      var _this = this;

      this.container.bind('mousedown.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function(evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function(evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function(evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function(evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function(evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt) {
        _this.search_results_mousewheel(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function(evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function(evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function(evt) {
        _this.container_mousedown(evt);
      });
      this.search_field.bind('blur.chosen', function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function(evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function(evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function(evt) {
        _this.input_focus(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function(evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(document).unbind("click.chosen", this.click_test_action);
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field_jq[0].disabled;
      if (this.is_disabled) {
        this.container.addClass('chosen-disabled');
        this.search_field[0].disabled = true;
        if (!this.is_multiple) {
          this.selected_item.unbind("focus.chosen", this.activate_action);
        }
        return this.close_field();
      } else {
        this.container.removeClass('chosen-disabled');
        this.search_field[0].disabled = false;
        if (!this.is_multiple) {
          return this.selected_item.bind("focus.chosen", this.activate_action);
        }
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      if (!this.is_disabled) {
        if (evt && evt.type === "mousedown" && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.val("");
            }
            $(document).bind('click.chosen', this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
            evt.preventDefault();
            this.results_toggle();
          }
          return this.activate_field();
        }
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta, _ref1, _ref2;

      delta = -((_ref1 = evt.originalEvent) != null ? _ref1.wheelDelta : void 0) || ((_ref2 = evt.originialEvent) != null ? _ref2.detail : void 0);
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(document).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      return this.search_field_scale();
    };

    Chosen.prototype.activate_field = function() {
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      if (this.container.is($(evt.target).closest('.chosen-container'))) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function() {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;

      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.search_field.val());
      return this.winnow_results();
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;

      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      var _this = this;

      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', function(evt) {
          if (_this.is_multiple) {
            return _this.container_mousedown(evt);
          } else {
            return _this.activate_field();
          }
        });
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      var target;

      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;

      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link,
        _this = this;

      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + item.html + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.bind('click.chosen', function(evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        this.show_search_field_default();
        if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.form_field.options[0].selected = true;
      this.selected_option_count = null;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.form_field_jq.trigger("change");
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item, selected_index;

      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          if (this.result_single_selected) {
            this.result_single_selected.removeClass("result-selected");
            selected_index = this.result_single_selected[0].getAttribute('data-option-array-index');
            this.results_data[selected_index].selected = false;
          }
          this.result_single_selected = high;
        }
        high.addClass("result-selected");
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(item.text);
        }
        if (!((evt.metaKey || evt.ctrlKey) && this.is_multiple)) {
          this.results_hide();
        }
        this.search_field.val("");
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.form_field_jq.trigger("change", {
            'selected': this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").text(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;

      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.form_field_jq.trigger("change", {
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_text = function() {
      if (this.search_field.val() === this.default_text) {
        return "";
      } else {
        return $('<div/>').text($.trim(this.search_field.val())).html();
      }
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;

      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;

      no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
      no_results_html.find("span").first().html(terms);
      return this.search_results.append(no_results_html);
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;

      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;

      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;

      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.keydown_checker = function(evt) {
      var stroke, _ref1;

      stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.search_field.val().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          evt.preventDefault();
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    Chosen.prototype.search_field_scale = function() {
      var div, f_width, h, style, style_block, styles, w, _i, _len;

      if (this.is_multiple) {
        h = 0;
        w = 0;
        style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          style_block += style + ":" + this.search_field.css(style) + ";";
        }
        div = $('<div />', {
          'style': style_block
        });
        div.text(this.search_field.val());
        $('body').append(div);
        w = div.width() + 25;
        div.remove();
        f_width = this.container.outerWidth();
        if (w > f_width - 10) {
          w = f_width - 10;
        }
        return this.search_field.css({
          'width': w + 'px'
        });
      }
    };

    return Chosen;

  })(AbstractChosen);

}).call(this);
!function(e,x,h){function r(a,b){var c=Math.max(0,a[0]-b[0],b[0]-a[1]),d=Math.max(0,a[2]-b[1],b[1]-a[3]);return c+d}function s(a,b,c,d){for(var f=a.length,d=d?"offset":"position",c=c||0;f--;){var k=a[f].el?a[f].el:e(a[f]),i=k[d]();i.left+=parseInt(k.css("margin-left"),10);i.top+=parseInt(k.css("margin-top"),10);b[f]=[i.left-c,i.left+k.outerWidth()+c,i.top-c,i.top+k.outerHeight()+c]}}function l(a,b){var c=b.offset();return{left:a.left-c.left,top:a.top-c.top}}function t(a,b,c){for(var b=[b.left,b.top],
c=c&&[c.left,c.top],d,f=a.length,e=[];f--;)d=a[f],e[f]=[f,r(d,b),c&&r(d,c)];return e=e.sort(function(a,b){return b[1]-a[1]||b[2]-a[2]||b[0]-a[0]})}function m(a){this.options=e.extend({},j,a);this.containers=[];this.scrollProxy=e.proxy(this.scroll,this);this.dragProxy=e.proxy(this.drag,this);this.dropProxy=e.proxy(this.drop,this);this.options.parentContainer||(this.placeholder=e(this.options.placeholder),a.isValidTarget||(this.options.isValidTarget=h))}function n(a,b){this.el=a;this.options=e.extend({},
v,b);this.group=m.get(this.options);this.rootGroup=this.options.rootGroup=this.options.rootGroup||this.group;this.parentContainer=this.options.parentContainer;this.handle=this.rootGroup.options.handle||this.rootGroup.options.itemSelector;this.el.on(o.start,this.handle,e.proxy(this.dragInit,this));this.options.drop&&this.group.containers.push(this)}var o,v={drag:!0,drop:!0,exclude:"",nested:!0,vertical:!0},j={afterMove:function(){},containerPath:"",containerSelector:"ol, ul",distance:0,handle:"",itemPath:"",
itemSelector:"li",isValidTarget:function(){return!0},onCancel:function(){},onDrag:function(a,b){a.css(b)},onDragStart:function(a){a.css({height:a.height(),width:a.width()});a.addClass("dragged");e("body").addClass("dragging")},onDrop:function(a){a.removeClass("dragged").removeAttr("style");e("body").removeClass("dragging")},onMousedown:function(a,b){b.preventDefault()},placeholder:'<li class="placeholder"/>',pullPlaceholder:!0,serialize:function(a,b,c){a=e.extend({},a.data());if(c)return b;b[0]&&
(a.children=b,delete a.subContainer);delete a.sortable;return a},tolerance:0},p={},u=0,w={left:0,top:0,bottom:0,right:0};o={start:"touchstart.sortable mousedown.sortable",drop:"touchend.sortable touchcancel.sortable mouseup.sortable",drag:"touchmove.sortable mousemove.sortable",scroll:"scroll.sortable"};m.get=function(a){p[a.group]||(a.group||(a.group=u++),p[a.group]=new m(a));return p[a.group]};m.prototype={dragInit:function(a,b){this.$document=e(b.el[0].ownerDocument);b.enabled()?(this.toggleListeners("on"),
this.item=e(a.target).closest(this.options.itemSelector),this.itemContainer=b,this.setPointer(a),this.options.onMousedown(this.item,a,j.onMousedown)):this.toggleListeners("on",["drop"]);this.dragInitDone=!0},drag:function(a){if(!this.dragging){if(!this.distanceMet(a))return;this.options.onDragStart(this.item,this.itemContainer,j.onDragStart);this.item.before(this.placeholder);this.dragging=!0}this.setPointer(a);this.options.onDrag(this.item,l(this.pointer,this.item.offsetParent()),j.onDrag);var b=
a.pageX,a=a.pageY,c=this.sameResultBox,d=this.options.tolerance;if(!c||c.top-d>a||c.bottom+d<a||c.left-d>b||c.right+d<b)this.searchValidTarget()||this.placeholder.detach()},drop:function(){this.toggleListeners("off");this.dragInitDone=!1;if(this.dragging){if(this.placeholder.closest("html")[0])this.placeholder.before(this.item).detach();else this.options.onCancel(this.item,this.itemContainer,j.onCancel);this.options.onDrop(this.item,this.getContainer(this.item),j.onDrop);this.clearDimensions();this.clearOffsetParent();
this.lastAppendedItem=this.sameResultBox=h;this.dragging=!1}},searchValidTarget:function(a,b){a||(a=this.relativePointer||this.pointer,b=this.lastRelativePointer||this.lastPointer);for(var c=t(this.getContainerDimensions(),a,b),d=c.length;d--;){var f=c[d][0];if(!c[d][1]||this.options.pullPlaceholder)if(f=this.containers[f],!f.disabled){if(!this.$getOffsetParent())var e=f.getItemOffsetParent(),a=l(a,e),b=l(b,e);if(f.searchValidTarget(a,b))return!0}}this.sameResultBox&&(this.sameResultBox=h)},movePlaceholder:function(a,
b,c,d){var f=this.lastAppendedItem;if(d||!(f&&f[0]===b[0]))b[c](this.placeholder),this.lastAppendedItem=b,this.sameResultBox=d,this.options.afterMove(this.placeholder,a)},getContainerDimensions:function(){this.containerDimensions||s(this.containers,this.containerDimensions=[],this.options.tolerance,!this.$getOffsetParent());return this.containerDimensions},getContainer:function(a){return a.closest(this.options.containerSelector).data("sortable")},$getOffsetParent:function(){if(this.offsetParent===
h){var a=this.containers.length-1,b=this.containers[a].getItemOffsetParent();if(!this.options.parentContainer)for(;a--;)if(b[0]!=this.containers[a].getItemOffsetParent()[0]){b=!1;break}this.offsetParent=b}return this.offsetParent},setPointer:function(a){a={left:a.pageX,top:a.pageY};if(this.$getOffsetParent()){var b=l(a,this.$getOffsetParent());this.lastRelativePointer=this.relativePointer;this.relativePointer=b}this.lastPointer=this.pointer;this.pointer=a},distanceMet:function(a){return Math.max(Math.abs(this.pointer.left-
a.pageX),Math.abs(this.pointer.top-a.pageY))>=this.options.distance},scroll:function(){this.clearDimensions();this.clearOffsetParent()},toggleListeners:function(a,b){var c=this,b=b||["drag","drop","scroll"];e.each(b,function(b,f){c.$document[a](o[f],c[f+"Proxy"])})},clearOffsetParent:function(){this.offsetParent=h},clearDimensions:function(){this.containerDimensions=h;for(var a=this.containers.length;a--;)this.containers[a].clearDimensions()}};n.prototype={dragInit:function(a){var b=this.rootGroup;
!b.dragInitDone&&1===a.which&&this.options.drag&&!e(a.target).is(this.options.exclude)&&b.dragInit(a,this)},searchValidTarget:function(a,b){var c=t(this.getItemDimensions(),a,b),d=c.length,f=this.rootGroup,e=!f.options.isValidTarget||f.options.isValidTarget(f.item,this);if(!d&&e)return f.movePlaceholder(this,this.el,"append"),!0;for(;d--;)if(f=c[d][0],!c[d][1]&&this.hasChildGroup(f)){if(this.getContainerGroup(f).searchValidTarget(a,b))return!0}else if(e)return this.movePlaceholder(f,a),!0},movePlaceholder:function(a,
b){var c=e(this.items[a]),d=this.itemDimensions[a],f="after",h=c.outerWidth(),i=c.outerHeight(),g=c.offset(),g={left:g.left,right:g.left+h,top:g.top,bottom:g.top+i};this.options.vertical?b.top<=(d[2]+d[3])/2?(f="before",g.bottom-=i/2):g.top+=i/2:b.left<=(d[0]+d[1])/2?(f="before",g.right-=h/2):g.left+=h/2;this.hasChildGroup(a)&&(g=w);this.rootGroup.movePlaceholder(this,c,f,g)},getItemDimensions:function(){this.itemDimensions||(this.items=this.$getChildren(this.el,"item").filter(":not(.placeholder, .dragged)").get(),
s(this.items,this.itemDimensions=[],this.options.tolerance));return this.itemDimensions},getItemOffsetParent:function(){var a=this.el;return"relative"===a.css("position")||"absolute"===a.css("position")||"fixed"===a.css("position")?a:a.offsetParent()},hasChildGroup:function(a){return this.options.nested&&this.getContainerGroup(a)},getContainerGroup:function(a){var b=e.data(this.items[a],"subContainer");if(b===h){var c=this.$getChildren(this.items[a],"container"),b=!1;c[0]&&(b=e.extend({},this.options,
{parentContainer:this,group:u++}),b=c.sortable(b).data("sortable").group);e.data(this.items[a],"subContainer",b)}return b},enabled:function(){return!this.disabled&&(!this.parentContainer||this.parentContainer.enabled())},$getChildren:function(a,b){var c=this.rootGroup.options,d=c[b+"Path"],c=c[b+"Selector"],a=e(a);d&&(a=a.find(d));return a.children(c)},_serialize:function(a,b){var c=this,d=this.$getChildren(a,b?"item":"container").not(this.options.exclude).map(function(){return c._serialize(e(this),
!b)}).get();return this.rootGroup.options.serialize(a,d,b)},clearDimensions:function(){this.itemDimensions=h;if(this.items&&this.items[0])for(var a=this.items.length;a--;){var b=e.data(this.items[a],"subContainer");b&&b.clearDimensions()}}};var q={enable:function(){this.disabled=!1},disable:function(){this.disabled=!0},serialize:function(){return this._serialize(this.el,!0)}};e.extend(n.prototype,q);e.fn.sortable=function(a){var b=Array.prototype.slice.call(arguments,1);return this.map(function(){var c=
e(this),d=c.data("sortable");if(d&&q[a])return q[a].apply(d,b)||this;!d&&(a===h||"object"===typeof a)&&c.data("sortable",new n(c,a));return this})}}(jQuery,window);
/*!
 * jQuery Cookie Plugin v1.4.0
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as anonymous module.
		define(['jquery'], factory);
	} else {
		// Browser globals.
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));
/*
* jQuery Form Plugin; v20130916
* http://jquery.malsup.com/form/
* Copyright (c) 2013 M. Alsup; Dual licensed: MIT/GPL
* https://github.com/malsup/form#copyright-and-license
*/

;(function(e){"use strict";function t(t){var r=t.data;t.isDefaultPrevented()||(t.preventDefault(),e(t.target).ajaxSubmit(r))}function r(t){var r=t.target,a=e(r);if(!a.is("[type=submit],[type=image]")){var n=a.closest("[type=submit]");if(0===n.length)return;r=n[0]}var i=this;if(i.clk=r,"image"==r.type)if(void 0!==t.offsetX)i.clk_x=t.offsetX,i.clk_y=t.offsetY;else if("function"==typeof e.fn.offset){var o=a.offset();i.clk_x=t.pageX-o.left,i.clk_y=t.pageY-o.top}else i.clk_x=t.pageX-r.offsetLeft,i.clk_y=t.pageY-r.offsetTop;setTimeout(function(){i.clk=i.clk_x=i.clk_y=null},100)}function a(){if(e.fn.ajaxSubmit.debug){var t="[jquery.form] "+Array.prototype.join.call(arguments,"");window.console&&window.console.log?window.console.log(t):window.opera&&window.opera.postError&&window.opera.postError(t)}}var n={};n.fileapi=void 0!==e("<input type='file'/>").get(0).files,n.formdata=void 0!==window.FormData;var i=!!e.fn.prop;e.fn.attr2=function(){if(!i)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},e.fn.ajaxSubmit=function(t){function r(r){var a,n,i=e.param(r,t.traditional).split("&"),o=i.length,s=[];for(a=0;o>a;a++)i[a]=i[a].replace(/\+/g," "),n=i[a].split("="),s.push([decodeURIComponent(n[0]),decodeURIComponent(n[1])]);return s}function o(a){for(var n=new FormData,i=0;a.length>i;i++)n.append(a[i].name,a[i].value);if(t.extraData){var o=r(t.extraData);for(i=0;o.length>i;i++)o[i]&&n.append(o[i][0],o[i][1])}t.data=null;var s=e.extend(!0,{},e.ajaxSettings,t,{contentType:!1,processData:!1,cache:!1,type:u||"POST"});t.uploadProgress&&(s.xhr=function(){var r=e.ajaxSettings.xhr();return r.upload&&r.upload.addEventListener("progress",function(e){var r=0,a=e.loaded||e.position,n=e.total;e.lengthComputable&&(r=Math.ceil(100*(a/n))),t.uploadProgress(e,a,n,r)},!1),r}),s.data=null;var l=s.beforeSend;return s.beforeSend=function(e,t){t.data=n,l&&l.call(this,e,t)},e.ajax(s)}function s(r){function n(e){var t=null;try{e.contentWindow&&(t=e.contentWindow.document)}catch(r){a("cannot get iframe.contentWindow document: "+r)}if(t)return t;try{t=e.contentDocument?e.contentDocument:e.document}catch(r){a("cannot get iframe.contentDocument: "+r),t=e.document}return t}function o(){function t(){try{var e=n(g).readyState;a("state = "+e),e&&"uninitialized"==e.toLowerCase()&&setTimeout(t,50)}catch(r){a("Server abort: ",r," (",r.name,")"),s(D),j&&clearTimeout(j),j=void 0}}var r=f.attr2("target"),i=f.attr2("action");w.setAttribute("target",d),(!u||/post/i.test(u))&&w.setAttribute("method","POST"),i!=m.url&&w.setAttribute("action",m.url),m.skipEncodingOverride||u&&!/post/i.test(u)||f.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),m.timeout&&(j=setTimeout(function(){T=!0,s(k)},m.timeout));var o=[];try{if(m.extraData)for(var l in m.extraData)m.extraData.hasOwnProperty(l)&&(e.isPlainObject(m.extraData[l])&&m.extraData[l].hasOwnProperty("name")&&m.extraData[l].hasOwnProperty("value")?o.push(e('<input type="hidden" name="'+m.extraData[l].name+'">').val(m.extraData[l].value).appendTo(w)[0]):o.push(e('<input type="hidden" name="'+l+'">').val(m.extraData[l]).appendTo(w)[0]));m.iframeTarget||v.appendTo("body"),g.attachEvent?g.attachEvent("onload",s):g.addEventListener("load",s,!1),setTimeout(t,15);try{w.submit()}catch(c){var p=document.createElement("form").submit;p.apply(w)}}finally{w.setAttribute("action",i),r?w.setAttribute("target",r):f.removeAttr("target"),e(o).remove()}}function s(t){if(!x.aborted&&!F){if(M=n(g),M||(a("cannot access response document"),t=D),t===k&&x)return x.abort("timeout"),S.reject(x,"timeout"),void 0;if(t==D&&x)return x.abort("server abort"),S.reject(x,"error","server abort"),void 0;if(M&&M.location.href!=m.iframeSrc||T){g.detachEvent?g.detachEvent("onload",s):g.removeEventListener("load",s,!1);var r,i="success";try{if(T)throw"timeout";var o="xml"==m.dataType||M.XMLDocument||e.isXMLDoc(M);if(a("isXml="+o),!o&&window.opera&&(null===M.body||!M.body.innerHTML)&&--O)return a("requeing onLoad callback, DOM not available"),setTimeout(s,250),void 0;var u=M.body?M.body:M.documentElement;x.responseText=u?u.innerHTML:null,x.responseXML=M.XMLDocument?M.XMLDocument:M,o&&(m.dataType="xml"),x.getResponseHeader=function(e){var t={"content-type":m.dataType};return t[e.toLowerCase()]},u&&(x.status=Number(u.getAttribute("status"))||x.status,x.statusText=u.getAttribute("statusText")||x.statusText);var l=(m.dataType||"").toLowerCase(),c=/(json|script|text)/.test(l);if(c||m.textarea){var f=M.getElementsByTagName("textarea")[0];if(f)x.responseText=f.value,x.status=Number(f.getAttribute("status"))||x.status,x.statusText=f.getAttribute("statusText")||x.statusText;else if(c){var d=M.getElementsByTagName("pre")[0],h=M.getElementsByTagName("body")[0];d?x.responseText=d.textContent?d.textContent:d.innerText:h&&(x.responseText=h.textContent?h.textContent:h.innerText)}}else"xml"==l&&!x.responseXML&&x.responseText&&(x.responseXML=X(x.responseText));try{E=_(x,l,m)}catch(b){i="parsererror",x.error=r=b||i}}catch(b){a("error caught: ",b),i="error",x.error=r=b||i}x.aborted&&(a("upload aborted"),i=null),x.status&&(i=x.status>=200&&300>x.status||304===x.status?"success":"error"),"success"===i?(m.success&&m.success.call(m.context,E,"success",x),S.resolve(x.responseText,"success",x),p&&e.event.trigger("ajaxSuccess",[x,m])):i&&(void 0===r&&(r=x.statusText),m.error&&m.error.call(m.context,x,i,r),S.reject(x,"error",r),p&&e.event.trigger("ajaxError",[x,m,r])),p&&e.event.trigger("ajaxComplete",[x,m]),p&&!--e.active&&e.event.trigger("ajaxStop"),m.complete&&m.complete.call(m.context,x,i),F=!0,m.timeout&&clearTimeout(j),setTimeout(function(){m.iframeTarget?v.attr("src",m.iframeSrc):v.remove(),x.responseXML=null},100)}}}var l,c,m,p,d,v,g,x,b,y,T,j,w=f[0],S=e.Deferred();if(S.abort=function(e){x.abort(e)},r)for(c=0;h.length>c;c++)l=e(h[c]),i?l.prop("disabled",!1):l.removeAttr("disabled");if(m=e.extend(!0,{},e.ajaxSettings,t),m.context=m.context||m,d="jqFormIO"+(new Date).getTime(),m.iframeTarget?(v=e(m.iframeTarget),y=v.attr2("name"),y?d=y:v.attr2("name",d)):(v=e('<iframe name="'+d+'" src="'+m.iframeSrc+'" />'),v.css({position:"absolute",top:"-1000px",left:"-1000px"})),g=v[0],x={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(t){var r="timeout"===t?"timeout":"aborted";a("aborting upload... "+r),this.aborted=1;try{g.contentWindow.document.execCommand&&g.contentWindow.document.execCommand("Stop")}catch(n){}v.attr("src",m.iframeSrc),x.error=r,m.error&&m.error.call(m.context,x,r,t),p&&e.event.trigger("ajaxError",[x,m,r]),m.complete&&m.complete.call(m.context,x,r)}},p=m.global,p&&0===e.active++&&e.event.trigger("ajaxStart"),p&&e.event.trigger("ajaxSend",[x,m]),m.beforeSend&&m.beforeSend.call(m.context,x,m)===!1)return m.global&&e.active--,S.reject(),S;if(x.aborted)return S.reject(),S;b=w.clk,b&&(y=b.name,y&&!b.disabled&&(m.extraData=m.extraData||{},m.extraData[y]=b.value,"image"==b.type&&(m.extraData[y+".x"]=w.clk_x,m.extraData[y+".y"]=w.clk_y)));var k=1,D=2,A=e("meta[name=csrf-token]").attr("content"),L=e("meta[name=csrf-param]").attr("content");L&&A&&(m.extraData=m.extraData||{},m.extraData[L]=A),m.forceSync?o():setTimeout(o,10);var E,M,F,O=50,X=e.parseXML||function(e,t){return window.ActiveXObject?(t=new ActiveXObject("Microsoft.XMLDOM"),t.async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!=t.documentElement.nodeName?t:null},C=e.parseJSON||function(e){return window.eval("("+e+")")},_=function(t,r,a){var n=t.getResponseHeader("content-type")||"",i="xml"===r||!r&&n.indexOf("xml")>=0,o=i?t.responseXML:t.responseText;return i&&"parsererror"===o.documentElement.nodeName&&e.error&&e.error("parsererror"),a&&a.dataFilter&&(o=a.dataFilter(o,r)),"string"==typeof o&&("json"===r||!r&&n.indexOf("json")>=0?o=C(o):("script"===r||!r&&n.indexOf("javascript")>=0)&&e.globalEval(o)),o};return S}if(!this.length)return a("ajaxSubmit: skipping submit process - no element selected"),this;var u,l,c,f=this;"function"==typeof t?t={success:t}:void 0===t&&(t={}),u=t.type||this.attr2("method"),l=t.url||this.attr2("action"),c="string"==typeof l?e.trim(l):"",c=c||window.location.href||"",c&&(c=(c.match(/^([^#]+)/)||[])[1]),t=e.extend(!0,{url:c,success:e.ajaxSettings.success,type:u||e.ajaxSettings.type,iframeSrc:/^https/i.test(window.location.href||"")?"javascript:false":"about:blank"},t);var m={};if(this.trigger("form-pre-serialize",[this,t,m]),m.veto)return a("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(t.beforeSerialize&&t.beforeSerialize(this,t)===!1)return a("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var p=t.traditional;void 0===p&&(p=e.ajaxSettings.traditional);var d,h=[],v=this.formToArray(t.semantic,h);if(t.data&&(t.extraData=t.data,d=e.param(t.data,p)),t.beforeSubmit&&t.beforeSubmit(v,this,t)===!1)return a("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[v,this,t,m]),m.veto)return a("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var g=e.param(v,p);d&&(g=g?g+"&"+d:d),"GET"==t.type.toUpperCase()?(t.url+=(t.url.indexOf("?")>=0?"&":"?")+g,t.data=null):t.data=g;var x=[];if(t.resetForm&&x.push(function(){f.resetForm()}),t.clearForm&&x.push(function(){f.clearForm(t.includeHidden)}),!t.dataType&&t.target){var b=t.success||function(){};x.push(function(r){var a=t.replaceTarget?"replaceWith":"html";e(t.target)[a](r).each(b,arguments)})}else t.success&&x.push(t.success);if(t.success=function(e,r,a){for(var n=t.context||this,i=0,o=x.length;o>i;i++)x[i].apply(n,[e,r,a||f,f])},t.error){var y=t.error;t.error=function(e,r,a){var n=t.context||this;y.apply(n,[e,r,a,f])}}if(t.complete){var T=t.complete;t.complete=function(e,r){var a=t.context||this;T.apply(a,[e,r,f])}}var j=e("input[type=file]:enabled",this).filter(function(){return""!==e(this).val()}),w=j.length>0,S="multipart/form-data",k=f.attr("enctype")==S||f.attr("encoding")==S,D=n.fileapi&&n.formdata;a("fileAPI :"+D);var A,L=(w||k)&&!D;t.iframe!==!1&&(t.iframe||L)?t.closeKeepAlive?e.get(t.closeKeepAlive,function(){A=s(v)}):A=s(v):A=(w||k)&&D?o(v):e.ajax(t),f.removeData("jqxhr").data("jqxhr",A);for(var E=0;h.length>E;E++)h[E]=null;return this.trigger("form-submit-notify",[this,t]),this},e.fn.ajaxForm=function(n){if(n=n||{},n.delegation=n.delegation&&e.isFunction(e.fn.on),!n.delegation&&0===this.length){var i={s:this.selector,c:this.context};return!e.isReady&&i.s?(a("DOM not ready, queuing ajaxForm"),e(function(){e(i.s,i.c).ajaxForm(n)}),this):(a("terminating; zero elements found by selector"+(e.isReady?"":" (DOM not ready)")),this)}return n.delegation?(e(document).off("submit.form-plugin",this.selector,t).off("click.form-plugin",this.selector,r).on("submit.form-plugin",this.selector,n,t).on("click.form-plugin",this.selector,n,r),this):this.ajaxFormUnbind().bind("submit.form-plugin",n,t).bind("click.form-plugin",n,r)},e.fn.ajaxFormUnbind=function(){return this.unbind("submit.form-plugin click.form-plugin")},e.fn.formToArray=function(t,r){var a=[];if(0===this.length)return a;var i=this[0],o=t?i.getElementsByTagName("*"):i.elements;if(!o)return a;var s,u,l,c,f,m,p;for(s=0,m=o.length;m>s;s++)if(f=o[s],l=f.name,l&&!f.disabled)if(t&&i.clk&&"image"==f.type)i.clk==f&&(a.push({name:l,value:e(f).val(),type:f.type}),a.push({name:l+".x",value:i.clk_x},{name:l+".y",value:i.clk_y}));else if(c=e.fieldValue(f,!0),c&&c.constructor==Array)for(r&&r.push(f),u=0,p=c.length;p>u;u++)a.push({name:l,value:c[u]});else if(n.fileapi&&"file"==f.type){r&&r.push(f);var d=f.files;if(d.length)for(u=0;d.length>u;u++)a.push({name:l,value:d[u],type:f.type});else a.push({name:l,value:"",type:f.type})}else null!==c&&c!==void 0&&(r&&r.push(f),a.push({name:l,value:c,type:f.type,required:f.required}));if(!t&&i.clk){var h=e(i.clk),v=h[0];l=v.name,l&&!v.disabled&&"image"==v.type&&(a.push({name:l,value:h.val()}),a.push({name:l+".x",value:i.clk_x},{name:l+".y",value:i.clk_y}))}return a},e.fn.formSerialize=function(t){return e.param(this.formToArray(t))},e.fn.fieldSerialize=function(t){var r=[];return this.each(function(){var a=this.name;if(a){var n=e.fieldValue(this,t);if(n&&n.constructor==Array)for(var i=0,o=n.length;o>i;i++)r.push({name:a,value:n[i]});else null!==n&&n!==void 0&&r.push({name:this.name,value:n})}}),e.param(r)},e.fn.fieldValue=function(t){for(var r=[],a=0,n=this.length;n>a;a++){var i=this[a],o=e.fieldValue(i,t);null===o||void 0===o||o.constructor==Array&&!o.length||(o.constructor==Array?e.merge(r,o):r.push(o))}return r},e.fieldValue=function(t,r){var a=t.name,n=t.type,i=t.tagName.toLowerCase();if(void 0===r&&(r=!0),r&&(!a||t.disabled||"reset"==n||"button"==n||("checkbox"==n||"radio"==n)&&!t.checked||("submit"==n||"image"==n)&&t.form&&t.form.clk!=t||"select"==i&&-1==t.selectedIndex))return null;if("select"==i){var o=t.selectedIndex;if(0>o)return null;for(var s=[],u=t.options,l="select-one"==n,c=l?o+1:u.length,f=l?o:0;c>f;f++){var m=u[f];if(m.selected){var p=m.value;if(p||(p=m.attributes&&m.attributes.value&&!m.attributes.value.specified?m.text:m.value),l)return p;s.push(p)}}return s}return e(t).val()},e.fn.clearForm=function(t){return this.each(function(){e("input,select,textarea",this).clearFields(t)})},e.fn.clearFields=e.fn.clearInputs=function(t){var r=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var a=this.type,n=this.tagName.toLowerCase();r.test(a)||"textarea"==n?this.value="":"checkbox"==a||"radio"==a?this.checked=!1:"select"==n?this.selectedIndex=-1:"file"==a?/MSIE/.test(navigator.userAgent)?e(this).replaceWith(e(this).clone(!0)):e(this).val(""):t&&(t===!0&&/hidden/.test(a)||"string"==typeof t&&e(this).is(t))&&(this.value="")})},e.fn.resetForm=function(){return this.each(function(){("function"==typeof this.reset||"object"==typeof this.reset&&!this.reset.nodeType)&&this.reset()})},e.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},e.fn.selected=function(t){return void 0===t&&(t=!0),this.each(function(){var r=this.type;if("checkbox"==r||"radio"==r)this.checked=t;else if("option"==this.tagName.toLowerCase()){var a=e(this).parent("select");t&&a[0]&&"select-one"==a[0].type&&a.find("option").selected(!1),this.selected=t}})},e.fn.ajaxSubmit.debug=!1})("undefined"!=typeof jQuery?jQuery:window.Zepto);
/* ========================================================================
 * Bootstrap: tab.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#tabs
 * ========================================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */



+function ($) { "use strict";

  // TAB CLASS DEFINITION
  // ====================

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.prototype.show = function () {
    var $this    = this.element
    var $ul      = $this.closest('ul:not(.dropdown-menu)')
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    if ($this.parent('li').hasClass('active')) return

    var previous = $ul.find('.active:last a')[0]
    var e        = $.Event('show.bs.tab', {
      relatedTarget: previous
    })

    $this.trigger(e)

    if (e.isDefaultPrevented()) return

    var $target = $(selector)

    this.activate($this.parent('li'), $ul)
    this.activate($target, $target.parent(), function () {
      $this.trigger({
        type: 'shown.bs.tab'
      , relatedTarget: previous
      })
    })
  }

  Tab.prototype.activate = function (element, container, callback) {
    var $active    = container.find('> .active')
    var transition = callback
      && $.support.transition
      && $active.hasClass('fade')

    function next() {
      $active
        .removeClass('active')
        .find('> .dropdown-menu > .active')
        .removeClass('active')

      element.addClass('active')

      if (transition) {
        element[0].offsetWidth // reflow for transition
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      if (element.parent('.dropdown-menu')) {
        element.closest('li.dropdown').addClass('active')
      }

      callback && callback()
    }

    transition ?
      $active
        .one($.support.transition.end, next)
        .emulateTransitionEnd(150) :
      next()

    $active.removeClass('in')
  }


  // TAB PLUGIN DEFINITION
  // =====================

  var old = $.fn.tab

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.tab')

      if (!data) $this.data('bs.tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


  // TAB NO CONFLICT
  // ===============

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


  // TAB DATA-API
  // ============

  $(document).on('click.bs.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}(window.jQuery);
/* ========================================================================
 * Bootstrap: tooltip.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */



+function ($) { "use strict";

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.DEFAULTS = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled  = true
    this.type     = type
    this.$element = $(element)
    this.options  = this.getOptions(options)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focus'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay
      , hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type)

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type)

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.'+ this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      var $tip = this.tip()

      this.setContent()

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var $parent = this.$element.parent()

        var orgPlacement = placement
        var docScroll    = document.documentElement.scrollTop || document.body.scrollTop
        var parentWidth  = this.options.container == 'body' ? window.innerWidth  : $parent.outerWidth()
        var parentHeight = this.options.container == 'body' ? window.innerHeight : $parent.outerHeight()
        var parentLeft   = this.options.container == 'body' ? 0 : $parent.offset().left

        placement = placement == 'bottom' && pos.top   + pos.height  + actualHeight - docScroll > parentHeight  ? 'top'    :
                    placement == 'top'    && pos.top   - docScroll   - actualHeight < 0                         ? 'bottom' :
                    placement == 'right'  && pos.right + actualWidth > parentWidth                              ? 'left'   :
                    placement == 'left'   && pos.left  - actualWidth < parentLeft                               ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)
      this.$element.trigger('shown.bs.' + this.type)
    }
  }

  Tooltip.prototype.applyPlacement = function(offset, placement) {
    var replace
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    $tip
      .offset(offset)
      .addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      replace = true
      offset.top = offset.top + height - actualHeight
    }

    if (/bottom|top/.test(placement)) {
      var delta = 0

      if (offset.left < 0) {
        delta       = offset.left * -2
        offset.left = 0

        $tip.offset(offset)

        actualWidth  = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight
      }

      this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
    } else {
      this.replaceArrow(actualHeight - height, actualHeight, 'top')
    }

    if (replace) $tip.offset(offset)
  }

  Tooltip.prototype.replaceArrow = function(delta, dimension, position) {
    this.arrow().css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function () {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.bs.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && this.$tip.hasClass('fade') ?
      $tip
        .one($.support.transition.end, complete)
        .emulateTransitionEnd(150) :
      complete()

    this.$element.trigger('hidden.bs.' + this.type)

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function () {
    var el = this.$element[0]
    return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
      width: el.offsetWidth
    , height: el.offsetHeight
    }, this.$element.offset())
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width   }
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.tip = function () {
    return this.$tip = this.$tip || $(this.options.template)
  }

  Tooltip.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow')
  }

  Tooltip.prototype.validate = function () {
    if (!this.$element[0].parentNode) {
      this.hide()
      this.$element = null
      this.options  = null
    }
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = e ? $(e.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type) : this
    self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    this.hide().$element.off('.' + this.type).removeData('bs.' + this.type)
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  var old = $.fn.tooltip

  $.fn.tooltip = function (option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
(function () {
  // Include the UserVoice JavaScript SDK (only needed once on a page)
  UserVoice=window.UserVoice||[];(function(){var uv=document.createElement('script');uv.type='text/javascript';uv.async=true;uv.src='//widget.uservoice.com/Kz832QVG7f6o27OTnyL7Q.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(uv,s)})();

  //
  // UserVoice Javascript SDK developer documentation:
  // https://www.uservoice.com/o/javascript-sdk
  //

  // Set colors
  UserVoice.push(['set', {
    accent_color: '#6aba2e',
    trigger_color: 'white',
    trigger_background_color: '#448dd6'
  }]);

  // Identify the user and pass traits
  // To enable, replace sample data with actual user traits and uncomment the line
  UserVoice.push(['identify', {
    //email:      'john.doe@example.com', // User’s email address
    //name:       'John Doe', // User’s real name
    //created_at: 1364406966, // Unix timestamp for the date the user signed up
    //id:         123, // Optional: Unique id of the user (if set, this should not change)
    //type:       'Owner', // Optional: segment your users by type
    //account: {
    //  id:           123, // Optional: associate multiple users with a single account
    //  name:         'Acme, Co.', // Account name
    //  created_at:   1364406966, // Unix timestamp for the date the account was created
    //  monthly_rate: 9.99, // Decimal; monthly rate of the account
    //  ltv:          1495.00, // Decimal; lifetime value of the account
    //  plan:         'Enhanced' // Plan name for the account
    //}
  }]);

  // Add default trigger to the bottom-right corner of the window:
  UserVoice.push(['addTrigger', { mode: 'contact', trigger_position: 'bottom-right' }]);

  // Or, use your own custom trigger:
  //UserVoice.push(['addTrigger', '#id', { mode: 'contact' }]);

  // Autoprompt for Satisfaction and SmartVote (only displayed under certain conditions)
  UserVoice.push(['autoprompt', {}]);
})();
(function($, undefined) {
    // Start determinant for callback count
    var dpsOnPage = $('.sf-datepicker').size();

    // Global pub-sub handler
    var $EventsBus = $({});

    var $fndps = $.fn.sfDatePicker = function(userSettings, options) {
        // this is a method/property call
        if (typeof (userSettings) === 'string') {
            this.each(function() {
                if (typeof this[userSettings] === 'function') {
                    this[userSettings](options);
                }
            });
        }
        // this is initialization
        else {
            me = $(this);

            if (typeof userSettings === 'object' && typeof userSettings.wireup != 'undefined') {
                me = $('.sf-datepicker');
            }

            if (typeof userSettings === 'object' && typeof userSettings.rangeGroup != 'undefined') {
                $(this).attr('data-range-group', userSettings.rangeGroup);
                $(this).attr('data-range-position', userSettings.rangePosition);
            }

            // Set a callback count
            if (!$(me[0]).hasClass('sf-datepicker')) {
                dpsOnPage += me.length;
            }

            me.each(function() {
                var self = $(this);
                var minDate = self.attr('data-min-date');
                if (typeof (minDate) == 'string')
                    minDate = new Date(minDate);
                var maxDate = self.attr('data-max-date');
                if (typeof (maxDate) == 'string')
                    maxDate = new Date(maxDate);
                var settings = $.extend({
                    prefix: 'dp-style',
                    zIndex: undefined,
                    dateFormat: self.attr('data-date-format') || '%m/%d/%Y',
                    dateOverride: self.attr('data-date-override') || null,
                    rangeGroup: self.attr('data-range-group') || null,
                    beforeToday: self.attr('data-before-today') === 'true' || false,
                    minDate: minDate,
                    maxDate: maxDate,
                    onSelect: function() {},
                    onChange: function() {},
                    afterInit: function() {},
                    context: window,
                    displayContext: window,
                    zAnchor: null
                }, userSettings);
                var zUtil = ux.util.zIndex;
                var logger = null;
                var context = ux.util.context(settings.context, settings.displayContext);

                if (typeof ($fndps.instances) === 'undefined') $fndps.instances = [];
                $fndps.instances.push(self);

                $.extend(this, {
                    init: function() {
                        $el = $(this);
                        $el.addClass("sf-datepicker");

                        var dims = {
                            width: $el.outerWidth(),
                            height: $el.outerHeight()
                        };
                        var pos = $el.offset();
                        // Creates a unique id with which the calendar can initialize itself
                        var uid = '' + settings.prefix + Math.round(Math.random() * 65535);
                        logger = ux.util.logger(uid, 'duel');
                        var $trigger = $('<a href="#" class="trigger"><span class="uxicon uxicon-calendar-date"></span></a>');
                        var $wrapper = $('<span id="' + uid + '"></span>');
                        var $inputWrapper = $('<span />');
                        var $layer = ux.util.zIndex.getLayer('flyout', $(context.ext.body()), context.isSingle() ? $el : context.ext.iframe());

                        $inputWrapper.css({
                            position: 'relative',
                            display: 'inline-block'
                        });

                        $el.wrap($inputWrapper);

                        $wrapper.addClass("sf-dp-wrapper dp-wrapper").css({
                            height: dims.height,
                            zIndex: '',
                            display: 'none'
                        });

                        $trigger.addClass("sf-dp-trigger");
                        $trigger.insertAfter($el);

                        $wrapper.appendTo($layer);

                        var cal = new dhtmlxCalendarObject(
                            uid,
                            false,
                            null,
                            context,
                            logger
                        );

                        cal.setDateFormat(settings.dateFormat);
                        cal.loadUserLanguage('en-us');
                        cal.setSkin("gd");
                        cal.draw();
                        cal.show();
                        cal.hide();
                        cal.setWeekStartDay(7);
                        cal.hideTime();

                        // Sets today as a "holiday" so it gets a special, persistent css class
                        if (settings.dateOverride && settings.dateOverride !== 'none') {
                            cal.setDate(cal.getFormatedDate(cal._dateFormat, cal._strToDate(settings.dateOverride)));
                        }

                        cal.setHolidays(cal.getFormatedDate(cal._dateFormat, cal.getDate()));

                        if ($el.val() && cal._strToDate($el.val()) !== 'Invalid Date') {
                            cal.setDate(cal._strToDate($el.val()));
                        }

                        // Caches the calendar container as a jQuery object
                        var $calContainer = $(cal.base);

                        $calContainer.css({
                            position: 'absolute'
                        });

                        var $today = $('<div class="btn-pane"><a class="today btn btn-default btn-sm" href="#">' + (cal.langData[cal.lang].today || 'Today') + '</a></div>');
                        $calContainer.append($today);

                        this.set('uid', uid);
                        this.set('container', $calContainer);
                        this.set('input', $el);
                        this.set('wrapper', $wrapper);
                        this.set('trigger', $trigger);
                        this.set('layer', $layer);
                        this.set('cal', cal);
                        this.set('today', $today);
                        this.set('defaultDate', this._getDefaultDate());

                        this.bindings();

                        if (settings.rangeGroup) {
                            this.rangedBindings();
                        }
                        this.setDate(settings.dateOverride === 'none' ? '' : this.get('defaultDate'));

                        if (settings.minDate || settings.maxDate) {
                            this._setRange(settings.minDate, settings.maxDate);
                        }
                        else if (!settings.beforeToday) {
                            this._setMinRange();
                        }

                        dpsOnPage--;
                        if (dpsOnPage === 0) {
                            settings.afterInit.call(me);
                            $EventsBus.trigger('dp.allInitsFinished.dp-on' + this.get('uid'));
                        }

                        this.positionTrigger();

                        var $dp = this;
                        var reposition = function(e) {
                            var elMod = e.args[0] ? e.args[0].moduleElement ? e.args[0].moduleElement : null : null;
                            if (elMod && (context.isSingle() ? elMod.has($dp.get('input')).length > 0 : ux.util.jCompat.isEl(elMod, context.ext.iframe()))) {
                                $dp.showAll();
                                $dp.positionWrapper();
                            }
                        };
                        var extWin = context.ext.window();
                        extWin.ux.util.event.on('dragstart', function(e) {
                            var elMod = e.args[0] ? e.args[0].moduleElement ? e.args[0].moduleElement : null : null;
                            if (elMod && (context.isSingle() ? elMod.has($dp.get('input')).length > 0 : ux.util.jCompat.isEl(elMod, context.ext.iframe())))
                                $dp.hideAll(true);
                        });
                        extWin.ux.util.event.on('dragend', reposition);
                        extWin.ux.util.event.on('resize', reposition);
                    },
                    destroy: function() {
                        var extWin = context.ext.window();
                        extWin.ux.util.event.off('dragstart');
                        extWin.ux.util.event.off('dragend');
                        extWin.ux.util.event.off('resize');

                        var cal = this.get('cal');
                        cal.unload();
                        var wrapper = this.get('wrapper');
                        var input = this.get('input').before(wrapper);
                        var namespace = '.dp-on' + this.get('uid');

                        input.unbind('click' + namespace);
                        input.unbind('change' + namespace);

                        $(context.intr.window()).unbind('resize' + namespace);

                        if (!context.isSingle()) {
                            $(context.ext.window()).unbind('resize' + namespace);

                            $(context.intr.window()).unbind('scroll' + namespace);
                        }

                        namespace = '.dp-blur' + this.get('uid');
                        $(context.intr.body()).unbind('click' + namespace);
                        $(context.intr.body()).unbind('click' + namespace);

                        if (!context.isSingle()) {
                            $(context.ext.body()).unbind('click' + namespace);
                            $(context.ext.body()).unbind('click' + namespace);
                        }

                        wrapper.remove();
                        this.get('container').remove();
                        this.get('trigger').remove();

                        var me = self;

                        // get rid of the instance!
                        $fndps.instances = _.reject($fndps.instances, function(instance) {
                            return instance === me;
                        });
                    },
                    positionTrigger: function() {
                        var $el = this.get('input');
                        var $trigger = this.get('trigger');
                        if (typeof ($trigger) === 'undefined') return;

                        var offset = {
                            top: 0,
                            left: 0
                        };

                        $trigger.css({
                            position: 'absolute',
                            top: offset.top + 'px',
                            left: (($el.outerWidth(true) + offset.left) - $trigger.outerWidth()) + 'px',
                            display: ((!context.isSingle() && !context.intr.isInBounds($el)) || $trigger.attr('data-hidden') === 'true' ? 'none' : 'block')
                        });
                    },
                    positionWrapper: function() {
                        var $el = this.get('input');
                        var $wrapper = this.get('wrapper');
                        if (typeof ($wrapper) === 'undefined') return;

                        var fixed = ux.util.zIndex.getStackingParent($el) !== null;
                        var offset = context.ext.offset($el, fixed);

                        if (context.isSingle() && fixed) {
                            offset.top -= $(context.ext.window()).scrollTop();
                            offset.left -= $(context.ext.window()).scrollLeft();
                        }

                        $wrapper.css({
                            position: fixed ? 'fixed' : 'absolute',
                            top: offset.top + 'px',
                            left: offset.left + 'px',
                            display: ((!context.isSingle() && !context.intr.isInBounds($el)) || $wrapper.attr('data-hidden') === 'true' ? 'none' : 'block')
                        });
                    },
                    enable: function() {
                        var input = this.get('input');
                        var $trigger = this.get('trigger');

                        input.removeAttr('disabled');
                        this.get('trigger').removeAttr('data-disabled');

                        $trigger.css('cursor', '');
                    },
                    disable: function() {
                        var input = this.get('input');
                        var $trigger = this.get('trigger');

                        input.attr('disabled', true);
                        this.get('trigger').attr('data-disabled', true);

                        $trigger.css('cursor', 'default');
                    },
                    show: function() {
                        var $trigger = this.get('trigger');
                        var $wrapper = this.get('wrapper');
                        var $layer = this.get('layer');
                        var $calContainer = this.get('container');
                        var $el = this.get('input');
                        var elOffset = context.ext.offset($el);

                        var cal = this.get('cal');

                        this.positionWrapper();

                        var alignLeft = 0;
                        var alignRight = $el.outerWidth() - $calContainer.outerWidth() + 1;

                        var left = alignRight;
                        var calsLeftOffset = elOffset.left - ($calContainer.outerWidth() - $el.outerWidth());

                        if (calsLeftOffset < 0) {
                            left = $el.outerWidth() - $trigger.outerWidth() + 1;
                            $wrapper.addClass('dp-left-align');
                        }
                        else {
                            $wrapper.removeClass('dp-left-align');
                        }

                        var to = {
                            top: $trigger.outerHeight(),
                            left: left
                        }

                        $el.addClass('dp-showing');
                        $trigger.addClass('dp-trigger-active');

                        // get the zIndex if it's not specified
                        var zIndex = !isNaN(settings.zIndex) ? settings.zIndex : ux.util.zIndex.getTop(settings.zAnchor !== null ? settings.zAnchor : $el);

                        $wrapper
                            .css({
                                zIndex: ux.util.zIndex.maxForLayer($layer) + 1
                            })
                            .removeAttr('data-hidden');

                        $trigger
                            .css({
                                zIndex: zIndex + 10
                            })
                            .removeAttr('data-hidden');

                        $calContainer.css({
                            top: to.top - 2,
                            left: to.left - 1
                        });

                        this._updateCalDateFromInput();

                        $wrapper.show();
                        $calContainer.show();
                        this._appendArrow();
                    },
                    bindings: function() {
                        var _this = this;
                        var $trigger = this.get('trigger');
                        var $input = this.get('input');
                        var $container = this.get('container');
                        var $wrapper = this.get('wrapper');
                        var $el = this.get('input');
                        var cal = this.get('cal');
                        var $today = this.get('today');
                        var namespace = '.dp-on' + _this.get('uid');
                        var extWin = $(context.ext.window());
                        var intWin = $(context.intr.window());

                        $el.bind('click' + namespace, function(e) {
                            e.stopPropagation();
                            e.preventDefault();

                            if (!$el.hasClass('dp-showing')) {
                                $.each($fndps.instances, function(i, instance) {
                                    try {
                                        if (instance.hasClass('dp-showing') && !ux.util.jCompat.isEl(instance, $el)) {
                                            instance.sfDatePicker('hide');
                                        }
                                    }
                                    catch (ex) {
                                        // this will most likely happen when using these in iframe
                                        // modals and the context is destroyed.  Sigh. iFrames.
                                        //logger.log('problem hiding instance');
                                        $fndps.instances[i] = null;
                                    }
                                });

                                $fndps.instances = _.compact($fndps.instances);

                                _this.show();

                                var namespace = '.dp-blur' + _this.get('uid');
                                var extBody = $(context.ext.body());
                                var intBody = $(context.intr.body());

                                function dpBlur() {
                                    _this.hide();
                                    intBody.unbind('click' + namespace);
                                }

                                function safeBlur() {
                                    try {
                                        dpBlur();
                                    }
                                    catch (ex) {
                                        // if this failed then the iframe element has been removed from the DOM
                                        // clean up it's bindings
                                        //logger.log('unsafe blur!');
                                        extBody.unbind('click' + namespace);
                                    }
                                }

                                intBody.unbind('click' + namespace);
                                intBody.bind('click' + namespace, dpBlur);

                                if (!context.isSingle()) {
                                    extBody.unbind('click' + namespace);
                                    extBody.bind('click' + namespace, safeBlur);
                                }
                            }
                            else {
                                _this.hide();
                            }

                            if (!cal.attached) {
                                cal.attached = true;

                                cal.attachEvent('onClick', function(date) {
                                    _this.setDate(_this._getCurrentDate());
                                    _this.hide();
                                    settings.onSelect($el, _this._getCurrentDate());
                                });

                                cal.attachEvent('onChange', function() {
                                    $('.dhtmlxcalendar_month_label_year').removeClass('selected');
                                    $('.dhtmlxcalendar_month_label_month').removeClass('selected');
                                });

                                cal.attachEvent('onSelectorHide', function() {
                                    $('.dhtmlxcalendar_month_label_year').removeClass('selected');
                                    $('.dhtmlxcalendar_month_label_month').removeClass('selected');
                                });

                                var $month, $year;

                                cal.attachEvent('onShowMonthSelector', function(t) {
                                    $(t).addClass('selected');
                                    $(t).siblings().removeClass('selected');
                                });
                                cal.attachEvent('onShowYearSelector', function(t) {
                                    $(t).addClass('selected');
                                    $(t).siblings().removeClass('selected');
                                });
                                cal.attachEvent('onYearSelected', function(t) {
                                    _this._appendArrow();
                                });
                            }
                        });

                        $el.bind('change' + namespace, function(e) {
                            settings.onChange($el, $el.val());
                        });

                        function resize() {
                            _this.positionTrigger();
                            _this.positionWrapper();
                        }

                        function safeResize() {
                            try {
                                resize();
                            }
                            catch (ex) {
                                // if this failed then the iframe element has been removed from the DOM
                                // clean up it's bindings
                                extWin.unbind('resize' + namespace);
                            }
                        }

                        intWin.bind('resize' + namespace, resize);


                        if (!context.isSingle()) {

                            extWin.bind('resize' + namespace, safeResize);

                            intWin.bind('scroll' + namespace, resize);
                        }

                        $EventsBus.bind('dp.allInitsFinished' + namespace, safeResize);

                        $trigger.click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();

                            if (!$(this).attr('data-disabled'))
                                $el.trigger('click' + namespace);
                        });

                        $today.click(function(e) {
                            e.preventDefault();
                            var d = cal.getFormatedDate(cal._dateFormat, new Date());
                            _this.setDate(d);
                            settings.onSelect($el, d);
                            _this.hide();
                        });

                    },
                    rangedBindings: function() {
                        var $trigger = this.get('trigger');
                        var cal = this.get('cal');
                        var $input = this.get('input');
                        var _this = this;
                        var rangeGroup = settings.rangeGroup;
                        var $today = this.get('today');
                        var $range = $('[data-range-group="' + rangeGroup + '"]');
                        var $from = $range.filter(':eq(0)');
                        var $to = $range.filter(':eq(1)');
                        if ($range.length > 1) {
                            $from.data('range-position', 'from');
                            $to.data('range-position', 'to');
                        }

                        if ($input.data('range-position') === 'to') {
                            $from.bind('sfdp.' + rangeGroup, function(e, data) {
                                cal.clearSensitiveRange();
                                _this._setMinRange(data.date);
                                _this._disableToday(data.disableToday);

                            });

                            $from.bind('sfdp.triggerOpen', function(e, data) {
                                if (!data) {
                                    var fromCal = this.get('cal');
                                    var data = {};

                                    fromCal.setDate(cal.getFormatedDate(fromCal._dateFormat, new Date($from.val())));
                                    data.date = fromCal.getFormatedDate(fromCal._dateFormat);
                                }

                                cal.clearSensitiveRange();

                                if ($from.val() !== '') _this._setMinRange(data.date);
                            });

                            $trigger.click(function() {
                                $from.trigger('sfdp.triggerOpen');
                                _this._appendArrow();
                                setTimeout(function() {
                                    _this._appendArrow();
                                }, 300);
                            });

                        }
                        else {
                            function updateRange() {
                                var selectedDate = new Date(_this._getBrowserFriendlyDate());
                                var todayDate = new Date();

                                var disable = false;

                                if (selectedDate.getTime() > todayDate.getTime()) {
                                    disable = true;
                                }

                                $input.trigger('sfdp.' + rangeGroup, {
                                    date: cal.getFormatedDate(cal._dateFormat),
                                    disableToday: disable
                                });
                            }

                            $input.bind('sfdp.updateRange', updateRange);

                            cal.attachEvent('onClick', function(date) {
                                _this.setDate(_this._getCurrentDate());
                                _this.hide();

                                updateRange();
                            });

                            $from.bind('change', function() {
                                _this.setDate($(this).val());

                                //updateRange();
                            });

                            $trigger.click(function() {
                                $input.trigger('sfdp.triggerOpen', {
                                    date: cal.getFormatedDate(cal._dateFormat)
                                });
                            });
                        };

                        $(this).removeClass('me');

                    },
                    hide: function() {
                        var $trigger = this.get('trigger');
                        var $container = this.get('container');
                        var $el = this.get('input');
                        var $wrapper = this.get('wrapper');

                        $trigger
                            .css({
                                zIndex: ''
                            })
                            .attr('data-hidden', true);

                        $wrapper
                            .css({
                                zIndex: '',
                                display: 'none'
                            })
                            .attr('data-hidden', true);

                        $el.removeClass('dp-showing');
                        $trigger.removeClass('dp-trigger-active');

                        $container.unbind('click.dp-protect');

                        $container.hide();
                    },
                    hideAll: function(controlsOnly) {
                        var $trigger = this.get('trigger');
                        var $el = this.get('input');
                        var $wrapper = this.get('wrapper');
                        this.hide();

                        $trigger.hide();
                        $wrapper.hide();
                        if (controlsOnly !== true) $el.hide();
                    },
                    showAll: function() {

                        var $trigger = this.get('trigger');
                        var $el = this.get('input');
                        var $wrapper = this.get('wrapper');

                        $trigger.removeAttr('data-hidden').show();
                        $wrapper.removeAttr('data-hidden').show();
                        $el.show();
                        this.positionTrigger();
                    },
                    set: function(name, value) {
                        $(this).data(name, value);
                    },
                    get: function(name, value) {
                        return $(this).data(name);
                    },
                    setDate: function(date) {
                        if (typeof (date) === 'date') date = ('0' + (date.getUTCMonth() + 1)).substr(-2) + '/' + ('0' + date.getUTCDate()).substr(-2) + '/' + date.getUTCFullYear();
                        var $el = this.get('input');
                        var oldDate = $el.val();
                        $el.val(date);
                        this._updateCalDateFromInput();
                        if (oldDate !== date) settings.onChange($el, date);
                        $el.trigger('sfdp.updateRange');
                    },
                    _appendArrow: function() {
                        var $container = this.get('container');

                        var currentYear = $container.find('.dhtmlxcalendar_month_label_year').text();
                        currentYear += '<span class="arrow"></span>';

                        //console.log( currentYear );
                        $container.find('.dhtmlxcalendar_month_label_year').html(currentYear);
                    },
                    _disableToday: function(disable) {
                        var $today = this.get('today');

                        if (disable) {
                            $today.hide();
                        }
                        else {
                            $today.show();
                        }
                    },
                    _getDefaultDate: function() {
                        var cal = this.get('cal');

                        return cal.getFormatedDate(settings.dateFormat, cal.getDate());
                    },
                    _getCurrentDate: function() {
                        var cal = this.get('cal');
                        return cal.getFormatedDate(settings.dateFormat);
                    },
                    _getPluginFriendlyDate: function() {
                        var cal = this.get('cal');
                        return cal.getFormatedDate(cal._dateFormat, cal.getDate());
                    },
                    _getBrowserFriendlyDate: function() {
                        var cal = this.get('cal');
                        return cal.getFormatedDate(cal._dateFormat, cal.getDate());
                    },
                    _setMinRange: function(overrideDate) {
                        var cal = this.get('cal');
                        var formattedDate = this._getDayBefore(this._getBrowserFriendlyDate());

                        if (overrideDate) {
                            formattedDate = this._getDayBefore(overrideDate);
                            var dateVal = this.get('input').val();

                            var currentlySetDate = new Date(this._getBrowserFriendlyDate());
                            var newDate = new Date(+new Date(overrideDate) + (+(new Date()).getTimezoneOffset() * 60000));

                            if (dateVal === '' || currentlySetDate.getTime() < newDate.getTime()) {
                                cal.setDate(cal.getFormatedDate(cal._dateFormat, newDate));
                                this.setDate(cal.getFormatedDate(settings.dateFormat));
                            }
                        }

                        if (this.get('input').data('range-position') === 'to' && typeof (this.max) !== 'undefined' && this.max.length > 0)
                            cal.setSensitiveRange(this._getDayAfter(formattedDate), this.max);
                        else
                            cal.setInsensitiveRange(null, formattedDate);

                    },
                    _setRange: function(min, max) {
                        var cal = this.get('cal');
                        var from = null,
                            to = null;
                        if (min) {
                            from = cal.getFormatedDate(cal._dateFormat, min);
                            this.min = cal.getFormatedDate(cal._dateFormat, min);
                        }
                        if (max) {
                            to = cal.getFormatedDate(cal._dateFormat, max);
                            this.max = cal.getFormatedDate(cal._dateFormat, max);
                        }
                        var currentlySetDate = new Date(this._getBrowserFriendlyDate());

                        if (min && currentlySetDate.getTime() < min.getTime()) {
                            cal.setDate(cal.getFormatedDate(cal._dateFormat, new Date(min)));
                            this.setDate(cal.getFormatedDate(settings.dateFormat));
                        }
                        else if (max && currentlySetDate.getTime() > max.getTime()) {
                            cal.setDate(cal.getFormatedDate(cal._dateFormat, new Date(max)));
                            this.setDate(cal.getFormatedDate(settings.dateFormat));
                        }

                        cal.setSensitiveRange(from, to);
                    },
                    _getDayBefore: function(date) {
                        var cal = this.get('cal');
                        var date = cal._strToDate(date);
                        date.setDate(date.getDate() - 1)
                        var formattedDate = cal.getFormatedDate(cal._dateFormat, date);
                        return formattedDate;
                    },
                    _getDayAfter: function(date) {
                        var cal = this.get('cal');
                        var date = cal._strToDate(date);
                        date.setDate(date.getDate() + 1)
                        var formattedDate = cal.getFormatedDate(cal._dateFormat, date);
                        return formattedDate;
                    },
                    _updateCalDateFromInput: function() {
                        var $el = this.get('input');
                        var cal = this.get('cal');
                        var currentDate = new Date();
                        currentDate.setHours(0, 0, 0, 0);
                        var fieldDate = $el.val() === "" ? currentDate : cal._strToDate($el.val());
                        fieldDate.setHours(0, 0, 0, 0);

                        if (fieldDate.getTime() < currentDate.getTime() && !settings.beforeToday) {
                            var newDate = this._getCurrentDate();
                            $el.val(newDate);
                            settings.onChange($el, newDate);
                        }

                        cal.setDate(cal.getFormatedDate(cal._dateFormat, fieldDate));
                    }
                });

                this.init();

            });
        }
    }



        function dhtmlXCalendarObject(inps, skin, params, context, logger) {
            // parse inputs
            this.i = {};

            this.uid = function() {
                if (!this.uidd) this.uidd = new Date().getTime();
                return this.uidd++;
            }

            var p = null;
            if (typeof (inps) == "string") {
                var t0 = context.ext.document().getElementById(inps);
            }
            else {
                var t0 = inps;
            }
            if (t0 && typeof (t0) == "object" && t0.tagName && String(t0.tagName).toLowerCase() != "input") p = t0;
            t0 = null;

            // single param
            if (typeof (inps) != "object" || !inps.length) inps = [inps];
            for (var q = 0; q < inps.length; q++) {
                if (typeof (inps[q]) == "string") inps[q] = (context.intr.document().getElementById(inps[q]) || null);
                if (inps[q] != null && inps[q].tagName && String(inps[q].tagName).toLowerCase() == "input") {
                    this.i[this.uid()] = inps[q];
                }
                inps[q] = null;
            }

            this.skin = skin || "dhx_skyblue";
            this.setSkin = function(skin) {
                this.skin = skin;
                this.base.className = "dhtmlxcalendar_container dhtmlxcalendar_skin_" + this.skin;
            }

            // create base
            this.base = context.ext.document().createElement("DIV");
            this.base.className = "dhtmlxcalendar_container";
            this.base.style.display = "none";

            if (p != null) {
                this._hasParent = true;
                p.appendChild(this.base);
                p = null;
            }
            else {
                context.ext.body().appendChild(this.base);
            }

            this.setParent = function(p) {
                if (this._hasParent) {
                    if (typeof (p) == "object") {
                        p.appendChild(this.base);
                    }
                    else if (typeof (p) == "string") {
                        context.ext.document().getElementById(p).appendChild(this.base);
                    }
                }
            }

            this.setSkin(this.skin);

            this.base.onclick = function(e) {
                e = e || event;
                e.cancelBubble = true;
            }

            this.loadUserLanguage = function(lang) {
                if (!this.langData[lang]) return;
                this.lang = lang;
                this.setWeekStartDay(this.langData[this.lang].weekstart);
                // month selector
                if (this.msCont) {
                    var e = 0;
                    for (var q = 0; q < this.msCont.childNodes.length; q++) {
                        for (var w = 0; w < this.msCont.childNodes[q].childNodes.length; w++) {
                            this.msCont.childNodes[q].childNodes[w].innerHTML = this.langData[this.lang].monthesSNames[e++];
                        }
                    }
                }
            }

            // build month and year header
            this.contMonth = context.ext.document().createElement("DIV");
            this.contMonth.className = "dhtmlxcalendar_month_cont";
            this.contMonth.onselectstart = function(e) {
                e = e || event;
                e.cancelBubble = true;
                e.returnValue = false;
                return false;
            }
            this.base.appendChild(this.contMonth);

            var ul = context.ext.document().createElement("UL");
            ul.className = "dhtmlxcalendar_line";
            this.contMonth.appendChild(ul);

            var li = context.ext.document().createElement("LI");
            li.className = "dhtmlxcalendar_cell dhtmlxcalendar_month_hdr";
            li.innerHTML = "<div class='dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_left' onmouseover='this.className=\"dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_left_hover\";' onmouseout='this.className=\"dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_left\";'></div>" +
                "<span class='dhtmlxcalendar_month_label_month'>Month</span><span class='dhtmlxcalendar_month_label_year'>Year</span>" +
                "<div class='dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_right' onmouseover='this.className=\"dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_right_hover\";' onmouseout='this.className=\"dhtmlxcalendar_month_arrow dhtmlxcalendar_month_arrow_right\";'></div>";
            ul.appendChild(li);

            var that = this;
            li.onclick = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);

                if (t.className && t.className == "arrow") {
                    t = t.parentNode;
                }

                // change month by clicking left-right arrows
                if (t.className && t.className.indexOf("dhtmlxcalendar_month_arrow") === 0) {
                    that._hideSelector();
                    var ind = (t.parentNode.firstChild == t ? -1 : 1);
                    that._drawMonth(new Date(that._activeMonth.getFullYear(), that._activeMonth.getMonth() + ind, 1, 0, 0, 0, 0));
                    return;
                }
                // show month selector
                if (t.className && t.className == "dhtmlxcalendar_month_label_month") {
                    e.cancelBubble = true;
                    that._showSelector("month", 68, 36, "selector_month", true);
                    that.callEvent('onShowMonthSelector', [t]);
                    return;
                }
                // show year selector
                if (t.className && t.className == "dhtmlxcalendar_month_label_year") {
                    e.cancelBubble = true;
                    that._showSelector("year", 100, 36, "selector_year", true);
                    that.callEvent('onShowYearSelector', [t]);
                    return;
                }
                // hide selector if it visible
                that._hideSelector();
            }

            // build days names
            this.contDays = context.ext.document().createElement("DIV");
            this.contDays.className = "dhtmlxcalendar_days_cont";
            this.base.appendChild(this.contDays);

            this.setWeekStartDay = function(ind) {
                // 1..7 = Mo-Su, also 0 = Su
                if (ind == 0) ind = 7;
                this._wStart = Math.min(Math.max((isNaN(ind) ? 1 : ind), 1), 7);
                this._drawDaysOfWeek();
            }

            this._drawDaysOfWeek = function() {
                if (this.contDays.childNodes.length == 0) {
                    var ul = context.ext.document().createElement("UL");
                    ul.className = "dhtmlxcalendar_line";
                    this.contDays.appendChild(ul);
                }
                else {
                    var ul = this.contDays.firstChild;
                }

                var w = this._wStart;
                var k = this.langData[this.lang].daysSNames;
                k.push(String(this.langData[this.lang].daysSNames[0]).valueOf());

                for (var q = 0; q < 7; q++) {
                    if (ul.childNodes[q] == null) {
                        var li = context.ext.document().createElement("LI");
                        ul.appendChild(li);
                    }
                    else {
                        var li = ul.childNodes[q];
                    }
                    li.className = "dhtmlxcalendar_cell" + (w >= 6 ? " dhtmlxcalendar_day_weekday_cell" : "") + (q == 0 ? "_first" : "");
                    li.innerHTML = k[w];
                    if (++w > 7) w = 1;
                }
                if (this._activeMonth != null) this._drawMonth(this._activeMonth);
            }

            this._wStart = this.langData[this.lang].weekstart;
            this.setWeekStartDay(this._wStart);

            // dates container
            this.contDates = context.ext.document().createElement("DIV");
            this.contDates.className = "dhtmlxcalendar_dates_cont";
            this.base.appendChild(this.contDates);

            this.contDates.onclick = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                if (t._date != null && !t._css_dis) {

                    var t1 = that._activeDate.getHours();
                    var t2 = that._activeDate.getMinutes();

                    // cjeck if allow to modify input
                    if (that.checkEvent("onBeforeChange")) {
                        if (!that.callEvent("onBeforeChange", [new Date(t._date.getFullYear(), t._date.getMonth(), t._date.getDate(), t1, t2)])) return;
                    }

                    if (that._activeDateCell != null) {
                        that._activeDateCell._css_date = false;
                        that._updateCellStyle(that._activeDateCell._q, that._activeDateCell._w);
                    }

                    // update month if day from prev/next month clicked
                    var refreshView = (that._hasParent && that._activeDate.getFullYear() + "_" + that._activeDate.getMonth() != t._date.getFullYear() + "_" + t._date.getMonth());

                    that._activeDate = new Date(t._date.getFullYear(), t._date.getMonth(), t._date.getDate(), t1, t2);

                    that._activeDateCell = t;
                    that._activeDateCell._css_date = true;
                    that._activeDateCell._css_hover = false;
                    that._lastHover = null;
                    that._updateCellStyle(that._activeDateCell._q, that._activeDateCell._w);

                    if (refreshView) that._drawMonth(that._activeDate);

                    // update date in input if any
                    if (that._activeInp && that.i[that._activeInp]) {
                        that.i[that._activeInp].value = that._dateToStr(new Date(that._activeDate.getTime()));
                    }
                    // hide
                    if (!that._hasParent) that._hide();
                    //
                    that.callEvent("onClick", [new Date(that._activeDate.getTime())]);

                }
            }

            this.contDates.onmouseover = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                if (t._date != null) { // && t != that._activeDateCell) { // skip hover for selected date
                    t._css_hover = true;
                    that._updateCellStyle(t._q, t._w);
                    that._lastHover = t;
                }
            }
            this.contDates.onmouseout = function() {
                that._clearDayHover();
            }

            this._lastHover = null;
            this._clearDayHover = function() {
                if (!this._lastHover) return;
                this._lastHover._css_hover = false;
                this._updateCellStyle(this._lastHover._q, this._lastHover._w);
                this._lastHover = null;
            }

            // build cells
            for (var q = 0; q < 6; q++) {
                var ul = context.ext.document().createElement("UL");
                ul.className = "dhtmlxcalendar_line";
                this.contDates.appendChild(ul);
                for (var w = 0; w < 7; w++) {
                    var li = context.ext.document().createElement("LI");
                    li.className = "dhtmlxcalendar_cell";
                    ul.appendChild(li);
                }
            }


            // timepicker

            this.contTime = context.ext.document().createElement("DIV");
            this.contTime.className = "dhtmlxcalendar_time_cont";
            this.base.appendChild(this.contTime);

            this.showTime = function() {
                if (String(this.base.className).search("dhtmlxcalendar_time_hidden") > 0) this.base.className = String(this.base.className).replace(/dhtmlxcalendar_time_hidden/gi, "");
            }

            this.hideTime = function() {
                if (String(this.base.className).search("dhtmlxcalendar_time_hidden") < 0) this.base.className += " dhtmlxcalendar_time_hidden";
            }

            var ul = context.ext.document().createElement("UL");
            ul.className = "dhtmlxcalendar_line";
            this.contTime.appendChild(ul);

            var li = context.ext.document().createElement("LI");
            li.className = "dhtmlxcalendar_cell dhtmlxcalendar_time_hdr";
            li.innerHTML = "<div class='dhtmlxcalendar_time_label'></div><span class='dhtmlxcalendar_label_hours'></span><span class='dhtmlxcalendar_label_colon'>:</span><span class='dhtmlxcalendar_label_minutes'></span>";
            ul.appendChild(li);

            li.onclick = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                // show hours selector
                if (t.className && t.className == "dhtmlxcalendar_label_hours") {
                    e.cancelBubble = true;
                    that._showSelector("hours", 3, 115, "selector_hours", true);
                    return;
                }
                // show minutes selector
                if (t.className && t.className == "dhtmlxcalendar_label_minutes") {
                    e.cancelBubble = true;
                    that._showSelector("minutes", 59, 115, "selector_minutes", true);
                    return;
                }
                // hide selector if it visible
                that._hideSelector();
            }


            this._activeMonth = null;

            this._activeDate = new Date();
            this._activeDateCell = null;

            this.setDate = function(d) {
                if (d === "") d = new Date();
                if (!(d instanceof Date)) d = this._strToDate(d, false);

                if (d === "Invalid Date") {
                    d = new Date();
                }

                var time = d.getTime();

                // out of range
                if (this._isOutOfRange(time)) return;

                this._activeDate = new Date(time);
                this._drawMonth(this._activeDate);
                this._updateVisibleHours();
                this._updateVisibleMinutes();
            }

            this.getDate = function(formated) {
                var t = new Date(this._activeDate.getTime());
                if (formated) return this._dateToStr(t);
                return t;
            }

            this._drawMonth = function(d) {
                if (!(d instanceof Date)) return;
                if (isNaN(d.getFullYear())) d = new Date(this._activeMonth.getFullYear(), this._activeMonth.getMonth(), 1, 0, 0, 0, 0);

                this._activeMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

                this._activeDateCell = null;

                var first = new Date(this._activeMonth.getTime());
                var d0 = first.getDay();

                var e0 = d0 - this._wStart;
                if (e0 < 0) e0 = e0 + 7;
                first.setDate(first.getDate() - e0);

                var mx = d.getMonth();
                var dx = new Date(this._activeDate.getFullYear(), this._activeDate.getMonth(), this._activeDate.getDate(), 0, 0, 0, 0).getTime();
                var i = 0;
                for (var q = 0; q < 6; q++) {
                    var ws = this._wStart;
                    for (var w = 0; w < 7; w++) {
                        var d2 = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i++, 0, 0, 0, 0);
                        this.contDates.childNodes[q].childNodes[w].innerHTML = d2.getDate();
                        var day = d2.getDay();
                        var time = d2.getTime();

                        this.contDates.childNodes[q].childNodes[w]._date = new Date(time);
                        this.contDates.childNodes[q].childNodes[w]._q = q;
                        this.contDates.childNodes[q].childNodes[w]._w = w;
                        this.contDates.childNodes[q].childNodes[w]._css_month = (d2.getMonth() == mx);
                        this.contDates.childNodes[q].childNodes[w]._css_date = (time == dx);
                        this.contDates.childNodes[q].childNodes[w]._css_weekend = (ws >= 6);
                        this.contDates.childNodes[q].childNodes[w]._css_dis = this._isOutOfRange(time);
                        this.contDates.childNodes[q].childNodes[w]._css_holiday = (this._holidays[time] == true);

                        this._updateCellStyle(q, w);

                        if (time == dx) this._activeDateCell = this.contDates.childNodes[q].childNodes[w];

                        if (++ws > 7) ws = 1;
                    }
                }

                this.contMonth.firstChild.firstChild.childNodes[1].innerHTML = this.langData[this.lang].monthesFNames[d.getMonth()];
                this.contMonth.firstChild.firstChild.childNodes[2].innerHTML = d.getFullYear();

            }

            this._updateCellStyle = function(q, w) {

                var r = this.contDates.childNodes[q].childNodes[w];

                var s = "dhtmlxcalendar_cell dhtmlxcalendar_cell";

                // this/another month
                s += (r._css_month ? "_month" : "");

                // selected date
                s += (r._css_date ? "_date" : "");

                // is weekend
                s += (r._css_weekend ? "_weekend" : "");

                // is holiday
                s += (r._css_holiday ? "_holiday" : "");

                // is cell disabled
                s += (r._css_dis ? "_dis" : "");

                // is cell hover (only if not disabled)
                s += (r._css_hover && !r._css_dis ? "_hover" : "");

                r.className = s;
                r = null;

            }

            /* global selector obj */

            this._initSelector = function(type, css) {

                if (!this._selCover) {
                    this._selCover = context.ext.document().createElement("DIV");
                    this._selCover.className = "dhtmlxcalendar_selector_cover";
                    this.base.appendChild(this._selCover);
                }

                if (!this._sel) {

                    this._sel = context.ext.document().createElement("DIV");
                    this._sel.className = "dhtmlxcalendar_selector_obj";
                    this.base.appendChild(this._sel);

                    this._sel.appendChild(context.ext.document().createElement("TABLE"));
                    this._sel.firstChild.className = "dhtmlxcalendar_selector_table";
                    this._sel.firstChild.cellSpacing = 0;
                    this._sel.firstChild.cellPadding = 0;
                    this._sel.firstChild.border = 0;
                    this._sel.firstChild.appendChild(context.ext.document().createElement("TBODY"));
                    this._sel.firstChild.firstChild.appendChild(context.ext.document().createElement("TR"));

                    this._sel.firstChild.firstChild.firstChild.appendChild(context.ext.document().createElement("TD"));
                    this._sel.firstChild.firstChild.firstChild.appendChild(context.ext.document().createElement("TD"));
                    this._sel.firstChild.firstChild.firstChild.appendChild(context.ext.document().createElement("TD"));

                    this._sel.firstChild.firstChild.firstChild.childNodes[0].className = "dhtmlxcalendar_selector_cell_left";
                    this._sel.firstChild.firstChild.firstChild.childNodes[1].className = "dhtmlxcalendar_selector_cell_middle";
                    this._sel.firstChild.firstChild.firstChild.childNodes[2].className = "dhtmlxcalendar_selector_cell_right";
                    this._sel.firstChild.firstChild.firstChild.childNodes[0].innerHTML = "";
                    this._sel.firstChild.firstChild.firstChild.childNodes[2].innerHTML = "";

                    this._sel.firstChild.firstChild.firstChild.childNodes[0].onmouseover = function() {
                        this.className = "dhtmlxcalendar_selector_cell_left dhtmlxcalendar_selector_cell_left_hover";
                    }
                    this._sel.firstChild.firstChild.firstChild.childNodes[0].onmouseout = function() {
                        this.className = "dhtmlxcalendar_selector_cell_left";
                    }

                    this._sel.firstChild.firstChild.firstChild.childNodes[2].onmouseover = function() {
                        this.className = "dhtmlxcalendar_selector_cell_right dhtmlxcalendar_selector_cell_right_hover";
                    }
                    this._sel.firstChild.firstChild.firstChild.childNodes[2].onmouseout = function() {
                        this.className = "dhtmlxcalendar_selector_cell_right";
                    }

                    this._sel.firstChild.firstChild.firstChild.childNodes[0].onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        that._scrollYears(-1);
                    }

                    this._sel.firstChild.firstChild.firstChild.childNodes[2].onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        that._scrollYears(1);
                    }

                    this._sel._ta = {};

                    this._selHover = null;

                    this._sel.onmouseover = function(e) {
                        e = e || event;
                        var t = (e.target || e.srcElement);
                        if (t._cell === true) {
                            if (that._selHover != t) that._clearSelHover();
                            if (String(t.className).match(/^\s{0,}dhtmlxcalendar_selector_cell\s{0,}$/gi) != null) {
                                t.className += " dhtmlxcalendar_selector_cell_hover";
                                that._selHover = t;
                            }
                        }
                    }

                    this._sel.onmouseout = function() {
                        that._clearSelHover();
                    }

                    this._sel.appendChild(context.ext.document().createElement("DIV"));
                    this._sel.lastChild.className = "dhtmlxcalendar_selector_obj_arrow";
                }

                // check if already inited
                if (this._sel._ta[type] == true) return;

                // init month
                if (type == "month") {

                    this._msCells = {};

                    this.msCont = context.ext.document().createElement("DIV");
                    this.msCont.className = "dhtmlxcalendar_area_" + css;
                    this._sel.firstChild.firstChild.firstChild.childNodes[1].appendChild(this.msCont);

                    var i = 0;
                    for (var q = 0; q < 4; q++) {
                        var ul = context.ext.document().createElement("UL");
                        ul.className = "dhtmlxcalendar_selector_line";
                        this.msCont.appendChild(ul);
                        for (var w = 0; w < 3; w++) {
                            var li = context.ext.document().createElement("LI");
                            li.innerHTML = this.langData[this.lang].monthesSNames[i];
                            li.className = "dhtmlxcalendar_selector_cell";
                            ul.appendChild(li);
                            li._month = i;
                            li._cell = true;
                            this._msCells[i++] = li;
                        }
                    }

                    this.msCont.onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        var t = (e.target || e.srcElement);
                        if (t._month != null) {
                            that._hideSelector();
                            that._updateActiveMonth();
                            that._drawMonth(new Date(that._activeMonth.getFullYear(), t._month, 1, 0, 0, 0, 0));
                            that._doOnSelectorChange();
                        }
                    }

                }

                // init year
                if (type == "year") {

                    this._ysCells = {};

                    this.ysCont = context.ext.document().createElement("DIV");
                    this.ysCont.className = "dhtmlxcalendar_area_" + css;
                    this._sel.firstChild.firstChild.firstChild.childNodes[1].appendChild(this.ysCont);

                    for (var q = 0; q < 4; q++) {
                        var ul = context.ext.document().createElement("UL");
                        ul.className = "dhtmlxcalendar_selector_line";
                        this.ysCont.appendChild(ul);
                        for (var w = 0; w < 3; w++) {
                            var li = context.ext.document().createElement("LI");
                            li.className = "dhtmlxcalendar_selector_cell";
                            li._cell = true;
                            ul.appendChild(li);
                        }
                    }

                    this.ysCont.onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        var t = (e.target || e.srcElement);
                        if (t._year != null) {
                            that._hideSelector();
                            that._drawMonth(new Date(t._year, that._activeMonth.getMonth(), 1, 0, 0, 0, 0));
                            that._doOnSelectorChange();
                            that.callEvent('onYearSelected', [t]);
                        }
                    }

                }

                // init hours
                if (type == "hours") {

                    this._hsCells = {};

                    this.hsCont = context.ext.document().createElement("DIV");
                    this.hsCont.className = "dhtmlxcalendar_area_" + css;
                    this._sel.firstChild.firstChild.firstChild.childNodes[1].appendChild(this.hsCont);

                    var i = 0;
                    for (var q = 0; q < 4; q++) {
                        var ul = context.ext.document().createElement("UL");
                        ul.className = "dhtmlxcalendar_selector_line";
                        this.hsCont.appendChild(ul);
                        for (var w = 0; w < 6; w++) {
                            var li = context.ext.document().createElement("LI");
                            li.innerHTML = this._fixLength(i, 2);
                            li.className = "dhtmlxcalendar_selector_cell";
                            ul.appendChild(li);
                            li._hours = i;
                            li._cell = true;
                            this._hsCells[i++] = li;
                        }
                    }

                    this.hsCont.onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        var t = (e.target || e.srcElement);
                        if (t._hours != null) {
                            that._hideSelector();
                            that._activeDate.setHours(t._hours);
                            that._updateActiveHours();
                            that._updateVisibleHours();
                            that._doOnSelectorChange();
                        }
                    }

                }

                // init minutes
                if (type == "minutes") {

                    this._rsCells = {};

                    this.rsCont = context.ext.document().createElement("DIV");
                    this.rsCont.className = "dhtmlxcalendar_area_" + css;
                    this._sel.firstChild.firstChild.firstChild.childNodes[1].appendChild(this.rsCont);

                    var i = 0;
                    for (var q = 0; q < 4; q++) {
                        var ul = context.ext.document().createElement("UL");
                        ul.className = "dhtmlxcalendar_selector_line";
                        this.rsCont.appendChild(ul);
                        for (var w = 0; w < 3; w++) {
                            var li = context.ext.document().createElement("LI");
                            li.innerHTML = this._fixLength(i, 2);
                            li.className = "dhtmlxcalendar_selector_cell";
                            ul.appendChild(li);
                            li._minutes = i;
                            li._cell = true;
                            this._rsCells[i] = li;
                            i += 5;
                        }
                    }

                    this.rsCont.onclick = function(e) {
                        e = e || event;
                        e.cancelBubble = true;
                        var t = (e.target || e.srcElement);
                        if (t._minutes != null) {
                            that._hideSelector();
                            that._activeDate.setMinutes(t._minutes);
                            that._updateActiveMinutes();
                            that._updateVisibleMinutes();
                            that._doOnSelectorChange();
                        }
                    }

                }

                // mark that selector of current type is inited
                this._sel._ta[type] = true;
            }

            this._showSelector = function(type, x, y, css, autoHide) {

                if (autoHide === true && this._sel != null && this._isSelectorVisible() && type == this._sel._t) {
                    this._hideSelector();
                    return;
                }

                if (!this._sel || !this._sel._ta[type]) this._initSelector(type, css);

                // show selector cover
                this._selCover.style.display = "";

                // show selector
                this._sel._t = type;
                this._sel.style.left = x + "px";
                this._sel.style.top = y + "px";
                this._sel.style.display = "";
                this._sel.className = "dhtmlxcalendar_selector_obj dhtmlxcalendar_" + css;

                // callbacks
                this._doOnSelectorShow(type);
            }

            this._doOnSelectorShow = function(type) {
                if (type == "month") this._updateActiveMonth();
                if (type == "year") this._updateYearsList(this._activeMonth);
                if (type == "hours") this._updateActiveHours();
                if (type == "minutes") this._updateActiveMinutes();
            }

            this._hideSelector = function() {
                if (!this._sel) return;
                this._sel.style.display = "none";
                this._selCover.style.display = "none";
                this.callEvent('onSelectorHide', []);
            }

            this._isSelectorVisible = function() {
                if (!this._sel) return false;
                return (this._sel.style.display != "none");
            }

            this._doOnSelectorChange = function(state) {
                this.callEvent("onChange", [new Date(this._activeMonth.getFullYear(), this._activeMonth.getMonth(), this._activeDate.getDate(), this._activeDate.getHours(), this._activeDate.getMinutes(), this._activeDate.getSeconds()), state]);
            }

            this._clearSelHover = function() {
                if (!this._selHover) return;
                this._selHover.className = String(this._selHover.className.replace(/dhtmlxcalendar_selector_cell_hover/gi, ""));
                this._selHover = null;
            }


            /* month selector */

            this._updateActiveMonth = function() {
                if (typeof (this._msActive) != "undefined" && typeof (this._msCells[this._msActive]) != "undefined") this._msCells[this._msActive].className = "dhtmlxcalendar_selector_cell";
                this._msActive = this._activeMonth.getMonth();
                this._msCells[this._msActive].className = "dhtmlxcalendar_selector_cell dhtmlxcalendar_selector_cell_active";
            }

            /* year selector */

            this._updateActiveYear = function() {
                var i = this._activeMonth.getFullYear();
                if (this._ysCells[i]) this._ysCells[i].className = "dhtmlxcalendar_selector_cell dhtmlxcalendar_selector_cell_active";
            }

            this._updateYearsList = function(d) {
                for (var a in this._ysCells) {
                    this._ysCells[a] = null;
                    delete this._ysCells[a];
                }
                //
                var i = 12 * Math.floor(d.getFullYear() / 12);
                for (var q = 0; q < 4; q++) {
                    for (var w = 0; w < 3; w++) {
                        this.ysCont.childNodes[q].childNodes[w].innerHTML = i;
                        this.ysCont.childNodes[q].childNodes[w]._year = i;
                        this.ysCont.childNodes[q].childNodes[w].className = "dhtmlxcalendar_selector_cell";
                        this._ysCells[i++] = this.ysCont.childNodes[q].childNodes[w];
                    }
                }
                this._updateActiveYear();
            }

            this._scrollYears = function(i) {
                var y = (i < 0 ? this.ysCont.firstChild.firstChild._year : this.ysCont.lastChild.lastChild._year) + i;
                var d = new Date(y, this._activeMonth.getMonth(), 1, 0, 0, 0, 0);
                this._updateYearsList(d);
            }

            /* hours selector */

            // update hours in selector
            this._updateActiveHours = function() {
                if (typeof (this._hsActive) != "undefined" && typeof (this._hsCells[this._hsActive]) != "undefined") this._hsCells[this._hsActive].className = "dhtmlxcalendar_selector_cell";
                this._hsActive = this._activeDate.getHours();
                this._hsCells[this._hsActive].className = "dhtmlxcalendar_selector_cell dhtmlxcalendar_selector_cell_active";
            }

            // update hours in calendar
            this._updateVisibleHours = function() {
                this.contTime.firstChild.firstChild.childNodes[1].innerHTML = this._fixLength(this._activeDate.getHours(), 2);
            }

            /* minutes selector */

            // update minutes in selector
            this._updateActiveMinutes = function() {
                if (typeof (this._rsActive) != "undefined" && typeof (this._rsCells[this._rsActive]) != "undefined") this._rsCells[this._rsActive].className = "dhtmlxcalendar_selector_cell";
                this._rsActive = this._activeDate.getMinutes();
                if (typeof (this._rsCells[this._rsActive]) != "undefined") this._rsCells[this._rsActive].className = "dhtmlxcalendar_selector_cell dhtmlxcalendar_selector_cell_active";
            }

            // update minutes in calendar
            this._updateVisibleMinutes = function() {
                this.contTime.firstChild.firstChild.childNodes[3].innerHTML = this._fixLength(this._activeDate.getMinutes(), 2);
            }

            /* some common functionality */

            this._fixLength = function(t, r) {
                while (String(t).length < r) t = "0" + String(t);
                return t;
            }

            this._dateFormat = "";
            this._dateFormatRE = null;

            this.setDateFormat = function(format) {
                this._dateFormat = format;
                this._dateFormatRE = new RegExp(String(this._dateFormat).replace(/%[a-zA-Z]+/g, function(t) {
                    var t2 = t.replace(/%/, "");
                    switch (t2) {
                    case "m":
                    case "d":
                    case "H":
                    case "i":
                    case "s":
                        return "\\d{2}";
                    case "Y":
                        return "\\d{4}";
                    }
                    return t;
                }));
            }

            // this.setDateFormat("%Y-%m-%d");

            this._strToDate = function(val, getSet, format) {
                var i = {
                    Y: false,
                    m: false,
                    d: false,
                    H: false,
                    i: false,
                    s: false
                };

                var a = String(val).match(/[0-9]{1,}/g);
                var b = (format || this._dateFormat).match(/%[a-zA-Z]/g);

                if (!a) return "Invalid Date";

                for (var q = 0; q < b.length; q++) {
                    var r = b[q].replace(/%/g, "");
                    if (typeof (i[r]) != "undefined") i[r] = Number(a[q]);
                }

                if (getSet) return i;

                for (var a in i)
                    if (i[a] === false) i[a] = 0;
                return new Date(i.Y, i.m - 1, i.d, i.H, i.i, i.s, 0);

            }

            this._dateToStr = function(val, format) {
                if (val instanceof Date) {
                    var z = function(t) {
                        return (String(t).length == 1 ? "0" + String(t) : t);
                    }
                    var k = function(t) {
                        switch (t) {
                        case "%d":
                            return z(val.getDate());
                        case "%j":
                            return val.getDate();
                        case "%D":
                            return that.langData[that.lang].daysSNames[val.getDay()];
                        case "%l":
                            return that.langData[that.lang].daysFNames[val.getDay()];
                            // %W - ISO-8601 week number of year, weeks starting on Monday; 1)
                        case "%m":
                            return z(val.getMonth() + 1);
                        case "%n":
                            return val.getMonth() + 1;
                        case "%M":
                            return that.langData[that.lang].monthesSNames[val.getMonth()];
                        case "%F":
                            return that.langData[that.lang].monthesFNames[val.getMonth()];
                        case "%y":
                            return z(val.getYear() % 100);
                        case "%Y":
                            return val.getFullYear();
                        case "%g":
                            return (val.getHours() + 11) % 12 + 1;
                        case "%h":
                            return z((val.getHours() + 11) % 12 + 1);
                        case "%G":
                            return val.getHours();
                        case "%H":
                            return z(val.getHours());
                        case "%i":
                            return z(val.getMinutes());
                        case "%s":
                            return z(val.getSeconds());
                        case "%a":
                            return (val.getHours() > 11 ? "pm" : "am");
                        case "%A":
                            return (val.getHours() > 11 ? "PM" : "AM");
                        case "%%":
                            return "%";
                        default:
                            return t;
                        }
                    }
                    var t = String(format || this._dateFormat).replace(/%[%a-zA-Z]/g, k);
                }
                return (t || String(val));
            }

            this._updateDateStr = function(str) {

                // check if valid str
                if (str == "") {
                    this.setDate(new Date());
                    this.callEvent("onChange", [null, true]);
                    return;
                }
                else {
                    if (!this._dateFormatRE || !str.match(this._dateFormatRE)) return;
                }

                var r = this._strToDate(str, true);
                var newDate = new Date(this._activeMonth.getFullYear(), this._activeMonth.getMonth(), this._activeDate.getDate(), this._activeDate.getHours(), this._activeDate.getMinutes(), this._activeDate.getSeconds());

                if (r.Y !== false && r.Y != newDate.getFullYear()) this._activeDate.setFullYear(r.Y);
                if (r.m !== false) {
                    r.m--;
                    if (r.m != newDate.getMonth()) this._activeDate.setMonth(r.m);
                }
                if (r.d !== false && r.d != newDate.getDate()) this._activeDate.setDate(r.d);
                if (r.H !== false && r.H != newDate.getHours()) this._activeDate.setHours(r.H);
                if (r.i !== false && r.i != newDate.getMinutes()) this._activeDate.setMinutes(r.i);
                if (r.s !== false && r.s != newDate.getSeconds()) this._activeDate.setSeconds(r.s);

                this._drawMonth(this._activeDate);

                this._updateVisibleMinutes();
                this._updateVisibleHours();

                if (this._sel && this._isSelectorVisible()) this._doOnSelectorShow(this._sel._t);
                this._doOnSelectorChange(true);

            }

            this.setFormatedDate = function(format, str, a, return_only) {
                var date = this._strToDate(str, false, format);
                if (return_only) return date;
                this.setDate(date);
            }

            this.getFormatedDate = function(format, date) {
                if (!(date && date instanceof Date)) date = new Date(this._activeDate);
                return this._dateToStr(date, format);
            }

            /* show/hide calendar */

            // public show/hide

            this.show = function(id) {
                // if id not set - try show in container
                if (!id && this._hasParent) {
                    this._show();
                    return;
                }
                // if input id not specified show near first found
                // if nothing found - do not show
                if (typeof (id) == "object" && typeof (id._dhtmlxcalendar_uid) != "undefined" && this.i[id._dhtmlxcalendar_uid] == id) {
                    this._show(id._dhtmlxcalendar_uid);
                    return;
                }
                if (typeof (id) == "undefined") {
                    for (var a in this.i)
                        if (!id) id = a;
                }
                if (!id) return;
                this._show(id);
            }

            this.hide = function() {
                if (this._isVisible()) this._hide();
            }

            this.isVisible = function() {
                return this._isVisible();
            }

            this.draw = function() {
                // deprecated
                this.show();
            }

            this.close = function() {
                // deprecated
                this.hide();
            }

            // private show/hide

            this._activeInp = null;

            this.pos = "bottom";
            this.setPosition = function(x, y) {
                if (x == "right" || x == "bottom") {
                    this.pos = x;
                    return;
                }
                if (!this._hasParent) {
                    if (typeof (x) != "undefined" && !isNaN(x)) this.base.style.left = x + "px";
                    if (typeof (y) != "undefined" && !isNaN(y)) this.base.style.top = y + "px";
                }
            }

            this._show = function(inpId, autoHide) {
                if (autoHide === true && this._activeInp == inpId && this._isVisible()) {
                    this._hide();
                    return;
                }
                if (!inpId) {
                    this.base.style.left = "0px";
                    this.base.style.top = "0px";
                }
                else {
                    if (this.pos == "right") {
                        this.base.style.left = this._getLeft(this.i[inpId]) + this.i[inpId].offsetWidth - 1 + "px";
                        this.base.style.top = this._getTop(this.i[inpId]) + "px";
                    }
                    else {
                        this.base.style.left = this._getLeft(this.i[inpId]) + "px";
                        this.base.style.top = this._getTop(this.i[inpId]) + this.i[inpId].offsetHeight - 1 + "px";
                    }
                    this._activeInp = inpId;
                }
                this._hideSelector();
                this.base.style.display = "";
            }

            this._hide = function() {
                this._hideSelector();
                this.base.style.display = "none";
                this._activeInp = null;
            }

            this._isVisible = function() {
                return (this.base.style.display != "none");
            }

            this._getLeft = function(obj) {
                return this._posGetOffset(obj).left;
            }

            this._getTop = function(obj) {
                return this._posGetOffset(obj).top;
            }

            this._posGetOffsetSum = function(elem) {
                var top = 0,
                    left = 0;
                while (elem) {
                    top = top + parseInt(elem.offsetTop);
                    left = left + parseInt(elem.offsetLeft);
                    elem = elem.offsetParent;
                }
                return {
                    top: top,
                    left: left
                };
            }
            this._posGetOffsetRect = function(elem) {
                var box = elem.getBoundingClientRect();
                var body = context.ext.body();
                var docElem = context.ext.document().documentElement;
                var offset = {
                    left: 0,
                    top: 0
                };
                if (!context.isSingle()) { // IFRAME PATH
                    offset = context.ext.iframe().offset();
                }
                var scrollTop = context.ext.window().pageYOffset || docElem.scrollTop || body.scrollTop;
                var scrollLeft = context.ext.window().pageXOffset || docElem.scrollLeft || body.scrollLeft;
                var clientTop = docElem.clientTop || body.clientTop || 0;
                var clientLeft = docElem.clientLeft || body.clientLeft || 0;
                var top = box.top + offset.top + scrollTop - clientTop;
                var left = box.left + offset.left + scrollLeft - clientLeft;
                return {
                    top: Math.round(top),
                    left: Math.round(left)
                };
            }
            this._posGetOffset = function(elem) {
                return this[elem.getBoundingClientRect ? "_posGetOffsetRect" : "_posGetOffsetSum"](elem);
            }

            /*
this.getIFrame = function()
{
  if (!iFrame)
    {
        var frames = $('iframe', dc.document);
        frames.each(function()
        {
            if (this.contentWindow === context.intr.window())
                iFrame = $(this);
        });
    }

    return iFrame;
}*/

            this._rangeActive = false;
            this._rangeFrom = null;
            this._rangeTo = null;
            this._rangeSet = {};

            this.setInsensitiveDays = function(d) {

                // !works in append mode
                var t = this._extractDates(d);
                for (var q = 0; q < t.length; q++) this._rangeSet[new Date(t[q].getFullYear(), t[q].getMonth(), t[q].getDate(), 0, 0, 0, 0).getTime()] = true;

                this._drawMonth(this._activeDate);

            }

            this.clearInsensitiveDays = function() {
                this._clearRangeSet();
                this._drawMonth(this._activeDate);
            }

            this._holidays = {};
            this.setHolidays = function(r) {
                if (r == null) {
                    this._clearHolidays();
                }
                else if (r != null) {
                    var t = this._extractDates(r);
                    for (var q = 0; q < t.length; q++) this._holidays[new Date(t[q].getFullYear(), t[q].getMonth(), t[q].getDate(), 0, 0, 0, 0).getTime()] = true;
                }
                this._drawMonth(this._activeDate);
            }

            this._extractDates = function(r) {
                // r = array of dates or comma-separated string list
                // return array with dates
                if (typeof (r) == "string" || r instanceof Date) r = [r];
                var t = [];
                for (var q = 0; q < r.length; q++) {
                    if (typeof (r[q]) == "string") {
                        var e = r[q].split(",");
                        for (var w = 0; w < e.length; w++) t.push(this._strToDate(e[w], false));
                    }
                    else if (r[q] instanceof Date) {
                        t.push(r[q]);
                    }
                }
                return t;
            }

            this._clearRange = function() {
                this._rangeActive = false;
                this._rangeType = null;
                this._rangeFrom = null;
                this._rangeTo = null;
            }

            this._clearRangeSet = function() {
                for (var a in this._rangeSet) {
                    this._rangeSet[a] = null;
                    delete this._rangeSet[a];
                }
            }

            this._clearHolidays = function() {
                for (var a in this._holidays) {
                    this._holidays[a] = null;
                    delete this._holidays[a];
                }
            }

            this._isOutOfRange = function(time) {

                if (this._rangeSet[time] == true) return true;

                if (this._rangeActive) {

                    if (this._rangeType == "in" && (time < this._rangeFrom || time > this._rangeTo)) return true;
                    if (this._rangeType == "out" && (time >= this._rangeFrom && time <= this._rangeTo)) return true;
                    if (this._rangeType == "from" && time < this._rangeFrom) return true;
                    if (this._rangeType == "to" && time > this._rangeTo) return true;
                }

                return false;

            }

            this.clearSensitiveRange = function() {
                this._clearRange();
                this._drawMonth(this._activeDate);
            }

            this.setSensitiveRange = function(from, to, ins) {
                var f = false;
                // set range
                if (from != null && to != null) {

                    if (!(from instanceof Date)) from = this._strToDate(from, false);
                    if (!(to instanceof Date)) to = this._strToDate(to, false);

                    if (from.getTime() > to.getTime()) return;

                    this._rangeFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
                    this._rangeTo = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0, 0).getTime();
                    this._rangeActive = true;
                    this._rangeType = "in";

                    f = true;
                }

                // set range "from date"
                if (!f && from != null && to == null) {

                    if (!(from instanceof Date)) from = this._strToDate(from, false);
                    this._rangeFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
                    this._rangeTo = null;

                    if (ins === true) this._rangeFrom++;

                    this._rangeActive = true;
                    this._rangeType = "from";

                    f = true;

                }

                // set range "to date"
                if (!f && from == null && to != null) {

                    if (!(to instanceof Date)) to = this._strToDate(to, false);
                    this._rangeFrom = null;
                    this._rangeTo = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0, 0).getTime();

                    if (ins === true) this._rangeTo--;

                    this._rangeActive = true;
                    this._rangeType = "to";

                    f = true;
                }

                if (f) this._drawMonth(this._activeDate);
            }

            this.setInsensitiveRange = function(from, to) {
                if (from != null && to != null) {

                    if (!(from instanceof Date)) from = this._strToDate(from, false);
                    if (!(to instanceof Date)) to = this._strToDate(to, false);

                    if (from.getTime() > to.getTime()) return;

                    this._rangeFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
                    this._rangeTo = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0, 0).getTime();
                    this._rangeActive = true;
                    this._rangeType = "out";

                    this._drawMonth(this._activeDate);
                    return;
                }

                if (from != null && to == null) {
                    this.setSensitiveRange(null, from, true);
                    return;
                }

                if (from == null && to != null) {
                    this.setSensitiveRange(to, null, true);
                    return;
                }

            }

            // global events
            this._doOnClick = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                // completely close alien calendar (both selector and container) inly if any assigned input clicked
                // otherwise hide selector and container separately
                if (t._dhtmlxcalendar_uid && t._dhtmlxcalendar_uid != that._activeInp && that._isVisible()) {
                    that._hide();
                    return;
                }
                if (!t._dhtmlxcalendar_uid || !that.i[t._dhtmlxcalendar_uid]) { // !that.i[t._dhtmlxcalendar_uid] means alien input, for several calendar instances
                    if (that._isSelectorVisible()) that._hideSelector();
                    else if (!that._hasParent && that._isVisible()) that._hide();
                }
            }

            this._doOnKeyDown = function(e) {
                e = e || event;
                if (e.keyCode == 27) {
                    if (that._isSelectorVisible()) that._hideSelector();
                    else if (that._isVisible() && !that._hasParent) that._hide();
                }
            }

            // inputs events
            this._doOnInpClick = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                if (!t._dhtmlxcalendar_uid) return;
                that._updateDateStr(t.value);
                that._show(t._dhtmlxcalendar_uid, true);
            }

            this._doOnInpKeyUp = function(e) {
                e = e || event;
                var t = (e.target || e.srcElement);
                if (e.keyCode == 13 || !t._dhtmlxcalendar_uid) return; // do nothing on esc key
                // otherwise try to update calendar's date
                that._updateDateStr(t.value);
            }

            this._doOnUnload = function() {
                if (typeof (that) !== 'undefined' && that !== null)
                    that.unload();
            }

            if (context.ext.window().addEventListener) {
                context.ext.body().addEventListener("click", that._doOnClick, false);
                context.ext.window().addEventListener("keydown", that._doOnKeyDown, false);
                context.ext.window().addEventListener("unload", that._doOnUnload, false);
            }
            else {
                context.ext.body().attachEvent("onclick", that._doOnClick);
                context.ext.body().attachEvent("onkeydown", that._doOnKeyDown);
                context.ext.window().attachEvent("onunload", that._doOnUnload);
            }

            this.attachObj = function(obj) {
                var a = this.uid();
                this.i[a] = obj;
                this._attachEventsToObject(a);
            }

            this.detachObj = function(obj) {
                var a = obj._dhtmlxcalendar_uid;
                if (this.i[a] != null) {
                    this._detachEventsFromObject(a);
                    this.i[a]._dhtmlxcalendar_uid = null;
                    this.i[a] = null;
                    delete this.i[a];
                }
            }

            this._attachEventsToObject = function(a) {
                this.i[a]._dhtmlxcalendar_uid = a;
                if (context.ext.window().addEventListener) {
                    this.i[a].addEventListener("click", that._doOnInpClick, false);
                    this.i[a].addEventListener("keyup", that._doOnInpKeyUp, false);
                }
                else {
                    this.i[a].attachEvent("onclick", that._doOnInpClick);
                    this.i[a].attachEvent("onkeyup", that._doOnInpKeyUp);
                }
            }

            this._detachEventsFromObject = function(a) {
                if (context.ext.window().addEventListener) {
                    this.i[a].removeEventListener("click", that._doOnInpClick, false);
                    this.i[a].removeEventListener("keyup", that._doOnInpKeyUp, false);
                }
                else {
                    this.i[a].detachEvent("onclick", that._doOnInpClick);
                    this.i[a].detachEvent("onkeyup", that._doOnInpKeyUp);
                }
            }

            for (var a in this.i) this._attachEventsToObject(a);

            /* internal events */

            this.evs = {};
            this.attachEvent = function(name, func) {
                var eId = this.uid();
                this.evs[eId] = {
                    name: String(name).toLowerCase(),
                    func: func
                };
                return eId;
            }
            this.detachEvent = function(id) {
                if (this.evs[id]) {
                    this.evs[id].name = null;
                    this.evs[id].func = null;
                    this.evs[id] = null;
                    delete this.evs[id];
                }
            }
            this.callEvent = function(name, params) {
                var u = true;
                var n = String(name).toLowerCase();
                params = (params || []);
                for (var a in this.evs) {
                    if (this.evs[a].name == n) {
                        var r = this.evs[a].func.apply(this, params);
                        u = (u && r);
                    }
                }
                return u;
            }
            this.checkEvent = function(name) {
                var u = false;
                var n = String(name).toLowerCase();
                for (var a in this.evs) u = (u || this.evs[a].name == n);
                return u;
            }

            /* unload */

            this.unload = function() {
                /* main events */
                if (context.ext.window().addEventListener) {
                    context.ext.body().removeEventListener("click", that._doOnClick, false);
                    context.ext.window().removeEventListener("keydown", that._doOnKeyDown, false);
                    context.ext.window().removeEventListener("unload", that._doOnUnload, false);
                }
                else {
                    context.ext.body().detachEvent("onclick", that._doOnClick);
                    context.ext.body().detachEvent("onkeydown", that._doOnKeyDown);
                    context.ext.window().detachEvent("onunload", that._doOnKeyDown);
                }

                this._doOnClick = null;
                this._doOnKeyDown = null;
                this._doOnUnload = null;

                this._activeDate = null;
                this._activeDateCell = null;
                this._activeInp = null;
                this._activeMonth = null;
                this._dateFormat = null;
                this._dateFormatRE = null;
                this._lastHover = null;

                this.uid = null;
                this.uidd = null;



                /* assigned inputs */

                for (var a in this.i) {
                    // marker
                    this.i[a]._dhtmlxcalendar_uid = null;
                    delete this.i[a]._dhtmlxcalendar_uid;

                    // events
                    if (context.ext.window().addEventListener) {
                        this.i[a].removeEventListener("click", that._doOnInpClick, false);
                        this.i[a].removeEventListener("keyup", that._doOnInpKeyUp, false);
                    }
                    else {
                        this.i[a].detachEvent("onclick", that._doOnInpClick);
                        this.i[a].detachEvent("onkeyup", that._doOnInpKeyUp);
                    }

                    this.i[a] = null;
                    delete this.i[a];

                }

                this.i = null;

                this._doOnInpClick = null;
                this._doOnInpKeyUp = null;

                /* obj events */

                for (var a in this.evs) this.detachEvent(a);
                this.evs = null;

                this.attachEvent = null;
                this.detachEvent = null;
                this.checkEvent = null;
                this.callEvent = null;

                /* months */

                this.contMonth.onselectstart = null;

                // li
                this.contMonth.firstChild.firstChild.onclick = null;

                // arrows
                this.contMonth.firstChild.firstChild.firstChild.onmouseover = null;
                this.contMonth.firstChild.firstChild.firstChild.onmouseout = null;
                this.contMonth.firstChild.firstChild.lastChild.onmouseover = null;
                this.contMonth.firstChild.firstChild.lastChild.onmouseout = null;

                while (this.contMonth.firstChild.firstChild.childNodes.length > 0) this.contMonth.firstChild.firstChild.removeChild(this.contMonth.firstChild.firstChild.lastChild);

                // li
                this.contMonth.firstChild.removeChild(this.contMonth.firstChild.firstChild);

                // ul
                this.contMonth.removeChild(this.contMonth.firstChild);

                // div
                this.contMonth.parentNode.removeChild(this.contMonth);
                this.contMonth = null;

                /* days */

                // li
                while (this.contDays.firstChild.childNodes.length > 0) this.contDays.firstChild.removeChild(this.contDays.firstChild.lastChild);

                // ul
                this.contDays.removeChild(this.contDays.firstChild);

                // div
                this.contDays.parentNode.removeChild(this.contDays);
                this.contDays = null;

                /* dates */

                this.contDates.onclick = null;
                this.contDates.onmouseover = null;
                this.contDates.onmouseout = null;

                while (this.contDates.childNodes.length > 0) {
                    while (this.contDates.lastChild.childNodes.length > 0) {
                        // li
                        this.contDates.lastChild.lastChild._css_date = null;
                        this.contDates.lastChild.lastChild._css_month = null;
                        this.contDates.lastChild.lastChild._css_weekend = null;
                        this.contDates.lastChild.lastChild._css_hover = null;
                        this.contDates.lastChild.lastChild._date = null;
                        this.contDates.lastChild.lastChild._q = null;
                        this.contDates.lastChild.lastChild._w = null;
                        this.contDates.lastChild.removeChild(this.contDates.lastChild.lastChild);
                    }
                    // ul
                    this.contDates.removeChild(this.contDates.lastChild);
                }

                // div
                this.contDates.parentNode.removeChild(this.contDates);
                this.contDates = null;

                /* time */

                this.contTime.firstChild.firstChild.onclick = null;

                // labels
                while (this.contTime.firstChild.firstChild.childNodes.length > 0) this.contTime.firstChild.firstChild.removeChild(this.contTime.firstChild.firstChild.lastChild);

                // li
                this.contTime.firstChild.removeChild(this.contTime.firstChild.firstChild);

                // ul
                this.contTime.removeChild(this.contTime.firstChild);

                // div
                this.contTime.parentNode.removeChild(this.contTime);
                this.contTime = null;

                /* selector */

                this._lastHover = null;

                // month selector
                if (this.msCont) {

                    this.msCont.onclick = null;
                    this._msActive = null;

                    // li
                    for (var a in this._msCells) {
                        this._msCells[a]._cell = null;
                        this._msCells[a]._month = null;
                        this._msCells[a].parentNode.removeChild(this._msCells[a]);
                        this._msCells[a] = null;
                    }
                    this._msCells = null;

                    // ul
                    while (this.msCont.childNodes.length > 0) this.msCont.removeChild(this.msCont.lastChild);

                    // div
                    this.msCont.parentNode.removeChild(this.msCont);
                    this.msCont = null;

                }

                // years selector
                if (this.ysCont) {

                    this.ysCont.onclick = null;

                    // li
                    for (var a in this._ysCells) {
                        this._ysCells[a]._cell = null;
                        this._ysCells[a]._year = null;
                        this._ysCells[a].parentNode.removeChild(this._ysCells[a]);
                        this._ysCells[a] = null;
                    }
                    this._ysCells = null;

                    // ul
                    while (this.ysCont.childNodes.length > 0) this.ysCont.removeChild(this.ysCont.lastChild);

                    // div
                    this.ysCont.parentNode.removeChild(this.ysCont);
                    this.ysCont = null;

                }

                // hours selector
                if (this.hsCont) {

                    this.hsCont.onclick = null;
                    this._hsActive = null;

                    // li
                    for (var a in this._hsCells) {
                        this._hsCells[a]._cell = null;
                        this._hsCells[a]._hours = null;
                        this._hsCells[a].parentNode.removeChild(this._hsCells[a]);
                        this._hsCells[a] = null;
                    }
                    this._hsCells = null;

                    // ul
                    while (this.hsCont.childNodes.length > 0) this.hsCont.removeChild(this.hsCont.lastChild);

                    // div
                    this.hsCont.parentNode.removeChild(this.hsCont);
                    this.hsCont = null;

                }

                // minutes selector
                if (this.rsCont) {

                    this.rsCont.onclick = null;
                    this._rsActive = null;

                    // li
                    for (var a in this._rsCells) {
                        this._rsCells[a]._cell = null;
                        this._rsCells[a]._minutes = null;
                        this._rsCells[a].parentNode.removeChild(this._rsCells[a]);
                        this._rsCells[a] = null;
                    }
                    this._rsCells = null;

                    // ul
                    while (this.rsCont.childNodes.length > 0) this.rsCont.removeChild(this.rsCont.lastChild);

                    // div
                    this.rsCont.parentNode.removeChild(this.rsCont);
                    this.rsCont = null;

                }

                // selector cover
                if (this._selCover) {
                    this._selCover.parentNode.removeChild(this._selCover);
                    this._selCover = null;
                }

                // selector object
                if (this._sel) {

                    for (var a in this._sel._ta) this._sel._ta[a] = null;
                    this._sel._ta = null;
                    this._sel._t = null;

                    this._sel.onmouseover = null;
                    this._sel.onmouseout = null;

                    // td
                    while (this._sel.firstChild.firstChild.firstChild.childNodes.length > 0) {
                        this._sel.firstChild.firstChild.firstChild.lastChild.onclick = null;
                        this._sel.firstChild.firstChild.firstChild.lastChild.onmouseover = null;
                        this._sel.firstChild.firstChild.firstChild.lastChild.onmouseout = null;
                        this._sel.firstChild.firstChild.firstChild.removeChild(this._sel.firstChild.firstChild.firstChild.lastChild);
                    }

                    // tr
                    this._sel.firstChild.firstChild.removeChild(this._sel.firstChild.firstChild.firstChild);

                    // tbody
                    this._sel.firstChild.removeChild(this._sel.firstChild.firstChild);

                    // table and arrow div
                    while (this._sel.childNodes.length > 0) this._sel.removeChild(this._sel.lastChild);

                    // object
                    this._sel.parentNode.removeChild(this._sel);
                    this._sel = null;
                }


                /* base */

                this.base.onclick = null;
                this.base.parentNode.removeChild(this.base);
                this.base = null;

                /* methods */

                this._clearDayHover = null;
                this._clearSelHover = null;
                this._doOnSelectorChange = null;
                this._doOnSelectorShow = null;
                this._drawMonth = null;
                this._fixLength = null;
                this._getLeft = null;
                this._getTop = null;
                this._hide = null;
                this._hideSelector = null;
                this._initSelector = null;
                this._isSelectorVisible = null;
                this._isVisible = null;
                this._posGetOffset = null;
                this._posGetOffsetRect = null;
                this._posGetOffsetSum = null;
                this._scrollYears = null;
                this._show = null;
                this._showSelector = null;
                this._strToDate = null;
                this._updateActiveHours = null;
                this._updateActiveMinutes = null;
                this._updateActiveMonth = null;
                this._updateActiveYear = null;
                this._updateCellStyle = null;
                this._updateDateStr = null;
                this._updateVisibleHours = null;
                this._updateVisibleMinutes = null;
                this._updateYearsList = null;
                this.hide = null;
                this.hideTime = null;
                this.setDate = null;
                this.setDateFormat = null;
                this.show = null;
                this.showTime = null;
                this.unload = null;

                for (var a in this) delete this[a];

                a = that = null;

            }


            // set init date
            this.setDate(this._activeDate);

            return this;
        };

    dhtmlXCalendarObject.prototype.setYearsRange = function() {}; // deprecated

    // Load uxcore language resources.
    var uxcLocale;
    var uxcResources;

    if (ux && ux.i18n) {
        uxcLocale = ux.i18n.culture;
        uxcResources = ux.i18n.dhtmlxCalendar;
    }

    // Default values just in case i18n resources weren't found.
    uxcLocale = uxcLocale || 'en';
    uxcResources = $.extend({
        dateformat: "%Y-%m-%d",
        monthesFNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthesSNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        daysFNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        daysSNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        weekstart: 1,
        today: 'Today'
    }, uxcResources);

    dhtmlXCalendarObject.prototype.lang = uxcLocale;
    dhtmlXCalendarObject.prototype.langData = { };
    dhtmlXCalendarObject.prototype.langData[uxcLocale] = uxcResources;

    dhtmlxCalendarObject = dhtmlXCalendarObject;
})(jQuery);
(function($, undefined) {
    var module = {
        options: {
            selectedIndex: 0, // index selected
            width: 250, // default width
            listWidth: undefined, // default width of list
            listMaxHeight: undefined, // default maxHeight of list
            listHeight: undefined, // default height of list
            autoOpen: false, // will open on load if true
            valueChangeElement: undefined, // jQuery elements that will be updated with value changes
            onOpen: undefined, // (me) called when the module is opened
            onClose: undefined, // (me) called when the module is closed
            onValueChanged: undefined,
            zIndex: undefined,
            disabled: false, // if true will render the droplist initially diabled.
            context: self, // where the text part of the module will be
            displayContext: self // where the droplist part of the module will be.
        },

        /* PRIVATE METHODS ********************************* */
        _create: function() {
            var $m = this;
            $m._width = $m.options.width;
            $m._listWidth = $m.options.listWidth ? $m.options.listWidth : $m._width;
            $m._enabled = $m.options.disabled !== true;
            $m._context = ux.util.context($m.options.context, $m.options.displayContext);
            var spChild = $m._context.isSingle() ? $m.element : $m._context.ext.iframe();
            $m._stackingParent = ux.util.zIndex.getStackingParent(spChild);
            $m._stackingParent = typeof ($m._stackingParent) === 'undefined' ? null : $m._stackingParent;

            $m._createMain();

            if ($m.options.valueChangeElement && $m.options.valueChangeElement.length > 0) {
                // convert the param if it is a string selector...
                $m.valueChangeElement = $($m.options.valueChangeElement);
            }

            $m._createDropDown();

            // set an item as selected
            var selected = $m.list.children('[data-selected]');
            if (selected.length === 0) selected = $m.list.children('li').eq($m.options.selectedIndex);
            if (selected.length === 0) selected = $m.list.children('li').first();
            if (selected.length > 1) selected = selected.eq(0);
            $m.selectItem(selected, true);

            // set highlighted items
            var highlighted = $m.list.children('[data-highlighted]');
            if (highlighted.length > 0) $m.highlightItems(highlighted, true);

            if ($m.options.autoOpen === true) this.open();
        },

        _createMain: function() {
            var $m = this;

            $m.element.wrap('<div class="' + $m.baseClass + '-select" />');
            $m.wrapper = $m.element.parent();
            $m.wrapper.css({
                width: ($m._width - 38) + 'px'
            });
            if (!$m._enabled) $m.wrapper.addClass($m.baseClass + '-select-disabled');
            $m.boxContent = $('<div class="' + $m.baseClass + '-selectcontent"></div>')
                .append('<div class="' + $m.baseClass + '-display"></div>')
                .prependTo($m.wrapper);
            $m.anchor = $('<div class="sf-droplist-selectbtn"><span class="' + $m.baseClass + '-anchor"></span></div>')
                .appendTo($m.wrapper);

            $m.list = $m.element;
            $m.list
                .addClass($m.baseClass)
                .hide();
        },

        _createDropDown: function() {
            var $m = this;

            var css = {
                display: 'none',
                position: $m._stackingParent !== null ? 'fixed' : 'absolute',
                'overflow-x': 'hidden'
            };

            if (typeof ($m.options.listHeight) === 'number') {
                css.height = $m.options.listHeight + 'px';
                css['overflow-y'] = 'auto';
            }
            else if (typeof ($m.options.listMaxHeight) === 'number') {
                css['max-height'] = $m.options.listMaxHeight + 'px';
                css['overflow-y'] = 'auto';
            }
            else css['overflow-y'] = 'hidden';

            $m._log('context is single = ' + $m._context.isSingle());
            $m.drop = $('<div class="sf-droplist-drop"></div>')
                .appendTo(ux.util.zIndex.getLayer('flyout', $($m._context.ext.body()), $m._context.isSingle() ? $m.element : $m._context.ext.iframe()))
                .width($m._listWidth)
                .append($m.list)
                .css(css);

            $m.list.show();

            $m.anchor.bind('click.sfdl', function() {
                if ($m._enabled) {
                    $m.toggle();
                }
            });
            $m.boxContent.bind('click.sfdl', function() {
                if ($m._enabled) {
                    $m.toggle();
                }
            });
            $m.wrapper.parents().add($m._context.ext.window()).bind('scroll.sfdl', function() {
                $m.close();
            });
            $($m._context.ext.window()).bind('click.sfdl', function(e) {
                $m._blur($(e.target));
            });

            if (!$m._context.isSingle())
                $($m._context.intr.window()).bind('click.sfdl', function(e) {
                    $m._blur($(e.target));
                });

            $m._attachItemClickHandler($m.list.children('li'));
        },

        _attachItemClickHandler: function(items) {
            var $m = this;
            items.click(function() {
                $m.selectItem($(this));
                $m.close();
            });
        },

        _positionList: function() {
            var $m = this;
            var yPosDefault = 'bottom';
            var yPosOpposite = 'top';
            var yPos = yPosDefault;

            var elPos = $m._context.isSingle() ? $m.wrapper.offset() : $m._context.ext.offset($m.wrapper, $m._stackingParent !== null);

            if ($m._context.isSingle() && $m._stackingParent !== null) {
                elPos.top -= $($m._context.ext.window()).scrollTop();
                elPos.left -= $($m._context.ext.window()).scrollLeft();
            }

            var posYRelative = {
                top: (elPos.top - $m.drop.outerHeight() + 1),
                bottom: (elPos.top + $m.wrapper.outerHeight() - 1)
            };

            var pos = {
                left: elPos.left + 'px',
                top: inpageVert(posYRelative[yPosDefault]) + 'px'
            };

            if (!isNaN($m.options.zIndex)) pos.zIndex = $m.options.zIndex;

            $m.drop.css(pos);

            function inpageVert(elTop) {
                var t = $($m._context.ext.window()).scrollTop();
                var vp = {
                    top: t,
                    bottom: t + $($m._context.ext.window()).height()
                };
                var qt = {
                    top: elTop,
                    bottom: elTop + $m.drop.outerHeight()
                };
                var a = yPosDefault == 'bottom' ? -1 : 1;

                // the list top is above the viewport and default to top positioning
                // or the list top is below the viewport and default to bottom positioning
                return ((qt[yPosDefault] * a) < (vp[yPosDefault] * a)) ? posYRelative[yPosOpposite] : elTop;
            }
        },

        _blur: function(clickTarget) {
            var isMe = ux.util.jCompat.isEl(clickTarget, this.wrapper);
            if (!isMe) isMe = ux.util.jCompat.findEl(this.wrapper, clickTarget).length > 0;

            if (!isMe) this.close();
        },

        /* PUBLIC METHODS ********************************* */
        destroy: function(callback) {
            if (this.isOpen()) this.close();
            this.boxContent.unbind();
            this.anchor.unbind();
            this.list
                .removeClass(this.baseClass)
                .hide()
                .insertBefore(this.wrapper)
                .children()
                .removeClass('sf-droplist-actv')
                .unbind();

            this.wrapper.parents().unbind('scroll.sfdl');
            this.wrapper.remove();

            $(this._context.ext.window())
                .unbind('scroll.sfdl')
                .unbind('click.sfdl');

            if (!this._context.isSingle())
                $(this._context.intr.window()).unbind('click.sfdl');

            this.drop.remove();

            this._execSuper('destroy', callback);
        },

        selectItem: function(item, forceRefresh) {
            var li;
            var old = this.selectedIndex();

            if ($.isPlainObject(item)) {
                forceRefresh = item.forceRefresh;
                item = item.item;
            }
            if (typeof (item) === 'number') li = this.list.children('li:eq(' + item + ')');
            else if (item.length === 0) return item;
            else li = item;

            if (forceRefresh || old !== li.index()) {
                // this seems convoluted, but for some reason if you just replace
                // the html or empty it and append, the new children have the parentNode
                // property set to null, so the logic to not respond to onBlur for
                // related elements in the flyout breaks since it can't tell that
                // the elements inside are children of boxContent.  Annoying!!!
                this.boxContent
                    .children().addClass('old')
                    .end()
                    .prepend('<div>' + li.children('[data-main]').html() + '</div>')
                    .children('.old').remove();

                this.list.children('li')
                    .removeAttr('data-selected')
                    .removeClass('sf-droplist-actv');

                li
                    .attr('data-selected', true)
                    .addClass('sf-droplist-actv');

                var val = li.attr('data-value')
                this.list.attr('data-value', val);


                if (!forceRefresh && $.isFunction(this.options.onValueChanged)) {
                    this.options.onValueChanged(this.element, li, val);
                }

                var elChange = this.valueChangeElement;
                if (elChange && elChange.length > 0) {
                    elChange.each(function() {
                        if ($(this).is('input'))
                            $(this).val(val);
                        else
                            $(this).text(val);
                    });
                }
            }
        },

        selectItemByValue: function(value, forceRefresh) {
            if ($.isPlainObject(value)) {
                forceRefresh = value.forceRefresh;
                value = value.value;
            }
            var item = this.list.children('li[data-value="' + value + '"]');
            if (item.length > 0) this.selectItem(item, forceRefresh);
        },

        highlightItems: function(items, preserveExisting) {
            var $m = this;

            if ($.isPlainObject(items) && !$.isArray(values)) {
                preserveExisting = items.preserveExisting
                items = items.items;
            }

            preserveExisting = preserveExisting === true;

            if (!preserveExisting)
                $m.list.children('li')
                    .removeAttr('data-highlighted')
                    .removeClass('sf-droplist-hlt');

            if (items.length === 0) return;

            $.each(items, function() {
                var item = this;
                var li = item;

                if (typeof (item) === 'number') li = $m.list.children('li:eq(' + item + ')');
                else if ($(item).length === 0) return true; // skip... not a jQuery element
                else li = $(item);

                li
                    .attr('data-highlighted', true)
                    .addClass('sf-droplist-hlt');

            });
        },

        highlightItemsByValue: function(values, preserveExisting) {
            var $m = this;

            if ($.isPlainObject(values) && !$.isArray(values)) {
                preserveExisting = values.preserveExisting;
                values = values.values;
            }

            if (values !== null && !$.isArray(values)) return;

            var items = values === null ? [] :
                $.map(values, function(val) {
                    var item = $m.list.children('li[data-value="' + val + '"]');
                    if (item.length === 0) return null;
                    return item;
                });

            $m.highlightItems(items, preserveExisting);
        },

        open: function() {
            var $m = this;
            $m._positionList();
            $m.drop.show();
            $(':sf-droplist(open)').not($m.element).sfDropList('close');
            $($m._context.ext.window()).bind('resize.sfdl' + $m.id.replace(/-_/g, ''), function() {
                if ($m.isOpen()) {
                    $m._positionList();
                }
            });
            if ($.isFunction($m.options.onOpen)) $m.options.onOpen($m.element);
        },

        close: function() {
            var $m = this;
            var proceed = true;
            if ($.isFunction($m.options.onClose)) {
                proceed = $m.options.onClose($m.element);
            }
            if (proceed) {
                $m.drop.hide();
                $($m._context.ext.window()).unbind('resize.sfdl' + $m.id.replace(/-_/g, ''));
            }
        },

        toggle: function() {
            if (this.isOpen()) this.close();
            else this.open();
        },

        addItem: function(options) {

            var text, html, value, index, classes;

            if (!options) {
                throw "You must provide arguments indicating what you'd like to add to the droplist.";
            }
            if (typeof (options) === 'object') {
                html = options.html;
                text = options.text || options.value;
                value = options.value || options.text;
                index = options.index;
                classes = options.classes;
            }
            else {
                text = options.toString();
                value = text;
            }

            var item = $('<li/>').attr('data-value', value);
            if (html) {
                item.html(html);
                if (!item.find('[data-main]').length) {
                    item.children().first().attr('data-main', 'true');
                }
            }
            else if (text) {
                item.append($('<div data-main="true"/>').text(text));
            }

            if (classes) {
                item.addClass(classes);
            }

            if (index === 0) {
                item.prependTo(this.list);
            }
            else if (index) {
                this.list.find('li:nth-child(' + (index + 1) + ')').before(item);
            }
            else {
                item.appendTo(this.list);
            }

            this._attachItemClickHandler(item);
        },

        removeItem: function(options) {
            var index, value;

            if (typeof (options) === 'number') {
                index = options;
            }
            else if (typeof (options) === 'string') {
                value = options;
            }
            else if ('index' in options) {
                index = +(options.index);
            }
            else {
                value = options.value;
            }

            var selector, isCurrent;
            if (index === undefined) {
                selector = 'li[data-value="' + value + '"]';
                isCurrent = (value == this.val());
            }
            else {
                selector = 'li:nth-child(' + (index + 1) + ')';
                isCurrent = (index == this.selectedIndex());
            }

            this.list.find(selector).remove();
            if (isCurrent) {
                this.selectItem(0);
            }
        },

        enable: function() {
            this.wrapper.removeClass(this.baseClass + '-select-disabled');
            this._enabled = true;
        },

        disable: function() {
            this.close();
            this.wrapper.addClass(this.baseClass + '-select-disabled');
            this._enabled = false;
        },

        /* PUBLIC PROPERTIES ********************************* */
        isOpen: function() {
            return this.drop.is(':visible');
        },
        val: function() {
            return this.list.children('li[data-selected]').attr('data-value');
        },

        selectedItem: function() {
            return this.list.children('li[data-selected]');
        },

        selectedIndex: function() {
            return this.list.children('li[data-selected]').index();
        },

        box: function() {
            return this.wrapper;
        }
    };

    ux.util.module('DropList', module);

    /* SELECTORS ********************************* */
    // Extend jQuery's native ':'
    // $(':sf-droplist')
    // $(':sf-droplist(open)')
    // $(':sf-droplist(closed)')
    // $(':sf-droplist(id=ID)')

    ux.util.selector(
        'sf-droplist', {
            root: {
                selector: '.sf-droplist',
                states: {
                    open: function(el) {
                        return el.sfDropList('isOpen');
                    },
                    closed: function(el) {
                        return !el.sfDropList('isOpen');
                    }
                },
                tests: {
                    id: function(el, value) {
                        return el.attr('id') === value;
                    }
                }
            }
        }
    );
})(jQuery);
// require admin/spree_backend


;
// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//


;
