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

/*Object to handle the internal representation of Players (counters)*/
function player(missle) //The corresponding missle
{
	this.size = 1; //The size of each pixel
	this.MAX = 160;
	this.START = 5;
	
	this.counter = 0;  //The counter for the player, from 0 to 40
	this.graphics_scan_counter = 0; //Counts down pixels after a START is triggered from 15 - 0 (4 pClocks, 16 Color Clocks)
	this.start_counter = 0; //Counts down from when a START is triggered
	
	this.old = 0; //An "old" copy 
	
	this.hmove_latch = false;
	
	this.missle = missle;
	
	this.inc_table = 
	[
		{156:true},
		{12:true, 156:true},
		{28:true, 156:true},
		{12:true, 28:true, 156:true},
		{60:true, 156:true},
		{156:true},
		{28:true, 60:true, 156:true},
		{156:true}
	];
	
	this.inc = function(nusizx) //Takes bits D0-D2 from NUSIZX as a parameter and the number of pixels to increment by
	{	
		// if (this.counter == 12 && nusizx in {1:1, 3:1}) //For 2 or 3 copies, close
		// {
			// this.start_counter = this.START;
			// this.missle.wrap_around_latch = false;
		// }
			
		// else if (this.counter == 28 && nusizx in {2:1, 3:1, 6:1}) //For 2 copies med, 3 copies close or 3 copies med
			// this.start_counter = this.START;
			
		// else if (this.counter == 60&& nusizx in {4:1, 6:1}) //For 2 copies wide, or 3 copies med
			// this.start_counter = this.START;
			
		// else if (this.counter == 156) //START is always triggered at the end of the counter
		// {		
			//debug("START");
			// this.start_counter = this.START;
		// }
		
		if (++this.counter >= this.MAX)
		{
			this.counter = 0;
			this.missle.wrap_around_latch = true;
		}
		
		// else if (this.counter == 156 || (this.counter == 12 && nusizx in {1:1, 3:1}) || (this.counter == 28 && nusizx in {2:1, 3:1, 6:1}) || (this.counter == 60 && nusizx in {4:1, 6:1}))
		// {
			// this.start_counter = this.START;
			// this.missle.wrap_around_latch = false;
		// }
		
		else if (this.counter == 156 || (this.counter == 12 && (nusizx == 1 || nusizx == 3)) || (this.counter == 28 && (nusizx == 2 || nusizx == 3 || nusizx == 6)) || (this.counter == 60 && (nusizx == 4 || nusizx == 6)))
		{
			this.start_counter = this.START;
			this.missle.wrap_around_latch = false;
		}
		
		// switch(this.counter)
		// {
			// case 156:
				// this.start_counter = this.START; break;
			// case 12:
				// if (nusizx in {1:1, 3:1})
				// {
					// this.start_counter = this.START;
					// this.missle.wrap_around_latch = false;
				// }
				// break;
			// case 28:
				// if (nusizx in {2:1, 3:1, 6:1})
					// this.start_counter = this.START;
				// break;
			// case 60:
				// if (nusizx in {4:1, 6:1})
					// this.start_counter = this.START;
				// break;
		//}
		
		// else if (this.counter in this.inc_table[nusizx])
		// {
			// this.start_counter = this.START;
			// this.missle.wrap_around_latch = false;
		// }
	};
	
	this.inc_graphics = function()
	{
		if (this.start_counter <= 0)
		{
			if (++this.graphics_scan_counter == 4)
				this.missle.resetP();
		}
	};
	
	this.dec_start = function()
	{
		if (this.start_counter-- == 0)
		{
			this.graphics_scan_counter = -1;
		}
	};
	
	this.pixel = function(grpx, refpx, vdelpx)
	{
		if (vdelpx)
			grpx = this.old
		if (this.graphics_scan_counter >= 0 && this.graphics_scan_counter < 8) //If the counter is within the range for pixels to be drawn
		{
			if (!refpx) //If it's not reflected
				return grpx&Math.pow(2, 7 - this.graphics_scan_counter);
			
			return grpx&Math.pow(2, this.graphics_scan_counter); //If it is reflected
		}
		return false;
	};
	
	this.reset = function()
	{
		this.counter = -3; //Delay of 1 pCount to latch, no START is triggered
		//this.graphics_scan_counter = 0;
		//debug(this.counter);
	};
}


/*Object to handle the internal representation of Missles (counters)*/
function missle(resmpxA) //The address of it's RESMPx register
{
	this.MAX = 160;
	this.START = 4;
	
	this.counter = 0;  //The counter for the player, from 0 to 40
	this.start_counter = 0; //Counts down from when a START is triggered
	this.graphics_scan_counter = -1; //Counts down pixels after a START is triggered from 15 - 0 (4 pClocks, 16 Color Clocks)
	
	this.wrap_around_latch = false;//Set when the corresponding player's counter wraps around from 159 to 0.
	this.hmove_latch = false;
	
	this.resmpx = resmpxA;
	
	this.inc = function(nusizx) //Takes bits D0-D2 from NUSIZX as a parameter to determine number of missles
	{
		// if (this.counter == 12 && nusizx in {1:1, 3:1}) //For 2 or 3 copies, close
		// {
			// this.start_counter = this.START;
		// }
			
		// else if (this.counter == 28 && nusizx in {2:1, 3:1, 6:1}) //For 2 copies med, 3 copies close or 3 copies med
			// this.start_counter = this.START;
			
		// else if (this.counter == 60&& nusizx in {4:1, 6:1}) //For 2 copies wide, or 3 copies med
			// this.start_counter = this.START;
		
		// else if (this.counter == 156) //START is always triggered at the end of the counter
		// {		
			// this.start_coutner = this.START;
		// }
		
		// if (++this.counter >= this.MAX)
			// this.counter = 0; 
			
		if (++this.counter >= this.MAX)
		{
			this.counter = 0;
		}
		
		else if (this.counter == 156 || (this.counter == 12 && (nusizx == 1 || nusizx == 3)) || (this.counter == 28 && (nusizx == 2 || nusizx == 3 || nusizx == 6)) || (this.counter == 60 && (nusizx == 4 || nusizx == 6)))
		{
			this.start_counter = this.START;
		}
	};
	
	this.inc_graphics = function()
	{
		if (this.start_counter <= 0)
		{
			this.graphics_scan_counter++;
		}
	};
	
	this.dec_start = function()
	{
		if (this.start_counter-- == 0)
		{
			this.graphics_scan_counter = -1;
		}
	};
	
	this.pixel = function(enamx) //Takes D1 of ENAMx to determine whether to draw
	{
		if(!enamx)
			return false;
			
		if (this.graphics_scan_counter == 0) //If the counter is within the range for pixels to be drawn
		{
			return true;
		}
	};
	
	this.reset = function()
	{
		if (!(tia.ram[this.resmpx]&2)) //If RESPMx is true, no reset is triggered
			this.counter = -3; //Delay of 1 mCount to latch, no START is triggered
	};
	
	this.resetP = function() //Resets the missle when it is locked to the player 
	{
		if ((tia.ram[this.resmpx]&2) && this.wrap_around_latch) //If RESMPx is true and it is the first player drawn
			this.counter = -3;
	};
}


