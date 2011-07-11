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


util =
{
	/*Setters/Getters for individual bits in a byte*/
	D0_w: function(reg, v) {return (v ? reg |= 1 : reg &= ~1);},
	D1_w: function(reg, v) {return (v ? reg |= 2 : reg &= ~2);},
	D2_w: function(reg, v) {return (v ? reg |= 4 : reg &= ~4);},
	D3_w: function(reg, v) {return (v ? reg |= 8 : reg &= ~8);},
	D4_w: function(reg, v) {return (v ? reg |= 16 : reg &= ~16);},
	D5_w: function(reg, v) {return (v ? reg |= 32 : reg &= ~32);},
	D6_w: function(reg, v) {return (v ? reg |= 64 : reg &= ~64);},
	D7_w: function(reg, v) {return (v ? reg |= 128 : reg &= ~128);},
	
	D0_r: function(reg) {return Boolean(reg & 1);},
	D1_r: function(reg) {return Boolean(reg & 2);},
	D2_r: function(reg) {return Boolean(reg & 4);},
	D3_r: function(reg) {return Boolean(reg & 8);},
	D4_r: function(reg) {return Boolean(reg & 16);},
	D5_r: function(reg) {return Boolean(reg & 32);},
	D6_r: function(reg) {return Boolean(reg & 64);},
	D7_r: function(reg) {return Boolean(reg & 128);},
	
	/*Functions for handling BCD numbers when in decimal mode*/
	fromBCD: function(v){return ((((v&0xF0)/0x10)*10) + (v&0xF));},
	toBCD: function(v){return (Math.floor(v/10)*16 + (v%10));},
	
	decimal: function(v) {return ((v&127) - (v&128));}, //Return the decimal value of a two's compliment number.  (i.e. if v is 255, return -1)
	twosCom: function(v) {return (v < 0 ? 256+v : v);}, //Return the two's compliment form of a decimal (i.e. if v is -1, return 255)
	
	
	/*Generate a string based on the color given in [r,g,b] format*/
	colorString: function(color)
	{
		return ["rgb(", color[0], ",", color[1], ",", color[2], ")"].join("");
	},
};