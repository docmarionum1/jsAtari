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

pia = 
{
	debug: false,
	
	reg_max: 0x17,
	
	reg:
	{
		SWCHA : 0x00,
		SWACNT: 0x01,
		SWCHB : 0x02,
		SWBCNT: 0x03,
		INTIM : 0x04,
		TIM1T : 0x14,
		TIM8T : 0x15,
		TIM64T: 0x16,
		T1024T: 0x17
	},
	
	/*External Representation of the registers*/
	ex_reg:
	{
		SWCHA : 0x280,
		SWACNT: 0x281,
		SWCHB : 0x282,
		SWBCNT: 0x283,
		INTIM : 0x284,
		TIM1T : 0x294,
		TIM8T : 0x295,
		TIM64T: 0x296,
		T1024T: 0x297
	},
	
	set:
	{
		TIM1T : function() {pia.intim = pia.ram[pia.reg.TIM1T]; pia.timer_current_int = pia.timer_interval = 1; pia.timer = pia.intim * pia.timer_interval; },
		TIM8T : function() {pia.intim = pia.ram[pia.reg.TIM8T]; pia.timer_current_int = pia.timer_interval = 8; pia.timer = pia.intim * pia.timer_interval; },
		TIM64T: function() {pia.intim = pia.ram[pia.reg.TIM64T]; pia.timer_current_int = pia.timer_interval = 64; pia.timer = pia.intim * pia.timer_interval; },
		T1024T: function() {pia.intim = pia.ram[pia.reg.T1024T]; pia.timer_current_int = pia.timer_interval = 1024; pia.timer = pia.intim * pia.timer_interval; },
	},
	
	timer: 0, //Internal Timer, decremements every cycle
	timer_interval: 1, //Current Interval size of the timer.
	intim: 0, //The value in INTIM
	timer_current_int: 0, //The counter for the current interval, decremements to 0 then returns to the interval size

	/*Memory for Registers*/
	memory: new ArrayBuffer(0x18),
	ram: null, //View
	
	write: -1, //The register, if any, that was written to in the last operation
	
	
	__init__: function(debug)
	{
	
		pia.ram = new Uint8Array(pia.memory, 0);
		
		pia.set_reg =
		{
			0x14: pia.set.TIM1T,
			0x15: pia.set.TIM8T,
			0x16: pia.set.TIM64T,
			0x17: pia.set.T1024T,
		};
		
		pia.debug = debug;
	},
	
	dec_timer: function()
	{
		pia.timer--; //Always decrement timer
		if ((--pia.timer_current_int) == 0) //If the current interval counter is less than 0 decremenet intim
		{
			if ((--pia.intim) < 0)
			{
				pia.intim = 0xff;
				pia.timer_interval = 1;
			}
			pia.timer_current_int = pia.timer_interval;
			pia.ram[pia.reg.INTIM] = pia.intim;
		}
	},
	
	step: function()
	{
		pia.dec_timer();
		pia.sync_ram();
	},
	
	/*Sync the mmu's ram with the changes in the PIA.*/
	sync_ram: function()
	{
		for (var i = 0; i <= 4; i++)
		{
			mmu.pia[i] = pia.ram[i];
		}
	},
	
	/*Sync the changes in the mmu after a CPU operation*/
	sync: function()
	{	
		if (pia.write >= 0)
		{
			pia.ram[pia.write] = mmu.pia[pia.write];
			if (pia.write in pia.set_reg) //if one of the timer setters was written to
			{
				pia.set_reg[pia.write]();
			}
			
			pia.write = -1;
		}
	},
};