/*Object to handle the internal representation of the Ball (counters)*/
function ball()
{
	this.size = 1; //The size of each pixel
	this.MAX = 160;
	this.START = 4;
	
	this.counter = 0;  //The counter for the player, from 0 to 40
	this.graphics_scan_counter = 0; //Counts down pixels after a START is triggered from 15 - 0 (4 pClocks, 16 Color Clocks)
	this.start_counter = 0; //Counts down from when a START is triggered
	
	this.old = 0; //An "old" copy 
	
	this.hmove_latch = false;
	
	this.inc = function()
	{			
		if (this.counter == 156) //START is always triggered at the end of the counter
		{		
			this.start_counter = this.START;
		}
		
		if (++this.counter >= this.MAX)
		{
			this.counter = 0;
		}
	};
	
	this.inc_graphics = function()
	{
		if (this.start_counter <= 0)
		{
			this.graphics_scan_counter++;
		}
	};
	
	this.dec_start = function()
	{
		if (this.start_counter-- == 0)
		{
			this.graphics_scan_counter = -1;
		}
	};
	
	this.pixel = function(enabl, vdelbl) //Takes D1 of ENABL and D0 of VDELBL
	{
		if (this.graphics_scan_counter == 0) //If the counter is within the range for pixels to be drawn
		{
			if (vdelbl)
				return this.old;
			return enabl;
		}
		return false;
	};
	
	this.reset = function()
	{
		this.counter = -3; //Delay of 1 pCount to latch, no START is triggered
		//this.graphics_scan_counter = 0;
		//debug(this.counter);
	};
}



