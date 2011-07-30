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

cpu = 
{
	running: false,
	paused: false,
	counter: 0,
	debug: false,
	auto: true,
	cc: 0, //Number of cycles for the current operation
	
	highest:0,
	
	/*Registers*/
	r: 
	{
		a:0,	//Accumulator
		x:0, 	//General Purpose, X
		y:0, 	//General Purpose, Y
		s:0xff, 	//Stack Pointer
		p:0,		//Flag (7) |N(Negative)|V(Overflow)|(empty)|B(Break Command)|D(Decimal Mode)|I(IRQ Disable)|Z(Zero)|C(Carry| (0)
		pc: 0	//Program Counter
	},
	
	__init__: function(debug, auto)
	{
		cpu.reset();
		cpu.debug = debug;
		cpu.auto = auto;
	},
	
	start: function(debug, auto)
	{
		cpu.__init__(debug, auto);
		cpu.running = true;
		if (cpu.auto)
			cpu.loop();
	},
	
	/*Reset the CPU*/
	reset: function()
	{
		cpu.r.a = cpu.r.x = cpu.r.y = cpu.r.p = 0;
		cpu.r.pc = mmu.rom_start;
		cpu.r.s = 0xff;
	},
	
	step: function()
	{
		cpu.cc = 0;
		if (!cpu.paused)
		{
			if (cpu.r.pc > 0xffff || isNaN(cpu.r.pc) )
			{
				if (cpu.debug)
					debug("Program Counter Error: " + cpu.r.pc);
				return;
			}
				
			var b = mmu.readByte();
			
			if (cpu.debug)
			{
				debug((cpu.r.pc - 1).toString(16));
				debug((cpu.r.pc - 1).toString(16) + " - " + b.toString(16) + " - " + cpu.map[b]);
			}
			
			try
			{
				cpu.map[b]();
			}
			catch(e)
			{
				debug((cpu.r.pc - 1).toString(16));
				debug((cpu.r.pc - 1).toString(16) + " - " + b.toString(16) + " - " + cpu.map[b]);
				debug(e);
				cpu.running = false;
				return;
			}
				
			
			if (cpu.debug)
			{
				debug("cycles = " + cpu.cc);
			}

			for (var i = 0; i < cpu.cc*3; i++)
			{
				tia.step();
				if (i%3 == 0)
					pia.step();
			}
			
			cpu.counter += cpu.cc;

			tia.sync();
			pia.sync();
		}
		else
		{
			while (cpu.paused)
			{
				cpu.counter++;
				//tia.drawPixel();
				//tia.updatePos();
				//tia.drawPixel();
				//tia.step();
				//tia.step();
				tia.step();
				if (cpu.counter%3 == 0)
					pia.step();
				
			}
		}
	},
	
	manStep: function(num)
	{
		for (var j = 0; j < num; j++)
		{
			cpu.step();
		}
	},
	
	/*Main Loop*/
	loop: function()
	{
		while(cpu.running)
		{
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			cpu.step();
			if (cpu.counter > 262*78)
			//if (cpu.counter > 1000)
			{
				//debug("over 1000");
				//return;
				cpu.counter = 0;
				setTimeout("cpu.loop()", 5);
				return;
			}
		}
	},
	
	/*Helper Functions*/
	f:
	{
		/*Flag Register*/
		//N - Negative - Set if bit 7 of A is set
		//V - Overflow - Set if two positive numbers add over 127 or two negatives to less than -128
		//B - Brk Command - set if interrupt by BRK, reset if external
		//D - Decimal Mode - set if decimal mode is active.
		//I - IRQ disable - set if maskable interrupts are disabled
		//Z - Zero - set if the last operation resulted in zero
		//C - Carry - set if the add produced a carry, or the subtraction produced a borrow. Holds bits after a shift.
		
		C_r: function() {return util.D0_r(cpu.r.p);},
		Z_r: function() {return util.D1_r(cpu.r.p);},
		I_r: function() {return util.D2_r(cpu.r.p);}, 
		D_r: function() {return util.D3_r(cpu.r.p);}, 
		B_r: function() {return util.D4_r(cpu.r.p);}, 
		V_r: function() {return util.D6_r(cpu.r.p);}, 
		N_r: function() {return util.D7_r(cpu.r.p);},

		C_w: function(v) {return (cpu.r.p = util.D0_w(cpu.r.p, v));},
		Z_w: function(v) {return (cpu.r.p = util.D1_w(cpu.r.p, v));},
		I_w: function(v) {return (cpu.r.p = util.D2_w(cpu.r.p, v));}, 
		D_w: function(v) {return (cpu.r.p = util.D3_w(cpu.r.p, v));}, 
		B_w: function(v) {return (cpu.r.p = util.D4_w(cpu.r.p, v));}, 
		V_w: function(v) {return (cpu.r.p = util.D6_w(cpu.r.p, v));}, 
		N_w: function(v) {return (cpu.r.p = util.D7_w(cpu.r.p, v));},
		
		NEG: function(v) {cpu.f.N_w(util.D7_r(v));}, //Set the N flag to have the same value as the D7 bit of v
		CHK_ZN: function(v) {cpu.f.Z_w((v == 0)); cpu.f.NEG(v);}, //Do a standard check of Z and N, setting Z if the value is zero and N to D7 of v

		/*Addressing*/
		/*
			im - immediate, #AA
			z - zero page, AA
			zx - zero page indexed x, AA + X
			xy - zero page indexed y, AA + Y
			a - absolute, AAAA
			ax - absolute indexed x, AAAA + X
			ay - absolute indexed y, AAAA + Y
			i - indirect, (AAAA)
			ix - indirect indexed x, (AA + X + 1)(AA + X) //The first value represents the high bits if the place to read, the second represents the low bits.  It makes up one address to read.
			iy - indirect indexed y, (AA + 1)(AA) + Y
		*/
		
		/*Addresses*/
		z_a:  function() {return mmu.readByte();},
		zx_a: function() 
		{
			//return (mmu.readByte() + cpu.r.x)&255;
			var a = mmu.readByte();
			return (a + cpu.r.x)&255;
		},
		zy_a: function() {return (mmu.readByte() + cpu.r.y)&255;},
		a_a:  function() {return mmu.readWord();},
		ax_a: function() {var o = mmu.readWord();  var a = o + cpu.r.x; if(Math.floor(o/256) != Math.floor(a/256)) cpu.cc++; return a;},
		ay_a: function() {var o = mmu.readWord();  var a = o + cpu.r.y; if(Math.floor(o/256) != Math.floor(a/256)) cpu.cc++; return a;},
		i_a:  function() //Only used by JMP
		{
			var i = mmu.readWord(); 
			if ((i&0xff) == 0xff) //At the end of a page
				var j = i + 2; //Bug in 650X where indirect JMP will load the high byte from the beginning of the page if the address is the end XXFF
			else
				var j = i + 1;
				
			return (mmu.r(i) + (mmu.r(j) << 8)); },
		ix_a: function() {var i = mmu.readByte() + cpu.r.x; return (mmu.r(i) + (mmu.r(i + 1) << 8));},
		iy_a: function() 
		{
			var i = mmu.readByte(); 
			var o = (mmu.r(i) + (mmu.r(i + 1) << 8));
			var a = o + cpu.r.y; 
			if(Math.floor(o/256) != Math.floor(a/256)) 
				cpu.cc++;
			//debug((mmu.r(i+1)<<8).toString(16) + ", " + mmu.r(i).toString(16) + " = " + a.toString(16));
			return a;
		},
		
		/*Values*/
		im: function() {return mmu.readByte();},
		z:  function() {return mmu.r(cpu.f.z_a());},
		zx: function() {return mmu.r(cpu.f.zx_a());},
		zy: function() {return mmu.r(cpu.f.zy_a());},
		a:  function() {return mmu.r(cpu.f.a_a());},
		ax: function() {return mmu.r(cpu.f.ax_a());},
		ay: function() {return mmu.r(cpu.f.ay_a());},
		i:  function() {return mmu.r(cpu.f.i_a());},
		ix: function() {return mmu.r(cpu.f.ix_a());},
		iy: function() {return mmu.r(cpu.f.iy_a());},
		
		
	},
	
	/*Operators*/
	op: 
	{
		/*
			_    - implied
			_im  - immediate/implied
			_z   - zero page
			_zx  - zero page indexed x
			_zy  - zero page indexed y
			_a   - absolute
			_ax  - absolute indexed x
			_ay  - absolute indexed y
			_i   - indirect
			_ix  - indirect indexed x
			_iy  - indirect indexed y
			_rel - relative
		*/
		
		/*Add to Accumulator with Carry*/
		ADC: function(v)
		{
			if (cpu.f.D_r())
			{
				/*Decimal Mode*/
				
				var v1 = cpu.r.a;
				var v2 = v;
				
				var d1 = util.fromBCD(v1);
				var d2 = util.fromBCD(v2);
				
				r = d1 + d2 + cpu.f.C_r();
				
				cpu.r.a = util.toBCD(Math.abs(r)%100); // Store value up to 99
				cpu.f.C_w((r > 99)); //Carry Flag
			}
			else
			{
				var v1 = cpu.r.a;
				var v2 = v;
				cpu.r.a = v1 + v2 + cpu.f.C_r(); //Addition
				

				cpu.f.C_w((cpu.r.a > 255)); //Carry	
				cpu.r.a &= 255; //Mask to 8 bits
			}
			
			cpu.f.CHK_ZN(cpu.r.a);
			cpu.f.V_w((v1 <= 127 && v2 <= 127 && cpu.r.a > 127) || (v1 >= 128 && v2 >= 128 && cpu.r.a < 128)); //Overflow
		},
		ADC_im:	function() {cpu.op.ADC(cpu.f.im()); cpu.cc =  2;},
		ADC_z: 	function() {cpu.op.ADC(cpu.f.z());  cpu.cc =  3;},
		ADC_zx: function() {cpu.op.ADC(cpu.f.zx()); cpu.cc =  4;},
		ADC_a: 	function() {cpu.op.ADC(cpu.f.a());  cpu.cc =  4;},
		ADC_ax: function() {cpu.op.ADC(cpu.f.ax()); cpu.cc += 4;},
		ADC_ay: function() {cpu.op.ADC(cpu.f.ay()); cpu.cc += 4;},
		ADC_ix: function() {cpu.op.ADC(cpu.f.ix()); cpu.cc =  6;},
		ADC_iy: function() {cpu.op.ADC(cpu.f.iy()); cpu.cc += 5;},
		
		
		/*And memory with Accumulator*/
		AND: function(v)
		{
			cpu.r.a = (cpu.r.a & v)&255; //AND A with V
			cpu.f.CHK_ZN(cpu.r.a);
		},
		AND_im:	function() {cpu.op.AND(cpu.f.im()); cpu.cc =  2;},
		AND_z: 	function() {cpu.op.AND(cpu.f.z());  cpu.cc =  3;},
		AND_zx: function() {cpu.op.AND(cpu.f.zx()); cpu.cc =  4;},
		AND_a: 	function() {cpu.op.AND(cpu.f.a());  cpu.cc =  4;},
		AND_ax: function() {cpu.op.AND(cpu.f.ax()); cpu.cc += 4;},
		AND_ay: function() {cpu.op.AND(cpu.f.ay()); cpu.cc += 4;},
		AND_ix: function() {cpu.op.AND(cpu.f.ix()); cpu.cc =  6;},
		AND_iy: function() {cpu.op.AND(cpu.f.iy()); cpu.cc += 5;},
		
		
		/*Shift Left One Bit*/
		ASL: function(a)
		{
			//debug("hi" + a);
			if (a == "a") //If it is the accumulator
			{
				v = cpu.r.a << 1;
				cpu.r.a = v&255;
			}
			else //Else operate on memory address 'a'
			{
				v = mmu.r(a) << 1;
				mmu.w(a, v);
			}
			
			cpu.f.C_w((v > 255)); //Carry
			cpu.f.CHK_ZN(v&255);
		},
		ASL_im: function() {cpu.op.ASL("a");          cpu.cc = 2;},
		ASL_z:  function() {cpu.op.ASL(cpu.f.z_a());  cpu.cc = 5;},
		ASL_zx: function() {cpu.op.ASL(cpu.f.zx_a()); cpu.cc = 6;},
		ASL_a:  function() {cpu.op.ASL(cpu.f.a_a());  cpu.cc = 6;},
		ASL_ax: function() {cpu.op.ASL(cpu.f.ax_a()); cpu.cc = 7;},
		
		
		/*Branch*/
		BR: function(b) 
		{
			cpu.cc = 2;
			var d = cpu.f.im(); 
			if(b)
			{ 
				var o = cpu.r.pc; 
				cpu.r.pc += util.decimal(d); 
				if (Math.floor(o/256) == Math.floor(cpu.r.pc/256)) //Check if Page boundry was crossed
					cpu.cc+=1; //If not
				else
					cpu.cc+=2; //If it was
			} 
		},
		
		/*Branch On Carry Clear*/
		BCC_rel: function() {cpu.op.BR(!cpu.f.C_r());}, 
		
		/*Branch On Carry Set*/
		BCS_rel: function() {cpu.op.BR(cpu.f.C_r());},
		
		/*Branch On Zero (Branch If Equal)*/
		BEQ_rel: function() {cpu.op.BR(cpu.f.Z_r());},
		
		/*Branch On Minus*/
		BMI_rel: function() {cpu.op.BR(cpu.f.N_r());},
		
		/*Branch On Anything But Zero (Branch If Not Equal)*/
		BNE_rel: function() {cpu.op.BR(!cpu.f.Z_r());},
		
		/*Branch On Plus*/
		BPL_rel: function() {cpu.op.BR(!cpu.f.N_r());},
		
		/*Branch On Overflow Clear*/
		BVC_rel: function() {cpu.op.BR(!cpu.f.V_r());},
		
		/*Branch On Overflow Set*/
		BVS_rel: function() {cpu.op.BR(cpu.f.V_r());},
		
		
		/*Test Bits In Memory Against Accumulator*/
		BIT: function(v)
		{
			//debug("BITTING " + cpu.r.a + " & " + v);
			cpu.f.Z_w(!(cpu.r.a&v)); //Zero
			//debug(cpu.f.Z_r());
			cpu.f.N_w(util.D7_r(v)); //Set N to be the same as bit 7 of v
			cpu.f.V_w(util.D6_r(v)); //Set V to be the same as bit 6 of v	
		},
		BIT_z: function() {cpu.op.BIT(cpu.f.z()); cpu.cc = 3;},
		BIT_a: function() {cpu.op.BIT(cpu.f.a()); cpu.cc = 4;},
		
		
		/*Break*/
		BRK_im: function() 
		{
			cpu.f.B_r(1); //Set the BRK flag
			mmu.stackPushWord(cpu.r.pc+1); //Push the PC to the stack
			mmu.stackPush(cpu.r.p); //Push the flag register to the stack
			cpu.f.I_w(1); //Set the IRQ Disable Flag
			cpu.r.pc = mmu.rom_brk;
			cpu.cc = 7;
		},
		
		
		/*Clear Carry Flag*/
		CLC_im: function() {cpu.f.C_w(0); cpu.cc = 2;},
		
		/*Clear Decimal Mode*/
		CLD_im: function() {cpu.f.D_w(0); cpu.cc = 2;},
		
		/*Clear Interrupt Disable Bit*/
		CLI_im: function() {cpu.f.I_w(0); cpu.cc = 2;},
		
		/*Clear Overflow Flag*/
		CLV_im: function() {cpu.f.V_w(0); cpu.cc = 2;},
		
		
		/*Compare*/
		CP: function(r, v)
		{
			cpu.f.Z_w(((r - v) == 0)); //Zero if Equal
				
			cpu.f.C_w((v <= r)); //Carry if r < v
				
			cpu.f.N_w(util.D7_r(v)); // Set N to be bit 7 of v
		},
		
		/*Compare Memory And Accumulator*/
		CMP:    function(v) {cpu.op.CP(cpu.r.a, v);},
		CMP_im: function()  {cpu.op.CMP(cpu.f.im()); cpu.cc = 2;},
		CMP_z:  function()  {cpu.op.CMP(cpu.f.z());  cpu.cc = 3;},
		CMP_zx: function()  {cpu.op.CMP(cpu.f.zx()); cpu.cc = 4;},
		CMP_a:  function()  {cpu.op.CMP(cpu.f.a());  cpu.cc = 4;},
		CMP_ax: function()  {cpu.op.CMP(cpu.f.ax()); cpu.cc+= 4;},
		CMP_ay: function()  {cpu.op.CMP(cpu.f.ay()); cpu.cc+= 4;},
		CMP_ix: function()  {cpu.op.CMP(cpu.f.ix()); cpu.cc = 6;},
		CMP_iy: function()  {cpu.op.CMP(cpu.f.iy()); cpu.cc+= 5;},
			
		/*Compare Memory Against X Register*/
		CPX:    function(v) {cpu.op.CP(cpu.r.x, v);},
		CPX_im: function()  {cpu.op.CPX(cpu.f.im()); cpu.cc = 2;},
		CPX_z:  function()  {cpu.op.CPX(cpu.f.z());  cpu.cc = 3;},
		CPX_a:  function()  {cpu.op.CPX(cpu.f.a());  cpu.cc = 4;},
		
		/*Compare Memory Against X Register*/
		CPY:    function(v) {cpu.op.CP(cpu.r.y, v);},
		CPY_im: function()  {cpu.op.CPY(cpu.f.im()); cpu.cc = 2;},
		CPY_z:  function()  {cpu.op.CPY(cpu.f.z());  cpu.cc = 3;},
		CPY_a:  function()  {cpu.op.CPY(cpu.f.a());  cpu.cc = 4;},
		
		
		/*Decrement Memory By One*/
		DEC: function(a) 
		{
			var v = (mmu.r(a)-1)&255; 
			mmu.w(a, v);
			cpu.f.CHK_ZN(v);
		},
		DEC_z:  function() {cpu.op.DEC(cpu.f.z_a()); cpu.cc = 5;},
		DEC_zx: function() {cpu.op.DEC(cpu.f.zx_a()); cpu.cc = 6;},
		DEC_a:  function() {cpu.op.DEC(cpu.f.a_a());  cpu.cc = 6;},
		DEC_ax: function() {cpu.op.DEC(cpu.f.ax_a()); cpu.cc = 7;},
		
		/*Decrement X Register*/
		DEX_im: function()
		{
			cpu.r.x = (cpu.r.x-1)&255;
			cpu.f.CHK_ZN(cpu.r.x);
			cpu.cc = 2;
		},
		
		/*Decrement Y Register*/
		DEY_im: function()
		{
			cpu.r.y = (cpu.r.y-1)&255;
			cpu.f.CHK_ZN(cpu.r.y);
			cpu.cc = 2;
		},
		
		/*Exclusive-Or Memory With Accumulator*/
		EOR: function(v)
		{
			cpu.r.a ^= v;
			cpu.f.CHK_ZN(cpu.r.a);
		},
		EOR_im: function() {cpu.op.EOR(cpu.f.im()); cpu.cc = 2;},
		EOR_z:  function() {cpu.op.EOR(cpu.f.z());  cpu.cc = 3;},
		EOR_zx: function() {cpu.op.EOR(cpu.f.zx()); cpu.cc = 4;},
		EOR_a:  function() {cpu.op.EOR(cpu.f.a());  cpu.cc = 4;},
		EOR_ax: function() {cpu.op.EOR(cpu.f.ax()); cpu.cc += 4;},
		EOR_ay: function() {cpu.op.EOR(cpu.f.ay()); cpu.cc += 4;},
		EOR_ix: function() {cpu.op.EOR(cpu.f.ix()); cpu.cc = 6;},
		EOR_iy: function() {cpu.op.EOR(cpu.f.iy()); cpu.cc += 5;},
		
		
		/*Increment Memory By One*/
		INC: function(a) 
		{
			var v = (mmu.r(a)+1)&255; 
			mmu.w(a, v); 
			cpu.f.CHK_ZN(v);
		},
		INC_z:  function() {cpu.op.INC(cpu.f.z_a());  cpu.cc = 5;},
		INC_zx: function() {cpu.op.INC(cpu.f.zx_a()); cpu.cc = 6;},
		INC_a:  function() {cpu.op.INC(cpu.f.a_a());  cpu.cc = 6;},
		INC_ax: function() {cpu.op.INC(cpu.f.ax_a()); cpu.cc = 7;},
		
		/*Increment X Register*/
		INX_im: function()
		{
			cpu.r.x = (cpu.r.x+1)&255;
			cpu.f.CHK_ZN(cpu.r.x);
			cpu.cc = 2;
		},
		
		/*Increment Y Register*/
		INY_im: function()
		{
			cpu.r.y = (cpu.r.y+1)&255;
			cpu.f.CHK_ZN(cpu.r.y);
			cpu.cc = 2;
		},
		
		
		/*Jump*/
		JMP: function(a)
		{
			cpu.r.pc = a; //Set the PC to the address given
		},
		JMP_a: function() {cpu.op.JMP(cpu.f.a_a()); cpu.cc = 3;},
		JMP_i: function() {cpu.op.JMP(cpu.f.i_a()); cpu.cc = 5;},
		
		/*Jump to Subroutine*/
		JSR_a: function()
		{
			//debug("return to: " + (cpu.r.pc+2).toString(16));
			mmu.stackPushWord(cpu.r.pc+1); //Store the PC + 1 (for the 2 byte address in the operator [RTS also adds 1]) on the stack.
			cpu.r.pc = mmu.readWord();
			cpu.cc = 6;
			//debug("on stack: " + mmu.ram[cpu.r.s - mmu.ram_start + 2].toString(16) + ", " + mmu.ram[cpu.r.s - mmu.ram_start + 1].toString(16));
		},
		
		/*Load Accumulator and X ***Illegal OP*****/
		LAX: function(v)
		{
			cpu.r.a = cpu.r.x = v;
			cpu.f.CHK_ZN(cpu.r.a);
		},
		LAX_z:   function() {cpu.op.LAX(cpu.f.z());  cpu.cc=3;},
		LAX_zy:  function() {cpu.op.LAX(cpu.f.zy()); cpu.cc=4;},
		LAX_a:   function() {cpu.op.LAX(cpu.f.a());  cpu.cc=4;},
		LAX_ix:  function() {cpu.op.LAX(cpu.f.ix()); cpu.cc=6;},
		LAX_iy:  function() {cpu.op.LAX(cpu.f.iy()); cpu.cc+=5;},
		
		
		/*Load Accumulator*/
		LDA: function(v)
		{
			cpu.r.a = v&0xff;
			cpu.f.CHK_ZN(cpu.r.a);
		},
		LDA_im: function() {cpu.op.LDA(cpu.f.im()); cpu.cc=2;},
		LDA_z:  function() {cpu.op.LDA(cpu.f.z());  cpu.cc=3;},
		LDA_zx: function() {cpu.op.LDA(cpu.f.zx()); cpu.cc=4;},
		LDA_a:  function() {cpu.op.LDA(cpu.f.a());  cpu.cc=4;},
		LDA_ax: function() {cpu.op.LDA(cpu.f.ax()); cpu.cc+=4;},
		LDA_ay: function() {cpu.op.LDA(cpu.f.ay()); cpu.cc+=4;},
		LDA_ix: function() {cpu.op.LDA(cpu.f.ix()); cpu.cc=6;},
		LDA_iy: function() {cpu.op.LDA(cpu.f.iy()); cpu.cc+=5;},
		
		/*Load X Register*/
		LDX: function(v)
		{
			cpu.r.x = v&0xff;
			cpu.f.CHK_ZN(cpu.r.x);
		},
		LDX_im: function() {cpu.op.LDX(cpu.f.im()); cpu.cc=2;},
		LDX_z:  function() {cpu.op.LDX(cpu.f.z());  cpu.cc=3;},
		LDX_zy: function() {cpu.op.LDX(cpu.f.zy()); cpu.cc=4;},
		LDX_a:  function() {cpu.op.LDX(cpu.f.a());  cpu.cc=4;},
		LDX_ay: function() {cpu.op.LDX(cpu.f.ay()); cpu.cc+=4;},
		
		/*Load Y Register*/
		LDY: function(v)
		{
			cpu.r.y = v&0xff;
			cpu.f.CHK_ZN(cpu.r.y);
		},
		LDY_im: function() {cpu.op.LDY(cpu.f.im()); cpu.cc=2;},
		LDY_z:  function() {cpu.op.LDY(cpu.f.z());  cpu.cc=3;},
		LDY_zx: function() {cpu.op.LDY(cpu.f.zx()); cpu.cc=4;},
		LDY_a:  function() {cpu.op.LDY(cpu.f.a());  cpu.cc=4;},
		LDY_ax: function() {cpu.op.LDY(cpu.f.ax()); cpu.cc+=4;},
		
		
		/*Shift Right One Bit*/
		LSR: function(a)
		{
			if (a == "a") //If it is the accumulator
			{
				cpu.f.C_w(util.D0_r(cpu.r.a));
				var v = (cpu.r.a >> 1)&255;
				cpu.r.a = v;
			}
			else //Else operate on memory address 'a'
			{
				var v = mmu.r(a);
				cpu.f.C_w(util.D0_r(v));
				v = (v >> 1)&255;
				mmu.w(a, v);
			}
			cpu.f.CHK_ZN(v);
		},
		LSR_im: function() {cpu.op.LSR("a");          cpu.cc = 2;},
		LSR_z:  function() {cpu.op.LSR(cpu.f.z_a());  cpu.cc = 5;},
		LSR_zx: function() {cpu.op.LSR(cpu.f.zx_a()); cpu.cc = 6;},
		LSR_a:  function() {cpu.op.LSR(cpu.f.a_a());  cpu.cc = 6;},
		LSR_ax: function() {cpu.op.LSR(cpu.f.ax_a()); cpu.cc = 7;},
		
		
		/*No Operation*/
		NOP_im: function() {cpu.cc = 2;},
		NOP_z:	function() {cpu.f.z(); cpu.cc = 3;}, //Illegal NOP
		
		/*Or Memory With Accumulator*/
		ORA: function(v)
		{
			cpu.r.a |= v;
			cpu.f.CHK_ZN(cpu.r.a);
		},
		ORA_im: function() {cpu.op.ORA(cpu.f.im()); cpu.cc = 2;},
		ORA_z:  function() {cpu.op.ORA(cpu.f.z());  cpu.cc = 3;},
		ORA_zx: function() {cpu.op.ORA(cpu.f.zx()); cpu.cc = 4;},
		ORA_a:  function() {cpu.op.ORA(cpu.f.a());  cpu.cc = 4;},
		ORA_ax: function() {cpu.op.ORA(cpu.f.ax()); cpu.cc+= 4;},
		ORA_ay: function() {cpu.op.ORA(cpu.f.ay()); cpu.cc+= 4;},
		ORA_ix: function() {cpu.op.ORA(cpu.f.ix()); cpu.cc = 6;},
		ORA_iy: function() {cpu.op.ORA(cpu.f.iy()); cpu.cc+= 5;},
		
		
		/*Push Accumulator*/
		PHA_im: function() {mmu.stackPush(cpu.r.a); cpu.cc = 3;},
		
		
		/*Push Processor Status*/
		PHP_im: function() {mmu.stackPush(cpu.r.p); cpu.cc = 3;},
		
		
		/*Pull Accumulator*/
		PLA_im: function() {cpu.r.a = mmu.stackPop(); cpu.f.CHK_ZN(cpu.r.a); cpu.cc = 4;},
		
		
		/*Push Processor Status*/
		PLP_im: function() {cpu.r.p = mmu.stackPop(); cpu.cc = 4;},
		
		
		/*Rotate Left*/
		ROL: function(a)
		{
			if (a == "a")
			{
				var v_old = cpu.r.a;
				var v_new = cpu.r.a = (cpu.r.a << 1) + cpu.f.C_r();
			}
			else
			{
				var v_old = mmu.r(a);
				var v_new = (v_old << 1) + cpu.f.C_r();
				mmu.w(a, v_new);
			}
			
			cpu.f.C_w(util.D7_r(v_old));
			cpu.f.CHK_ZN(v_new);
		},
		ROL_im: function() {cpu.op.ROL("a");          cpu.cc = 2;},
		ROL_z:  function() {cpu.op.ROL(cpu.f.z_a());  cpu.cc = 5;},
		ROL_zx: function() {cpu.op.ROL(cpu.f.zx_a()); cpu.cc = 6;},
		ROL_a:  function() {cpu.op.ROL(cpu.f.a_a());  cpu.cc = 6;},
		ROL_ax: function() {cpu.op.ROL(cpu.f.ax_a()); cpu.cc = 7;},
				
		/*Rotate Right*/
		ROR: function(a)
		{
			if (a == -1)
			{
				var v_old = cpu.r.a;
				var v_new = cpu.r.a = (cpu.r.a >> 1) + (cpu.f.C_r() * 0x80);
			}
			else
			{
				var v_old = mmu.r(a);
				var v_new = (v_old >> 1) + (cpu.f.C_r() * 0x80);
				mmu.w(a, v_new);
			}
			cpu.f.C_w(util.D0_r(v_old));
			cpu.f.CHK_ZN(v_new);
		},
		ROR_im: function() {cpu.op.ROR(-1);           cpu.cc = 2;},
		ROR_z:  function() {cpu.op.ROR(cpu.f.z_a());  cpu.cc = 5;},
		ROR_zx: function() {cpu.op.ROR(cpu.f.zx_a()); cpu.cc = 6;},
		ROR_a:  function() {cpu.op.ROR(cpu.f.a_a());  cpu.cc = 6;},
		ROR_ax: function() {cpu.op.ROR(cpu.f.ax_a()); cpu.cc = 7;},
		
		
		/*Return from Interrupt*/
		RTI_im: function() {cpu.r.p = mmu.stackPop(); cpu.r.pc = mmu.stackPopWord(); cpu.cc=6;},
		
		
		/*Return from Subroutine*/
		RTS_im: function() 
		{
			cpu.r.pc = mmu.stackPopWord() + 1; cpu.cc = 6; 
			//debug("returning to: " + cpu.r.pc.toString(16));
		},
		
		
		/*Subtract with Carry*/
		SBC: function(v)
		{
			
			if (cpu.f.D_r())
			{
				var v1 = util.fromBCD(cpu.r.a);
				var v2 = util.fromBCD(v);
				var r = v1 - v2 - !cpu.f.C_r();
				
				cpu.r.a = util.toBCD(Math.abs(r)%100);
				
			}
			else
			{
				//var v1 = util.decimal(cpu.r.a);
				//var v2 = util.decimal(v);
				//var r = v1 - v2 - !cpu.f.C_r();
				
				//var r = v1 - v2 - 1 + cpu.f.C_r();
				
				//if (v&
				
				var r = 0xff + cpu.r.a - v + cpu.f.C_r();
				
				 if(r < 0x100) 
				 {
				  cpu.f.C_w(0);
				  cpu.f.V_w(!(r < 0x80));
				} 
				else 
				{
				  cpu.f.C_w(1);
				  cpu.f.V_w(!(r > 0x180));
				}
				
				//debug(v1 + "(" + cpu.r.a + ") - " + v2 + "(" + v + ") + " + cpu.f.C_r() + " - 1 = " + r + "(" + util.twosCom(r) + ")");
				
				//cpu.r.a = util.twosCom(r);
				
				cpu.r.a = r&0xff;
			}
			
			//cpu.f.C_w(((v2 + !cpu.f.C_r()) > v1));
			//cpu.f.C_w((v2 > v1));
			cpu.f.CHK_ZN(cpu.r.a);
			//cpu.f.V_w(((r < 0 && cpu.r.a < 128) || (r > 0 && cpu.r.a > 127)));
		},
		SBC_im: function() {cpu.op.SBC(cpu.f.im()); cpu.cc = 2;},
		SBC_z:  function() {cpu.op.SBC(cpu.f.z());  cpu.cc = 3;},
		SBC_zx: function() {cpu.op.SBC(cpu.f.zx()); cpu.cc = 4;},
		SBC_am: function() {cpu.op.SBC(cpu.f.a());  cpu.cc = 4;},
		SBC_ax: function() {cpu.op.SBC(cpu.f.ax()); cpu.cc+= 4;},
		SBC_ay: function() {cpu.op.SBC(cpu.f.ay()); cpu.cc+= 4;},
		SBC_ix: function() {cpu.op.SBC(cpu.f.ix()); cpu.cc = 6;},
		SBC_iy: function() {cpu.op.SBC(cpu.f.iy()); cpu.cc+= 5;},
		
		
		/*Set Carry Flag*/
		SEC_im: function() {cpu.f.C_w(1); cpu.cc = 2;},
		
		/*Set Decimal Flag*/
		SED_im: function() {cpu.f.D_w(1); cpu.cc = 2;},
		
		/*Set Interrupt Disable*/
		SEI_im: function() {cpu.f.I_w(1); cpu.cc = 2;},
		
		
		/*Store Accumulator*/
		STA:    function(a) {mmu.w(a, cpu.r.a);},
		STA_z:  function()  {cpu.op.STA(cpu.f.z_a());  cpu.cc = 3;},
		STA_zx: function()  {cpu.op.STA(cpu.f.zx_a()); cpu.cc = 4;},
		STA_a:  function()  {cpu.op.STA(cpu.f.a_a());  cpu.cc = 4;},
		STA_ax: function()  {cpu.op.STA(cpu.f.ax_a()); cpu.cc = 5;},
		STA_ay: function()  {cpu.op.STA(cpu.f.ay_a()); cpu.cc = 5;},
		STA_ix: function()  {cpu.op.STA(cpu.f.ix_a()); cpu.cc = 6;},
		STA_iy: function()  {cpu.op.STA(cpu.f.iy_a()); cpu.cc = 6;},
		
		/*Store X Register*/
		STX:    function(a) {mmu.w(a, cpu.r.x);},
		STX_z:  function()  {cpu.op.STX(cpu.f.z_a());  cpu.cc = 3;},
		STX_zy: function()  {cpu.op.STX(cpu.f.zy_a()); cpu.cc = 4;},
		STX_a:  function()  {cpu.op.STX(cpu.f.a_a());  cpu.cc = 4;},
		
		/*Store Y Register*/
		STY:    function(a) {mmu.w(a, cpu.r.y);},
		STY_z:  function()  {cpu.op.STY(cpu.f.z_a());  cpu.cc = 3;},
		STY_zx: function()  {cpu.op.STY(cpu.f.zx_a()); cpu.cc = 4;},
		STY_a:  function()  {cpu.op.STY(cpu.f.a_a());  cpu.cc = 4;},
		
		
		/*Transfer Accumulator to X*/
		TAX_im: function() {cpu.r.x = cpu.r.a; cpu.f.CHK_ZN(cpu.r.a); cpu.cc=2;},
		
		/*Transfer Accumulator to Y*/
		TAY_im: function() {cpu.r.y = cpu.r.a; cpu.f.CHK_ZN(cpu.r.a); cpu.cc=2;},
		
		/*Transfer Stack Pointer to X*/
		TSX_im: function() {cpu.r.x = cpu.r.s; cpu.f.CHK_ZN(cpu.r.s); cpu.cc=2;},
		
		/*Transfer X to Accumulator*/
		TXA_im: function() {cpu.r.a = cpu.r.x; cpu.f.CHK_ZN(cpu.r.a); cpu.cc=2;},
		
		/*Transfer X to Stack Pointer*/
		TXS_im: function() {cpu.r.s = cpu.r.x; cpu.cc=2;},
		
		/*Transfer Y to Accumulator*/
		TYA_im: function() {cpu.r.a = cpu.r.y; cpu.f.CHK_ZN(cpu.r.a); cpu.cc=2;},
	},
	
	
}

