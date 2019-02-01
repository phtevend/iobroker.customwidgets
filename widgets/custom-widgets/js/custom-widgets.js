/*
    ioBroker.vis custom-widgets Widget-Set

    version: "0.0.1"

    Copyright 2019 sdo sdo@gmx.de
*/
"use strict";

// add translations for edit mode
$.get( "adapter/custom-widgets/words.js", function(script) {
    let translation = script.substring(script.indexOf('{'), script.length);
    translation = translation.substring(0, translation.lastIndexOf(';'));
    $.extend(systemDictionary, JSON.parse(translation));
});

// this code can be placed directly in custom-widgets.html
vis.binds["custom-widgets"] = {
    version: "0.0.1",
    showVersion: function () {
        if (vis.binds["custom-widgets"].version) {
            console.log('Version custom-widgets: ' + vis.binds["custom-widgets"].version);
            vis.binds["custom-widgets"].version = null;
        }
    },

    hue2rgb: function (h, s, v){
		var r, g, b, i, f, p, q, t;
		if (arguments.length === 1) {
			s = h.s, v = h.v, h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
		return {
			r: Math.round(r * 255),
			g: Math.round(g * 255),
			b: Math.round(b * 255)
		};
	},
	
	hueColormode: function (el, oid) {
		var $hue = $(el).parent().find('.hue-mode-hue');
		var $ct  = $(el).parent().find('.hue-mode-ct');

		if (vis.states.attr(oid + '.val') == 'ct') {
			$hue.hide();
			$ct.show();
		} else {
			$ct.hide();
			$hue.show();
		}

		vis.states.bind(oid + '.val', function (e, newVal, oldVal) {
			if (newVal == 'ct') {
				$hue.hide();
				$ct.show();
			} else {
				$ct.hide();
				$hue.show();
			}
		});
	},	
		
    radio: function (el, options, process) {
		if (!process) {
			setTimeout(function () {
				vis.binds.jqueryui.radio(el, process, true);
			}, 50);
			return;
		}
		var settings = $.extend({}, options);
		var $this = $(el);
		var oid = $this.attr('data-oid');
	
		// Observable -> Buttonset
		vis.states.bind(oid + '.val', function (e, newVal, oldVal) {
			$this.find('input').removeAttr('checked');
			if (newVal === true || newVal === 'true') {
				newVal = 1;
			} else
			if (newVal === false || newVal === 'false') {
				newVal = 0;
			}
			$this.find('input').prop('checked', false);
			$this.find('input[value="' + newVal + '"]').prop('checked', true);
			$this.find('input').each(function () {
				if ($(this).button('instance')) $(this).button('refresh');
			});
		});
	
		var val = vis.states.attr(oid + '.val');
	
		if (val === true  || val === 'true')  { val = 1; }
		if (val === false || val === 'false') { val = 0; }
		setTimeout(function () {
			//console.log(val + ' ' + $this.find('input[value="' + val + '"]').length);
			$this.find('input').prop('checked', false);
			$this.find('input[value="' + val + '"]').prop('checked', true);
			$this.buttonset(settings);
	
			$this.find('input').each(function () {
				if ($this.button('instance')) $(this).button('refresh');
			});
			if (!vis.editMode) {
				// Buttonset -> Observable
				$this.find('input').on('click touchstart', function () {
					// Protect against two events
					if (vis.detectBounce(this)) return;
	
					var val = $(this).val();
					var f = parseFloat(val);
					if (f.toString() == val.toString()) {
						vis.setValue(oid, f);
					} else {
						vis.setValue(oid, val);
					}
				});
			}
		}, 50);
	}, 
	
	activeHelper: function ($this, val, min, max, value, reverse) {
		if (val === true  || val === 'true')  val = max;
		if (val === false || val === 'false') val = min;

		if (max === undefined || max === '' || max === null) {
			max = 1;
			min = 0;
			val = (val === 'false' || val === false || val === 0 || val === '0' || val === '' || val === null || val === undefined) ? min : max;
		}

		if (reverse) {
			if (val == max) {
				val = min;
			} else {
				val = max;
			}
		}

		if (value === undefined && val > min && val !== true) {
			val = parseFloat(val) || 0;
		}

		if ((value === undefined && val > min) || (value !== undefined && val == value)) {
			$this.addClass('ui-state-active');
		} else {
			$this.removeClass('ui-state-active');
		}
	},
	
	active: function (el, reverse, _value) {
		var $this = $(el);
		var oid = $this.data('oid');
		var max = $this.data('max') || 1;
		var min = $this.data('min') || 0;
		if (oid) {
			vis.states.bind(oid + '.val', function (e, newVal, oldVal) {
				vis.binds.jqueryui.activeHelper($this, newVal, min, max, _value, reverse);
			});
			vis.binds.hueSwitches.activeHelper($this, vis.states.attr(oid + '.val'), min, max, _value, reverse);
		}
	},
		
	classes: function (el, reverse, _value) {
		var $this = $(el);
		if (!$this.data('no-style')) {
			$this.hover(function () {
				$this.addClass('ui-state-hover');
			}, function () {
				$this.removeClass('ui-state-hover');
			});
		} else {
			$this.removeClass('ui-widget ui-corner-all ui-state-default');
		}
	
		$this.css({position: 'absolute'});
		vis.binds.hueSwitches.active(el, reverse, _value);
	},
		
	dialog: function (el, options, persistent, preload, html, closeOnClick) {
		var $dlg = $(el).parent().find('div.vis-widget-dialog');
		$dlg.data('preload', (!preload || preload == 'false') && !$dlg.html().replace(/\s/g, ''));
		$('[aria-describedby="' + $dlg.attr('id') + '"]').remove();
  
		options.width     = options.width  || options.dialog_width;
		options.height    = options.height || options.dialog_height;
		options.top       = options.top    || options.dialog_top;
		options.left      = options.left   || options.dialog_left;
		options.minHeight = options.height;
		options.minWidth  = options.width;
  
		// Show dialog in edit mode too
		if (1 || !vis.editMode) {
			$(el).parent().find('div.vis-widget-body').on('click touchstart', function () {
				// Protect against two events
				if (vis.detectBounce(this)) return;
  
				if ($dlg.data('preload')) $dlg.html(html);
  
				if (persistent) {
					if (options.setId) vis.setValue(options.setId, options.setValue);
					$dlg.dialog('open');
					if (options.minHeight)   $dlg.css('min-height', options.minHeight);
					if (options.minWidth)    $dlg.css('min-width', options.minWidth);
					if (options.top  || options.top  === 0)  $dlg.parent().css('top', options.top);
					if (options.left || options.left === 0) $dlg.parent().css('left', options.left);
					if (options.overflowX) $dlg.css('overflow-x', options.overflowX);
					if (options.overflowY) $dlg.css('overflow-y', options.overflowY);
					if (options.noHeader) $dlg.parent().find('.ui-dialog-titlebar').css({background: 'rgba(0,0,0,0)', border: 0, color: 'rgba(0,0,0,0)'});
					$dlg.parent().find('.ui-state-focus').blur();
				} else {
					$dlg.dialog($.extend({
						autoOpen: true,
						open: function () {
							if (options.setId) vis.setValue(options.setId, options.setValue);
							$(this).parent().css('z-index', 998);
							if (options.minHeight)   $(this).css('min-height', options.minHeight);
							if (options.minWidth)    $(this).css('min-width', options.minWidth);
							if (options.top  || options.top  === 0)  $(this).parent().css('top', options.top);
							if (options.left || options.left === 0) $(this).parent().css('left', options.left);
							if (options.overflowX) $(this).css('overflow-x', options.overflowX);
							if (options.overflowY) $(this).css('overflow-y', options.overflowY);
							if (options.noHeader) $dlg.parent().find('.ui-dialog-titlebar').css({background: 'rgba(0,0,0,0)', border: 0, color: 'rgba(0,0,0,0)'});
							$(this).parent().find('.ui-state-focus').blur();
						},
						close: function () {
							if ($dlg.data('timer')) { clearTimeout($dlg.data('timer')); $dlg.data('timer', null)};
							$dlg.dialog('destroy');
							// Destroy content if not preloaded
							if ($dlg.data('preload')) $dlg.html('');
						}
					}, options));
  
					$dlg.data('inited', true);
  
					if (closeOnClick) {
						$dlg.unbind('click touchstart').on('click touchstart', function () {
							$dlg.dialog('close');
						});
					}
				}
			});
		}
		if (persistent) {
			$dlg.dialog($.extend({
				autoOpen: false,
				open: function () {
					$dlg.parent().css({'z-index': 1000});
					if ($dlg.data('preload')) $dlg.html(html);
				},
				close: function () {
					if ($dlg.data('timer')) {
						clearTimeout($dlg.data('timer'));
						$dlg.data('timer', null);
					}
					// Destroy content if not preloaded
					if ($dlg.data('preload')) $dlg.html('');
				}
			}, options));
  
			$dlg.data('inited', true);
  
			if (closeOnClick) {
				$dlg.unbind('click touchstart').on('click touchstart', function () {
					$dlg.dialog('close');
				});
			}
		}
	},
		
	slider: function (el, oidHue, options) {
        var $this = $(el);
        var oid = oidHue;
        var oid2 = $this.attr('data-oid2');
        var oid_val = 0;
        var oid2_val = 0;
        var wid = $this.attr("data-oid-working");
        var wid2 = $this.attr("data-oid2-working");
        var settings = $.extend({
            range: oid2 ? true : false,
            min: 0,
            max: 100,
            step: 1,
            value: parseFloat(vis.states.attr(oid + '.val')),
            slide: function (e, ui) {
                // Slider -> Observable

                if (oid2) {
                    if (options.inverted) {
                        ui.values[0] = (settings.max - ui.values[0]) + settings.min;
                        ui.values[1] = (settings.max - ui.values[1]) + settings.min;
                    }

                    vis.setValue(oid, ui.values[0]); //.toFixed(6));
                    vis.setValue(oid2, ui.values[1]); //.toFixed(6));
                } else {
                    if (options.inverted) ui.value = (settings.max - ui.value) + settings.min;
                    vis.setValue(oid, ui.value); //.toFixed(6));
                }

            }
        }, options);

        settings.inverted = (settings.inverted === 'true' || settings.inverted === true);

        if (isNaN(settings.value)) settings.value = 0;
        if (isNaN(settings.min))   settings.min = 0;
        if (isNaN(settings.max))   settings.max = 100;
        if (isNaN(settings.step))  settings.step = (settings.max - settings.min) / 100;

        settings.min = parseFloat(settings.min);
        settings.max = parseFloat(settings.max);
        settings.value = parseFloat(settings.value);

        if (settings.inverted) settings.value = (settings.max - settings.value) + settings.min;

        $this.slider(settings);

        vis.states.bind(oid + '.val', function (e, newVal, oldVal) {
            // console.log("slider newVal="+JSON.stringify(newVal));
            // If device not in working state
            if (!vis.states.attr(wid + '.val')) {

                if (settings.inverted) {
                    oid_val = (settings.max - parseFloat(newVal)) + settings.min;
                } else {
                    oid_val = parseFloat(newVal);
                }
                if ($this.slider('instance')) {
                    if (oid2) {
                        $this.slider('values', [oid_val, oid2_val]);
                    } else {
                        $this.slider('value', oid_val);
                    }
                }
            }
        });
        if (oid2) {
            vis.states.bind(oid2 + '.val', function (e, newVal, oldVal) {
    //                     console.log("slider newVal="+JSON.stringify(newVal));
                // If device not in working state
                if (!vis.states.attr(wid2 + '.val')) {
                    oid2_val = parseFloat(newVal);
                    if (settings.inverted) {
                        oid2_val = (settings.max - parseFloat(newVal)) + settings.min;
                    } else {
                        oid2_val = parseFloat(newVal);
                    }
                    if ($this.slider('instance')) {
                        $this.slider('values', [oid_val, oid2_val]);
                    }
                }
            });

            oid_val = vis.states.attr(oid + '.val');
            oid2_val = vis.states.attr(oid2 + '.val');
            if (settings.inverted) {
                oid_val = (settings.max - oid_val) + settings.min;
                oid2_val = (settings.max - oid2_val) + settings.min;
            }
            $this.slider('values', [oid_val, oid2_val]);
        }

        $(function () {
            $("#slider-range").slider({
                range: true,
                min: 0,
                max: 500,
                values: [75, 300],
                slide: function (event, ui) {
                    $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
                }
            });
            $("#amount").val("$" + $("#slider-range").slider("values", 0) +
                    " - $" + $("#slider-range").slider("values", 1));
        })
    }
};

vis.binds["custom-widgets"].showVersion();