tia = 
{
	/*Whether debugging is on*/
	debug: false,
	
	
	/*Speed of TIA relative to CPU*/
	CLOCK       : 3,
	
	/*Dimensions*/
	dim:
	{
		/*Clock Counts*/
		WIDTH		: 228,
		HBLANK		: 68,
		HPICTURE	: 160,
		
		/*Vertical Heights*/
		HEIGHT		: 262,
		VYSNC		: 3,
		VBLANK		: 37,
		VPICTURE	: 192,
		OVERSCAN	: 30,
		TOP			: 40,
		BOTTOM		: 232
	},
	
	
	/*TIA register addresses (internal)*/
	reg:
	{
		/*Write Registers*/
		VSYNC	: 0x0,
		VBLANK	: 0x1,
		WSYNC	: 0x2,
		RSYNC	: 0x3,
		NUSIZ0	: 0x4,
		NUSIZ1	: 0x5,
		COLUP0	: 0x6,
		COLUP1	: 0x7,
		COLUPF	: 0x8,
		COLUBK	: 0x9,
		CTRLPF	: 0xA,
		REFP0	: 0xB,
		REFP1	: 0xC,
		PF0		: 0xD,
		PF1		: 0xE,
		PF2		: 0xF,
		RESP0	: 0x10,
		RESP1	: 0x11,
		RESM0	: 0x12,
		RESM1	: 0x13,
		RESBL	: 0x14,
		AUDC0	: 0x15,
		AUDC1	: 0x16,
		AUDF0	: 0x17,
		AUDF1	: 0x18,
		AUDV0	: 0x19,
		AUDV1	: 0x1A,
		GRP0	: 0x1B,
		GRP1	: 0x1C,
		ENAM0	: 0x1D,
		ENAM1	: 0x1E,
		ENABL	: 0x1F,
		HMP0	: 0x20,
		HMP1	: 0x21,
		HMM0	: 0x22,
		HMM1	: 0x23,
		HMBL	: 0x24,
		VDELP0	: 0x25,
		VDEL01	: 0x26,
		VDELBL	: 0x27,
		RESMP0	: 0x28,
		RESMP1	: 0x29,
		HMOVE	: 0x2A,
		HMCLR	: 0x2B,
		CXCLR	: 0x2C,
		
		/*Read Registers*/
		CXM0P	: 0x30,
		CXM1P	: 0x31,
		CXP0FB	: 0x32,
		CXP1FB	: 0x33,
		CXM0FB	: 0x34,
		CXM1FB	: 0x35,
		CXBLPF	: 0x36,
		CXPPMM	: 0x37,
		INPT0	: 0x38,
		INPT1	: 0x39,
		INPT2	: 0x3A,
		INPT3	: 0x3B,
		INPT4	: 0x3C,
		INPT5	: 0x3D
	},
	
	
	
	/*A copy of the ram in the MMU for accessing the TIA's registers*/
	memory: new ArrayBuffer(0x3E),
	ram: null, //View
	ram_changed: false,
	
	/*DOM elements*/
	//Canvas and Context
	canvas: null,
	context: null,
	screen: null, //ImageData
	
	/*The position of the electron beam including blanks*/
	pos: 
	{
		x:0,
		y:0
	},
	
	/*Whether vsync has already been done for the current frame*/
	vsync: false,
	
	pf_current: null,
	pf_buffer: null,
	  
	write: -1, //The register, if any, that was written to in the last operation
	
	skip: 1, //Frame skip counter
	
	hmove_counter: -1, //The counter for when HMOVE is called
	
	bl: new ball(), //The ball
	
	/*Initialize the TIA to draw to the page*/
	__init__: function(canvas_element, debug)
	{
		tia.debug = debug;
		
		
		tia.canvas = canvas_element;
		tia.context = tia.canvas.getContext("2d");
		tia.screen = tia.context.createImageData(tia.dim.HPICTURE, tia.dim.VPICTURE);
		
		
		/*Stuff that can't be set until tia is created*/
		
		/*Array View*/
		tia.ram =  new Uint8Array(tia.memory, 0);
		
		/*Missiles*/
		tia.m0 = new missle(tia.reg.RESMP0);
		tia.m1 = new missle(tia.reg.RESMP1);
		
		/*Players*/
		tia.p0 = new player(tia.m0);
		tia.p1 = new player(tia.m1);
	},
	
	/*get the color represented by the given color register*/
	getColor: function(a)
	{
		var v = tia.ram[a];
		return tia.color_rgb[(v&14)>>1][(v&240)>>4];
	},
	
	/*Strobe functions*/
	strobes:
	{
		WSYNC: function() { if (tia.pos.x != 0) cpu.paused = true; }, //Pause the cpu until the leading edge of the next HBLANK
	
		RSYCN: function() {},
		
		//Clear collision registers
		CXCLR: function() { tia.ram[tia.reg.CXM1P] = tia.ram[tia.reg.CXM1P] = tia.ram[tia.reg.CXP0FB] = tia.ram[tia.reg.CXP1FB] = tia.ram[tia.reg.CXM0FB] = tia.ram[tia.reg.CXM01FB] = tia.ram[tia.reg.CXBLPF] = tia.ram[tia.reg.CXPPMM] = 0;},
		
		//HMCLR: function() { mmu.tia[tia.reg.HMP0] = mmu.tia[tia.reg.HMP1] = mmu.tia[tia.reg.HMM0] = mmu.tia[tia.reg.HMM1] = mmu.tia[tia.reg.HMBL] = 0; }, //Clear Horizontal motion registers
		HMCLR: function() { tia.ram[tia.reg.HMP0] = tia.ram[tia.reg.HMP1] = tia.ram[tia.reg.HMM0] = tia.ram[tia.reg.HMM1] = tia.ram[tia.reg.HMBL] = 0; },
		/*Schedule position resets*/
		RESP0: function() { tia.p0.reset(); },
		RESP1: function() { tia.p1.reset(); },
		RESM0: function() { tia.m0.reset(); },
		RESM1: function() { tia.m1.reset(); },
		RESBL: function() { tia.bl.reset(); tia.bl.start_counter = tia.bl.START; }, //RESBL DOES trigger a START unlike the rest of the reset strobes
		
		/*Apply the horizontal motion*/
		HMOVE: function()
		{
			tia.dim.HBLANK = 76;
			tia.hmove_counter = 15;
			tia.p0.hmove_latch = true;
			tia.p1.hmove_latch = true;
		}
	},
	
	/*Handle everything that happens at the beginning of a new line*/
	newLine: function()
	{
		if (tia.debug)
			debug("NEW LINE");
		tia.pos.x = 0;
		tia.pos.y++;
		cpu.paused = false;
		tia.dim.HBLANK = 68;
	},
	
	/*Handle everything that happens at the beginning of a new frame*/
	newFrame: function()
	{
		//tia.newLine();
		tia.pos.y = 0;
		if (!tia.debug)
		{
			tia.context.putImageData(tia.screen, 0, 0);
		}
		
		if ((tia.skip++)%60 == 0) //Update FPS every 60 frames
			debugging.updateFPS();
			
		//debug(tia.ram[tia.reg.GRP0]);
	},
	
	/*Update the x and y positions of the TIA (CLK and Scan lines)*/
	updatePos: function()
	{	
		if ((tia.ram[tia.reg.VSYNC]&2) && !tia.vsync) //Only create a new frame once per VSYNC
		{
			tia.vsync = true;
			tia.newFrame();
		}
		else
		{
			if (!(tia.ram[tia.reg.VSYNC]&2) && tia.vsync) //VSYNC turned off
			{
				tia.vsync = false;
			}
				
			if (++tia.pos.x >= tia.dim.WIDTH)
			{
				tia.newLine();
				
				//Frame doesn't reset until VYSNC is written to?
				/*if (++tia.pos.y >= tia.HEIGHT)
				{
					tia.newFrame();
				}*/
				
				//Experimental - expand screen if there are more color scan lines
				if (tia.pos.y >= tia.dim.BOTTOM && !(tia.ram[tia.reg.VBLANK]&2))
				{
					tia.dim.BOTTOM++;
					tia.dim.VPICTURE++;
					tia.dim.OVERSCAN--;
					tia.canvas.height++;
					tia.screen = tia.context.createImageData(tia.dim.HPICTURE, tia.dim.VPICTURE);
				}
			}
			
			
			/*Check HMOVE counter against HMXX registers and decrement the counter*/
			
			if (tia.hmove_counter >= 0) //If HMOVE was strobed and the counter is still counting down
			{
				/*Players*/
				if ((((tia.ram[tia.reg.HMP0]>>4)^8)&tia.hmove_counter) == 0) //If when the MSB of the HMXX register is flipped, it has no bits in common with the hmove_register
				{
					tia.p0.hmove_latch = false;
				}
				if ((((tia.ram[tia.reg.HMP1]>>4)^8)&tia.hmove_counter) == 0) //If when the MSB of the HMXX register is flipped, it has no bits in common with the hmove_register
				{
					tia.p1.hmove_latch = false;
				}
				
				/*Missles*/
				if ((((tia.ram[tia.reg.HMM0]>>4)^8)&tia.hmove_counter) == 0) //If when the MSB of the HMXX register is flipped, it has no bits in common with the hmove_register
				{
					tia.m0.hmove_latch = false;
				}
				if ((((tia.ram[tia.reg.HMM1]>>4)^8)&tia.hmove_counter) == 0) //If when the MSB of the HMXX register is flipped, it has no bits in common with the hmove_register
				{
					tia.m1.hmove_latch = false;
				}
				
				/*Ball*/
				if ((((tia.ram[tia.reg.HMBL]>>4)^8)&tia.hmove_counter) == 0) //If when the MSB of the HMXX register is flipped, it has no bits in common with the hmove_register
				{
					tia.bl.hmove_latch = false;
				}
				
				tia.hmove_counter--;
			}
			
			
			/*If we are still in HBLANK and the hmove_latches are still set, increment the counters*/
			if ((tia.pos.x < tia.dim.HBLANK))
			{
				/*Players*/
				if (tia.p0.hmove_latch)
					tia.p0.inc(tia.ram[tia.reg.NUSIZ0]&7);
				
				if (tia.p1.hmove_latch)
					tia.p1.inc(tia.ram[tia.reg.NUSIZ1]&7);
					
					
				/*Missles*/	
				if (tia.m0.hmove_latch)
					tia.m0.inc(tia.ram[tia.reg.NUSIZ0]&7);
					
				if (tia.m1.hmove_latch)
					tia.m1.inc(tia.ram[tia.reg.NUSIZ1]&7);
					
				/*Ball*/
				if (tia.bl.hmove_latch)
					tia.m1.inc();
			}
			
			/*Playing Field*/
			if ((tia.pos.x >= (tia.dim.HBLANK - 4)) && (tia.pos.x%4 == 0)) //every 4 clocks and if the position is at least 4 clocks before starting the picture
			{
				tia.pf_current = tia.pf_buffer;
				tia.pf_buffer = tia.pfBuffer();
			}
			
			if((tia.pos.x >= tia.dim.HBLANK)) //Every visible clock - incremement counters, decremement start_counters and incremement graphics counters
			{
				var set_array = [0,0,0,0,0,0];
				var num_set = 0;
				
				/*******PLAYERS*******/
			
				/*Increment the players' main counter*/
				tia.p0.inc(tia.ram[tia.reg.NUSIZ0]&7);
				tia.p1.inc(tia.ram[tia.reg.NUSIZ1]&7);
				
				/*Decrement the players' start counters*/
				if (tia.p0.start_counter >= 0)
					tia.p0.dec_start();
				if (tia.p1.start_counter >= 0)
					tia.p1.dec_start();
				
				
				/*Incremement graphics counters*/
				
				/*Player 0*/
				if (tia.p0.graphics_scan_counter <= 8)
				{
					if ((tia.ram[tia.reg.NUSIZ0]&7) == 5) //For double sized players, every 2 clocks
					{
						if (tia.pos.x%2 == 0)
						{
							tia.p0.inc_graphics();
							// if (tia.p0.start_counter <= 0)
							// {
								// if (++tia.p0.graphics_scan_counter == 4)
									// tia.p0.missle.resetP();
							// }
						}
					}
					else if ((tia.ram[tia.reg.NUSIZ0]&7) == 7) //For quad sized players, every 4 clocks
					{
						if (tia.pos.x%4 == 0)
						{
							tia.p0.inc_graphics();
							// if (tia.p0.start_counter <= 0)
							// {
								// if (++tia.p0.graphics_scan_counter == 4)
									// tia.p0.missle.resetP();
							// }
						}
					}
					else
					{
						tia.p0.inc_graphics(); //For regular players
						// if (tia.p0.start_counter <= 0)
						// {
							// if (++tia.p0.graphics_scan_counter == 4)
								// tia.p0.missle.resetP();
						// }
					}
					
					if (tia.ram[tia.reg.GRP0] && tia.p0.pixel(tia.ram[tia.reg.GRP0], tia.ram[tia.reg.REFP0]&8, tia.ram[tia.reg.VDELP0]&1))
					{
						//color = tia.getColor(tia.reg.COLUP0);
						//set_array[0] = tia.getColor(tia.reg.COLUP0);
						set_array[0] = true;
						num_set++;
					}
				}
					
				/*Player 1*/
				if (tia.p1.graphics_scan_counter <= 8)
				{				
					if ((tia.ram[tia.reg.NUSIZ1]&7) == 5) //For double sized players, every 2 clocks
					{
						if (tia.pos.x%2 == 0)
							tia.p1.inc_graphics();
					}
					else if ((tia.ram[tia.reg.NUSIZ1]&7) == 7) //For quad sized players, every 4 clocks
					{
						if (tia.pos.x%4 == 0)
							tia.p1.inc_graphics();
					}
					else
						tia.p1.inc_graphics();
						
					if (tia.ram[tia.reg.GRP1] && tia.p1.pixel(tia.ram[tia.reg.GRP1], tia.ram[tia.reg.REFP1]&8, tia.ram[tia.reg.VDELP0]&1))
					{	
						set_array[2] = true;
						num_set++;
					}
				}	
					
					
				/*******MISSLES*******/
			
				/*Increment the missles' main counter*/
				tia.m0.inc(tia.ram[tia.reg.NUSIZ0]&7);
				tia.m1.inc(tia.ram[tia.reg.NUSIZ1]&7);
				
				/*Decrement the missles' start counters*/
				if (tia.m0.start_counter > 0)
					tia.m0.dec_start();
				if (tia.m1.start_counter > 0)
					tia.m1.dec_start();
				
				
				/*Incremement graphics counters*/
				
				/*Missle 0*/
				if (tia.m0.graphics_scan_counter <= 1)
				{
					if (((tia.ram[tia.reg.NUSIZ0]>>4)&3) == 0) //For regular missles, 1px
					{
						tia.m0.inc_graphics();
					}
					if (((tia.ram[tia.reg.NUSIZ0]>>4)&3) == 1) //For double sized missles, every 2 clocks
					{
						if (tia.pos.x%2 == 0)
							tia.m0.inc_graphics();
					}
					else if (((tia.ram[tia.reg.NUSIZ0]>>4)&3) == 2) //For quad sized missles, every 4 clocks
					{
						if (tia.pos.x%4 == 0)
							tia.m0.inc_graphics();
					}
					else  //For ccto sized missles, every 8 clocks
					{
						if (tia.pos.x%8 == 0)
							tia.m0.inc_graphics();
					}
					
					if (tia.m0.graphics_scan_counter == 0 && tia.ram[tia.reg.ENAM0]&2)
					{
						set_array[1] = true;
						num_set++;
					}
				}
					
					
				/*Missle 1*/
				if (tia.m1.graphics_scan_counter <= 1)
				{
					if (((tia.ram[tia.reg.NUSIZ1]>>4)&3) == 0) //For regular missles, 1px
					{
						tia.m1.inc_graphics();
					}
					if (((tia.ram[tia.reg.NUSIZ1]>>4)&3) == 1) //For double sized missles, every 2 clocks
					{
						if (tia.pos.x%2 == 0)
							tia.m1.inc_graphics();
					}
					else if (((tia.ram[tia.reg.NUSIZ1]>>4)&3) == 2) //For quad sized missles, every 4 clocks
					{
						if (tia.pos.x%4 == 0)
							tia.m1.inc_graphics();
					}
					else //For ccto sized missles, every 8 clocks
					{
						if (tia.pos.x%8 == 0)
							tia.m1.inc_graphics();
					}
					
					if (tia.m1.graphics_scan_counter == 0 && tia.ram[tia.reg.ENAM1]&2)
					{
						set_array[3] = true;
						num_set++;
					}
				}
					
				
				
				/*******BALL*******/
			
				/*Increment the ball's main counter*/
				tia.bl.inc();
				
				/*Decrement the ball's start counter*/
				if (tia.bl.start_counter > 0)
					tia.bl.dec_start();
				
				
				/*Incremement graphics counter*/
				if (tia.bl.graphics_scan_counter <= 1)
				{
					if (((tia.ram[tia.reg.CTRLPF]>>4)&3) == 0) //For regular sized ball, every clock
					{
							tia.bl.inc_graphics();
					}
					else if (((tia.ram[tia.reg.CTRLPF]>>4)&3) == 1) //For double sized ball, every 2 clocks
					{
						if (tia.pos.x%2 == 0)
							tia.bl.inc_graphics();
					}
					else if (((tia.ram[tia.reg.CTRLPF]>>4)&3) == 2) //For quad sized ball, every 4 clocks
					{
						if (tia.pos.x%4 == 0)
							tia.bl.inc_graphics();
					}
					else   //For octo sized ball, every 8 clocks
					{
						if (tia.pos.x%8 == 0)
							tia.bl.inc_graphics();
					}
					
					if (tia.bl.graphics_scan_counter == 0 && tia.bl.pixel(tia.ram[tia.reg.ENABL]&2, tia.ram[tia.reg.VDELBL]&1))
					{
						set_array[4] = true;
						num_set++;
					}
				}
				
				
				if (tia.pos.y >= tia.dim.TOP && tia.pos.y < tia.dim.BOTTOM-1) //If the position is on the visible screen
				{
					var color = null;
					
					if (tia.ram[tia.reg.VBLANK]&2) //If VBLANK is set
						color = [0x00,0x00,0x00];
					else
					{
						/*Then check the Playingfield*/
						if (tia.pf_current)
						{
							set_array[5] = true;
							num_set++;
						}
						
						
						if (!(tia.ram[tia.reg.CTRLPF]&2))
						{
							if (set_array[0])
								color = tia.getColor(tia.reg.COLUP0);
							else if (set_array[1])
								color = tia.getColor(tia.reg.COLUP0);
							else if (set_array[2])
								color = tia.getColor(tia.reg.COLUP1);
							else if (set_array[3])
								color = tia.getColor(tia.reg.COLUP1);
							else if (set_array[4])
								color = tia.getColor(tia.reg.COLUPF);
							else if (set_array[5])
								color = tia.pf_current;
						}
						else
						{
							if (set_array[5])
								color = tia.pf_current;
							else if (set_array[4])
								color = tia.getColor(tia.reg.COLUPF);
							else if (set_array[0])
								color = tia.getColor(tia.reg.COLUP0);
							else if (set_array[1])
								color = tia.getColor(tia.reg.COLUP0);
							else if (set_array[2])
								color = tia.getColor(tia.reg.COLUP1);
							else if (set_array[3])
								color = tia.getColor(tia.reg.COLUP1);
							
						}
						
						if (num_set >= 2)
							tia.checkCollisions(set_array);
						if (color == null)
							color = tia.getColor(tia.reg.COLUBK);	
					}
					
					if (!tia.debug)
					{
						//debug(color);
						var l = (tia.pos.y - tia.dim.TOP)*tia.canvas.width*4 + (tia.pos.x - tia.dim.HBLANK)*4;
						tia.screen.data[l++] = color[0];
						tia.screen.data[l++] = color[1];
						tia.screen.data[l++] = color[2];
						tia.screen.data[l] = 255;
					}
					else
					{
						tia.context.fillStyle = util.colorString(color);
						tia.context.fillRect((tia.canvas.width/tia.dim.HPICTURE)*(tia.pos.x - tia.dim.HBLANK), (tia.canvas.height/tia.dim.VPICTURE)*(tia.pos.y - tia.dim.TOP), tia.canvas.width/tia.dim.HPICTURE, tia.canvas.height/tia.dim.VPICTURE);
					}
				}
			}
		}
	},
	
	pfBuffer: function()
	{
		var pos = Math.floor((tia.pos.x - tia.dim.HBLANK)/4) + 1; //The next pfCount
		var p = pos;
		//debug(p);
		var set = false;
		/*First half*/
		if (p < 4)
			set = tia.ram[tia.reg.PF0]&(Math.pow(2, 4+p));
		else if ((p-=4) < 8)
		{
			set = tia.ram[tia.reg.PF1]&(Math.pow(2, (7-p)));
		}
		else if ((p-=8) < 8)
			set = tia.ram[tia.reg.PF2]&(Math.pow(2, p));
		
		/*Second Half*/
		else if (!(tia.ram[tia.reg.CTRLPF]&1)) //Duplicated
		{
			if ((p-=8) < 4)
				set = tia.ram[tia.reg.PF0]&(Math.pow(2, 4+p));
			else if ((p-=4) < 8)
				set = tia.ram[tia.reg.PF1]&(Math.pow(2, (7-p)));
			else if ((p-=8) < 8)
				set = tia.ram[tia.reg.PF2]&(Math.pow(2, p));
		}
		else //Reflected
		{
			if ((p-=8) < 8)
				set = tia.ram[tia.reg.PF2]&(Math.pow(2, 7-p));
			else if ((p-=8) < 8)
				set = tia.ram[tia.reg.PF1]&(Math.pow(2, p));
			else if ((p-=8) < 4)
				set = tia.ram[tia.reg.PF0]&(Math.pow(2, 7-p));
		}
		
		if (set)
		{
			if (tia.ram[tia.reg.CTRLPF]&2)
			{
				if (pos <= 19)
				{
					return tia.getColor(tia.reg.COLUP0);
				}
				else
				{
					//debug(p);
					return tia.getColor(tia.reg.COLUP1);
				}
			}
			else
				return tia.getColor(tia.reg.COLUPF);
		}
		else
			return null;
	},
	
	//set_array: [0,0,0,0,0,0],
	
	/*Draw the pixel at x,y*/
	drawPixel: function()
	{
		
		if (tia.pos.x >= tia.dim.HBLANK && tia.pos.x < tia.dim.WIDTH && tia.pos.y >= tia.dim.TOP && tia.pos.y < tia.dim.BOTTOM-1) //If the position is on the visible screen
		{
			var color = null;
			
			if (tia.ram[tia.reg.VBLANK]&2) //If VBLANK is set
				color = [0x00,0x00,0x00];
			else
			{
				//var set_array = [0,0,0,0,0,0];
				var set_array = [0,0,0,0,0,0];
				/*Check p0 first*/
				if (tia.ram[tia.reg.GRP0] && tia.p0.graphics_scan_counter >=0 && tia.p0.graphics_scan_counter < 8 && tia.p0.pixel(tia.ram[tia.reg.GRP0], tia.ram[tia.reg.REFP0]&8, tia.ram[tia.reg.VDELP0]&1))
				{
					//color = tia.getColor(tia.reg.COLUP0);
					set_array[0] = tia.getColor(tia.reg.COLUP0);
				}
				
				/*Check m0*/
				//if (tia.m0.graphics_scan_counter == 0 && tia.m0.pixel(tia.ram[tia.reg.ENAM0]&2))
				if (tia.m0.graphics_scan_counter == 0 && tia.ram[tia.reg.ENAM0]&2)
					set_array[1] = tia.getColor(tia.reg.COLUP0);
					
				/*Then check p1*/
				if (tia.ram[tia.reg.GRP1] && tia.p1.graphics_scan_counter >=0 && tia.p1.graphics_scan_counter < 8 && tia.p1.pixel(tia.ram[tia.reg.GRP1], tia.ram[tia.reg.REFP1]&8, tia.ram[tia.reg.VDELP0]&1))
					set_array[2] = tia.getColor(tia.reg.COLUP1);
					
				/*Check m1*/
				//if (tia.m1.pixel(tia.ram[tia.reg.ENAM1]&2))
				if (tia.m1.graphics_scan_counter == 0 && tia.ram[tia.reg.ENAM1]&2)
					set_array[3] = tia.getColor(tia.reg.COLUP1);
					
				
				/*Check BL*/
				if (tia.bl.graphics_scan_counter == 0 && tia.bl.pixel(tia.ram[tia.reg.ENABL]&2, tia.ram[tia.reg.VDELBL]&1))
					set_array[4] = tia.getColor(tia.reg.COLUPF);
				
				/*Then check the Playingfield*/
				set_array[5] = tia.pf_current;
				
				var p_array = tia.priority;
				if (tia.ram[tia.reg.CTRLPF]&2)
					p_array = tia.priority_alt;
				
				// for (var i = 0; i < set_array.length; i++)
				// {
					// if (set_array[p_array[i]])
					// {
						// color = set_array[p_array[i]];
						// break;
					// }
				// }
				
				if (set_array[p_array[0]])
					color = set_array[p_array[0]];
				else if (set_array[p_array[1]])
					color = set_array[p_array[1]];
				else if (set_array[p_array[2]])
					color = set_array[p_array[2]];
				else if (set_array[p_array[3]])
					color = set_array[p_array[3]];
				else if (set_array[p_array[4]])
					color = set_array[p_array[4]];
				else if (set_array[p_array[5]])
					color = set_array[p_array[5]];
				
				if (color != null)
					tia.checkCollisions(set_array);
				else
					color = tia.getColor(tia.reg.COLUBK);	
			}
			
			if (!tia.debug)
			{
				//debug(color);
				var l = (tia.pos.y - tia.dim.TOP)*tia.canvas.width*4 + (tia.pos.x - tia.dim.HBLANK)*4;
				tia.screen.data[l++] = color[0];
				tia.screen.data[l++] = color[1];
				tia.screen.data[l++] = color[2];
				tia.screen.data[l] = 255;
			}
			else
			{
				tia.context.fillStyle = util.colorString(color);
				tia.context.fillRect((tia.canvas.width/tia.dim.HPICTURE)*(tia.pos.x - tia.dim.HBLANK), (tia.canvas.height/tia.dim.VPICTURE)*(tia.pos.y - tia.dim.TOP), tia.canvas.width/tia.dim.HPICTURE, tia.canvas.height/tia.dim.VPICTURE);
			}
		}
		
		//document.getElementById("xy").innerHTML = tia.pos.x + "," + tia.pos.y + ", color = " + tia.ram[tia.reg.COLUBK] + ", p0 = " + tia.p0 + ", GRP0 = " + tia.ram[tia.reg.GRP0];
		
		if (tia.debug)
		{
			//debug(tia.pos.x + "," + tia.pos.y + ", color: " + tia.ram[tia.reg.COLUBK]);
			document.getElementById("xy").innerHTML = tia.pos.x + "," + tia.pos.y + ", color = " + tia.ram[tia.reg.COLUBK] + ", p0 = " + tia.p0 + ", GRP0 = " + tia.ram[tia.reg.GRP0];
			document.getElementById("pf0").innerHTML = tia.ram[tia.reg.PF0].toString(2);
			document.getElementById("pf1").innerHTML = tia.ram[tia.reg.PF1].toString(2);
			document.getElementById("pf2").innerHTML = tia.ram[tia.reg.PF2].toString(2);
		}
	},
	
	checkCollisions: function(a)
	{
		tia.ram[tia.reg.CXM0P] |= (((a[1]&&a[2])<<7) + ((a[1]&&a[0])<<6)); 
		tia.ram[tia.reg.CXM1P] |= (((a[3]&&a[0])<<7) + ((a[3]&&a[2])<<6)); 
		tia.ram[tia.reg.CXP0FB] |= (((a[0]&&a[5])<<7) + ((a[0]&&a[4])<<6)); 
		tia.ram[tia.reg.CXP1FB] |= (((a[2]&&a[5])<<7) + ((a[2]&&a[4])<<6)); 
		tia.ram[tia.reg.CXM0FB] |= (((a[1]&&a[5])<<7) + ((a[1]&&a[4])<<6)); 
		tia.ram[tia.reg.CXM1FB] |= (((a[3]&&a[5])<<7) + ((a[3]&&a[4])<<6)); 
		tia.ram[tia.reg.CXBLPF] |= ((a[4]&&a[5])<<7); 
		tia.ram[tia.reg.CXPPMM] |= (((a[0]&&a[2])<<7) + ((a[1]&&a[3])<<6)); 
		tia.ram_changed = true;
	},

	
	step: function()
	{
		
		//tia.drawPixel();
		tia.updatePos();
		if (tia.ram_changed)
		{
			tia.sync_ram();
			tia.ram_changed = false;
		}
	},
	
	sync: function()
	{	
		if (tia.write >= 0)
		{
			
			if (tia.write in tia.strobe_reg) //if a strobe was written to
			{
				try
				{
					tia.strobe_reg[tia.write]();
				}
				catch(e){debug(e);}
			}
			
			else if (tia.write == tia.reg.GRP0) //if GRP0 was written to, move GRP1 to p1.old
				tia.p1.old = tia.ram[tia.reg.GRP1];
				
			else if (tia.write == tia.reg.GRP1) //if GRP1 was written to, move GRP0 to p0.old and move ENABL to something or another
			{
				tia.p0.old = tia.ram[tia.reg.GRP0];
				
				//TODO: ENABL
			}
				
			
			tia.ram[tia.write] = mmu.tia[tia.write];
				
			tia.write = -1;
		}
	},
	
	sync_ram: function()
	{
		for (var i = 0x30; i <= 0x3D; i++)
		{
			mmu.tia[i] = tia.ram[i];
		}
	},
	
	
	priority: [0, 1, 2, 3, 4, 5], 
	pirority_alt: [5, 4, 0, 1, 2, 3],
	
	color_rgb:
	[
		[
			[0x0, 0x0, 0x0],
			[0x44, 0x44, 0x0],
			[0x70, 0x28, 0x0],
			[0x84, 0x18, 0x0],
			[0x88, 0x0, 0x0],
			[0x78, 0x0, 0x5c],
			[0x48, 0x0, 0x78],
			[0x14, 0x0, 0x84],
			[0x0, 0x0, 0x88],
			[0x0, 0x18, 0x7c],
			[0x0, 0x2c, 0x5c],
			[0x0, 0x3c, 0x2c],
			[0x0, 0x3c, 0x0],
			[0x14, 0x38, 0x0],
			[0x2c, 0x30, 0x0],
			[0x44, 0x28, 0x0]
		],

		[
			[0x40, 0x40, 0x40],
			[0x64, 0x64, 0x10],
			[0x84, 0x44, 0x14],
			[0x98, 0x34, 0x18],
			[0x9c, 0x20, 0x20],
			[0x8c, 0x20, 0x74],
			[0x60, 0x20, 0x90],
			[0x30, 0x20, 0x98],
			[0x1c, 0x20, 0x9c],
			[0x1c, 0x38, 0x9c],
			[0x1c, 0x4c, 0x78],
			[0x1c, 0x5c, 0x48],
			[0x20, 0x5c, 0x20],
			[0x34, 0x5c, 0x1c],
			[0x4c, 0x50, 0x1c],
			[0x64, 0x48, 0x18]
		],

		[
			[0x6c, 0x6c, 0x6c],
			[0x84, 0x84, 0x24],
			[0x98, 0x5c, 0x28],
			[0xac, 0x50, 0x30],
			[0xb0, 0x3c, 0x3c],
			[0xa0, 0x3c, 0x88],
			[0x78, 0x3c, 0xa4],
			[0x4c, 0x3c, 0xac],
			[0x38, 0x40, 0xb0],
			[0x38, 0x54, 0xab],
			[0x38, 0x68, 0x90],
			[0x38, 0x7c, 0x64],
			[0x40, 0x7c, 0x40],
			[0x50, 0x7c, 0x38],
			[0x68, 0x70, 0x34],
			[0x84, 0x68, 0x30]
		],

		[
			[0x90, 0x90, 0x90],
			[0xa0, 0xa0, 0x34],
			[0xac, 0x78, 0x3c],
			[0xc0, 0x68, 0x48],
			[0xc0, 0x58, 0x58],
			[0xb0, 0x58, 0x9c],
			[0x8c, 0x58, 0xb8],
			[0x68, 0x58, 0xc0],
			[0x50, 0x5c, 0xc0],
			[0x50, 0x70, 0xbc],
			[0x50, 0x84, 0xac],
			[0x50, 0x9c, 0x80],
			[0x5c, 0x9c, 0x5c],
			[0x6c, 0x98, 0x50],
			[0x84, 0x8c, 0x4c],
			[0xa0, 0x84, 0x44]
		],

		[
			[0xb0, 0xb0, 0xb0],
			[0xb8, 0xb8, 0x40],
			[0xbc, 0x8c, 0x4c],
			[0xd0, 0x80, 0x5c],
			[0xd0, 0x70, 0x70],
			[0xc0, 0x70, 0xb0],
			[0xa0, 0x70, 0xb0],
			[0x7c, 0x70, 0xd0],
			[0x68, 0x74, 0xd0],
			[0x68, 0x88, 0xcc],
			[0x68, 0x9c, 0xc0],
			[0x68, 0xb4, 0x94],
			[0x74, 0xb4, 0x74],
			[0x84, 0xb4, 0x68],
			[0x9c, 0xa8, 0x64],
			[0xb8, 0x9c, 0x58]
		],

		[
			[0xc8, 0xc8, 0xc8],
			[0xd0, 0xd0, 0x50],
			[0xcc, 0xa0, 0x5c],
			[0xe0, 0x94, 0x70],
			[0xe0, 0x88, 0x88],
			[0xd0, 0x84, 0xc0],
			[0xb4, 0x84, 0xdc],
			[0x94, 0x88, 0xe0],
			[0x7c, 0x8c, 0xe0],
			[0x7c, 0x9c, 0xdc],
			[0x7c, 0xb4, 0xd4],
			[0x7c, 0xd0, 0xac],
			[0x8c, 0xd0, 0x8c],
			[0x9c, 0xcc, 0x7c],
			[0xb4, 0xc0, 0x78],
			[0xd0, 0xb4, 0x6c]
		],

		[
			[0xdc, 0xdc, 0xdc],
			[0xe8, 0xe8, 0x5c],
			[0xdc, 0xb4, 0x68],
			[0xec, 0xa8, 0x80],
			[0xec, 0xa0, 0xa0],
			[0xdc, 0x9c, 0xd0],
			[0xc4, 0x9c, 0xec],
			[0xa8, 0xa0, 0xec],
			[0x90, 0xa4, 0xec],
			[0x90, 0xb4, 0xec],
			[0x90, 0xcc, 0xe8],
			[0x90, 0xe4, 0xc0],
			[0xa4, 0xe4, 0xa4],
			[0xb4, 0xe4, 0x90],
			[0xcc, 0xd4, 0x88],
			[0xe8, 0xcc, 0x7c]
		],

		[
			[0xec, 0xec, 0xec],
			[0xfc, 0xfc, 0x68],
			[0xec, 0xc8, 0x78],
			[0xfc, 0xbc, 0x94],
			[0xfc, 0xbc, 0x94],
			[0xfc, 0xb4, 0xb4],
			[0xec, 0xb0, 0xe0],
			[0xd4, 0xb0, 0xfc],
			[0xbc, 0xb4, 0xfc],
			[0xa4, 0xb8, 0xfc],
			[0xa4, 0xc8, 0xfc],
			[0xa4, 0xe0, 0xfc],
			[0xa4, 0xfc, 0xd4],
			[0xb8, 0xfc, 0xb8],
			[0xc8, 0xfc, 0xa4],
			[0xe0, 0xec, 0x9c],
			[0xe0, 0xec, 0x9c]
		]
	]
};

tia.strobe_reg = 
{
	0x02 : tia.strobes.WSYNC, 
	0x03 : tia.strobes.RYSNC, 
	0x10 : tia.strobes.RESP0, 
	0x11 : tia.strobes.RESP1, 
	0x12 : tia.strobes.RESM0, 
	0x13 : tia.strobes.RESM1,
	0x14 : tia.strobes.RESBL,
	0x2A : tia.strobes.HMOVE, 
	0x2B : tia.strobes.HMCLR, 
	0x2C : tia.strobes.CXCLR
};