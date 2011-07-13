/*

jsAtari
Copyright (C) 2011 Jeremy Neiman

This file is part of jsAtari.

jsAtari is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsAtari is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with jsAtari.  If not, see <http://www.gnu.org/licenses/>.

*/


input = 
{
	keys:
	{
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
	},

	onkeydown: function(e)
	{
		var keycode;
		
		if (window.event) 
			keycode = window.event.keyCode;
		else if (e) 
			keycode = e.which;
			
		if (keycode == input.keys.LEFT)
		{
			pia.ram[pia.reg.SWCHA] = util.D6_w(pia.ram[pia.reg.SWCHA], 0);
		}
		else if (keycode == input.keys.UP)
		{
			pia.ram[pia.reg.SWCHA] = util.D4_w(pia.ram[pia.reg.SWCHA], 0);
		}
		else if (keycode == input.keys.RIGHT)
		{
			pia.ram[pia.reg.SWCHA] = util.D7_w(pia.ram[pia.reg.SWCHA], 0);
		}
		else if (keycode == input.keys.DOWN)
		{
			pia.ram[pia.reg.SWCHA] = util.D5_w(pia.ram[pia.reg.SWCHA], 0);
		}
	},
	
	onkeyup: function(e)
	{
		var keycode;
		
		if (window.event) 
			keycode = window.event.keyCode;
		else if (e) 
			keycode = e.which;
			
		if (keycode == input.keys.LEFT)
		{
			pia.ram[pia.reg.SWCHA] = util.D6_w(pia.ram[pia.reg.SWCHA], 1);
		}
		else if (keycode == input.keys.UP)
		{
			pia.ram[pia.reg.SWCHA] = util.D4_w(pia.ram[pia.reg.SWCHA], 1);
		}
		else if (keycode == input.keys.RIGHT)
		{
			pia.ram[pia.reg.SWCHA] = util.D7_w(pia.ram[pia.reg.SWCHA], 1);
		}
		else if (keycode == input.keys.DOWN)
		{
			pia.ram[pia.reg.SWCHA] = util.D5_w(pia.ram[pia.reg.SWCHA], 1);
		}
	},
	
	bind_input: function(element)
	{
		element.onkeydown = input.onkeydown;
		element.onkeyup = input.onkeyup;
	},
	
	__init__: function(element)
	{
		pia.ram[pia.reg.SWCHA] = 0xff;
		input.bind_input(element);
	}
};