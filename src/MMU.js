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

mmu = 
{
	debug: false,

	//Where the memory is stored
	memory: new ArrayBuffer(0x10000),
	
	
	/*views for each segment of memory*/
	ram: null,
	rom: null,
	
	tia: null,
	tia_write: null,
	tia_read: null,
	
	pia: null,
	pia_write: null,
	pia_read: null,
	
	/*Memory Locations and Sizes*/
	ram_start: 0x80, //128 bytes, located from 0x80 to 0xFF.  Stack starts at 0xFF, down
	ram_size:  0x80,
	ram_end:   0xff,
	
	rom_start: 0xf000, //ROM start location
	rom_size:  0x1000, //4kb
	rom_end:   0xffff,
	
	rom_brk: 0xf000, //ROM break point
	rom_reset: 0xf000, //ROM reset point
	
	tia_write_start: 0x0,
	tia_write_size:  0x2d,
	tia_write_end:   0x2c,
	
	tia_read_start:  0x30,
	tia_read_size:  0xe,
	tia_read_end:   0x3d,
	
	pia_size: 0x18,
	
	pia_read_start: 0x280,
	pia_read_size: 0x5,
	pia_read_end: 0x284,
	
	pia_write_start: 0x294,
	pia_write_size: 0x4,
	pia_write_end: 0x297,
	
	/*Read/Write*/
	r: function(a) 
	{
		//debug(a.toString(16));
		if ((a%0x2000) < 0x1000)
		{
			a &= 0xfff;
			//debug("hi");
		}
		else
			a = 0xf000 + (a&0xfff);
			
		//debug(a.toString(16));
		
		if (a <= mmu.tia_read_end)
		{
			if(a >= mmu.tia_read_start)
				a -= mmu.tia_read_start; //Hack for TIA read registers.  
				
			return mmu.tia_read[a];
		}
		else if (a >= mmu.ram_start && a <= mmu.ram_end)
			return mmu.ram[a-mmu.ram_start];
		else if (a >= mmu.pia_read_start && a <= mmu.pia_read_end)
		{
			return mmu.pia_read[a - mmu.pia_read_start];
		}
		else if (a >= mmu.rom_start && a <= mmu.rom_end)
			return mmu.rom[a-mmu.rom_start];
		else if (mmu.debug)
			debug("Trying to read from memory address " + a + " - Denied");
	},
	w: function(a, v)
	{
		v = v&255;
		
		if (a <= mmu.tia_write_end)
		{
			/*if (tia.filterStrobe(a))
				return;

			if (a == tia.reg.GRP0)
				tia.p1.write = true;*/
			//tia.write(a) = true;
			tia.write = a;
				
			mmu.tia_write[a] = v&255;
			
			//if (a == 2)
			//	cpu.paused = true;
			
			if (a == tia.reg.HMP0 || a == tia.reg.HMP1 || a == tia.reg.GRP0)
			{
				//debug("Writing " + v.toString(2) + " to " + a.toString(16));
			}
		}
		else if (a >= mmu.ram_start && a <= mmu.ram_end)
			mmu.ram[a-mmu.ram_start] = v;
		else if (a >= mmu.pia_write_start && a <= mmu.pia_write_end)
		{
			pia.write = a - mmu.pia_read_start;
			mmu.pia_write[a - mmu.pia_write_start] = v&255;
		}
		else if (mmu.debug)
			debug("Trying to write to memory address " + a + " - Denied");
	},
	
	/*Stack*/
	stackPush:     function(v) {mmu.ram[cpu.r.s - mmu.ram_start] = v&255; cpu.r.s = (cpu.r.s - 1)&255;},
	stackPushWord: function(v) {mmu.stackPush(v>>8); mmu.stackPush(v);},
	stackPop: 	   function()  {var v = mmu.ram[cpu.r.s - mmu.ram_start + 1]; cpu.r.s = (cpu.r.s + 1)&255; return v;},
	stackPopWord:  function()  {return (mmu.stackPop() + (mmu.stackPop() << 8));},
	
	/*ROM*/
	readByte: function() 
	{
		var a = cpu.r.pc++;
		if (!(a%0x2000) < 0x1000)
		{
			a = 0xf000 + (a&0xfff);
		}
			
		return mmu.rom[a - mmu.rom_start];
	},
	readWord: function()
	{
		var lowBit = mmu.rom[cpu.r.pc++ - mmu.rom_start];
		var highBit = mmu.rom[cpu.r.pc++ - mmu.rom_start];
		var total = lowBit + (highBit << 8);
		//debug(lowBit + ", " + highBit + " = " + total);
		return total;
	},
	
	loadRom: function(file)
	{
		var b = new BinFileReader(file); 
		var rom = b.readString(b.getFileSize(), 0);
		
		for (var i = 0; i < rom.length; i++)
		{
			mmu.rom[i] = rom.charCodeAt(i);
		}
		
		var lowBit = mmu.rom[rom.length-4];
		var highBit = mmu.rom[rom.length-3];
		mmu.rom_reset = lowBit + (highBit << 8);
		
		lowBit = mmu.rom[rom.length-2];
		highBit = mmu.rom[rom.length-1];
		mmu.rom_brk = lowBit + (highBit << 8);
		
		//debug(lowBit + ", " + highBit + " = " + mmu.org);
	},
	
	__init__: function(file, debug)
	{
		mmu.ram = new Uint8Array(mmu.memory, mmu.ram_start, mmu.ram_size);
		mmu.rom = new Uint8Array(mmu.memory, mmu.rom_start, mmu.rom_size);
		
		mmu.tia = new Uint8Array(mmu.memory, mmu.tia_write_start, mmu.tia_read_end);
		mmu.tia_write = new Uint8Array(mmu.memory, mmu.tia_write_start, mmu.tia_write_size);
		mmu.tia_read = new Uint8Array(mmu.memory, mmu.tia_read_start, mmu.tia_read_size);
		
		mmu.pia = new Uint8Array(mmu.memory, mmu.pia_read_start, mmu.pia_size);
		mmu.pia_write = new Uint8Array(mmu.memory, mmu.pia_write_start, mmu.pia_write_size);
		mmu.pia_read = new Uint8Array(mmu.memory, mmu.pia_read_start, mmu.pia_read_size);
		mmu.loadRom(file);
		
		mmu.debug = debug;
	},
	
	/*Reset*/
	//reset: function() {mmu.ram = []; mmu.rom = "";}
};
		