/*Opcode Map*/
cpu.map =
[
	/*0*/
	cpu.op.BRK_im,
	cpu.op.ORA_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.NOP_z,
	cpu.op.ORA_z,
	cpu.op.ASL_z,
	cpu.op.XX,
	cpu.op.PHP_im,
	cpu.op.ORA_im,
	cpu.op.ASL_im,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ORA_a,
	cpu.op.ASL_a,
	cpu.op.XX,
	
	/*1*/
	cpu.op.BPL_rel,
	cpu.op.ORA_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ORA_zx,
	cpu.op.ASL_zx,
	cpu.op.XX,
	cpu.op.CLC_im,
	cpu.op.ORA_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ORA_ax,
	cpu.op.ASL_ax,
	cpu.op.XX,
	
	/*2*/
	cpu.op.JSR_a,
	cpu.op.AND_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.BIT_z,
	cpu.op.AND_z,
	cpu.op.ROL_z,
	cpu.op.XX,
	cpu.op.PLP_im,
	cpu.op.AND_im,
	cpu.op.ROL_im,
	cpu.op.XX,
	cpu.op.BIT_a,
	cpu.op.AND_a,
	cpu.op.ROL_a,
	cpu.op.XX,
	
	/*3*/
	cpu.op.BMI_rel,
	cpu.op.AND_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.AND_zx,
	cpu.op.ROL_zx,
	cpu.op.XX,
	cpu.op.SEC_im,
	cpu.op.AND_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.AND_ax,
	cpu.op.ROL_ax,
	cpu.op.XX,
	
	/*4*/
	cpu.op.RTI_im,
	cpu.op.EOR_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.EOR_z,
	cpu.op.LSR_z,
	cpu.op.XX,
	cpu.op.PHA_im,
	cpu.op.EOR_im,
	cpu.op.LSR_im,
	cpu.op.XX,
	cpu.op.JMP_a,
	cpu.op.EOR_a,
	cpu.op.LSR_a,
	cpu.op.XX,
	
	/*5*/
	cpu.op.BVC_rel,
	cpu.op.EOR_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.EOR_zx,
	cpu.op.LSR_zx,
	cpu.op.XX,
	cpu.op.CLI_im,
	cpu.op.EOR_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.EOR_ax,
	cpu.op.LSR_ax,
	cpu.op.XX,
	
	/*6*/
	cpu.op.RTS_im,
	cpu.op.ADC_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ADC_z,
	cpu.op.ROR_z,
	cpu.op.XX,
	cpu.op.PLA_im,
	cpu.op.ADC_im,
	cpu.op.ROR_im,
	cpu.op.XX,
	cpu.op.JMP_i,
	cpu.op.ADC_a,
	cpu.op.ROR_a,
	cpu.op.XX,
	
	/*7*/
	cpu.op.BVS_rel,
	cpu.op.ADC_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ADC_zx,
	cpu.op.ROR_zx,
	cpu.op.XX,
	cpu.op.SEI_im,
	cpu.op.ADC_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.ADC_ax,
	cpu.op.ROR_ax,
	cpu.op.XX,
	
	/*8*/
	cpu.op.XX,
	cpu.op.STA_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.STY_z,
	cpu.op.STA_z,
	cpu.op.STX_z,
	cpu.op.XX,
	cpu.op.DEY_im,
	cpu.op.XX,
	cpu.op.TXA_im,
	cpu.op.XX,
	cpu.op.STY_a,
	cpu.op.STA_a,
	cpu.op.STX_a,
	cpu.op.XX,
	
	/*9*/
	cpu.op.BCC_rel,
	cpu.op.STA_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.STY_zx,
	cpu.op.STA_zx,
	cpu.op.STX_zy,
	cpu.op.XX,
	cpu.op.TYA_im,
	cpu.op.STA_ay,
	cpu.op.TXS_im,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.STA_ax,
	cpu.op.XX,
	cpu.op.XX,
	
	/*A*/
	cpu.op.LDY_im,
	cpu.op.LDA_ix,
	cpu.op.LDX_im,
	cpu.op.LAX_ix,
	cpu.op.LDY_z,
	cpu.op.LDA_z,
	cpu.op.LDX_z,
	cpu.op.LAX_z,
	cpu.op.TAY_im,
	cpu.op.LDA_im,
	cpu.op.TAX_im,
	cpu.op.XX,
	cpu.op.LDY_a,
	cpu.op.LDA_a,
	cpu.op.LDX_a,
	cpu.op.LAX_a,
	
	/*B*/
	cpu.op.BCS_rel,
	cpu.op.LDA_iy,
	cpu.op.XX,
	cpu.op.LAX_iy,
	cpu.op.LDY_zx,
	cpu.op.LDA_zx,
	cpu.op.LDX_zy,
	cpu.op.LAX_zy,
	cpu.op.CLV_im,
	cpu.op.LDA_ay,
	cpu.op.TSX_im,
	cpu.op.XX,
	cpu.op.LDY_ax,
	cpu.op.LDA_ax,
	cpu.op.LDX_ay,
	cpu.op.XX,
	
	/*C*/
	cpu.op.CPY_im,
	cpu.op.CMP_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.CPY_z,
	cpu.op.CMP_z,
	cpu.op.DEC_z,
	cpu.op.XX,
	cpu.op.INY_im,
	cpu.op.CMP_im,
	cpu.op.DEX_im,
	cpu.op.XX,
	cpu.op.CPY_a,
	cpu.op.CMP_a,
	cpu.op.DEC_a,
	cpu.op.XX,
	
	/*D*/
	cpu.op.BNE_rel,
	cpu.op.CMP_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.CMP_zx,
	cpu.op.DEC_zx,
	cpu.op.XX,
	cpu.op.CLD_im,
	cpu.op.CMP_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.CMP_ax,
	cpu.op.DEC_ax,
	cpu.op.XX,
	
	/*E*/
	cpu.op.CPX_im,
	cpu.op.SBC_ix,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.CPX_z,
	cpu.op.SBC_z,
	cpu.op.INC_z,
	cpu.op.XX,
	cpu.op.INX_im,
	cpu.op.SBC_im,
	cpu.op.NOP_im,
	cpu.op.XX,
	cpu.op.CPX_a,
	cpu.op.SBC_a,
	cpu.op.INC_a,
	cpu.op.XX,
	
	/*F*/
	cpu.op.BEQ_rel,
	cpu.op.SBC_iy,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.SBC_zx,
	cpu.op.INC_zx,
	cpu.op.XX,
	cpu.op.SED_im,
	cpu.op.SBC_ay,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.XX,
	cpu.op.SBC_ax,
	cpu.op.INC_ax,
	cpu.op.XX
	
];
