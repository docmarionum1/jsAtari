jsAtari
=============

An Atari 2600 emulator written in javascript. 


Status
--------------------

* The CPU is fully implemented (barring some illegal operators) and largely tested.  
* The TIA is largely implemented
	*Graphics are done (Playing Field, Players, Missiles, Ball)
	*Input isn't implemented
	*Collision isn't implemented
* The PIA (Timers, input) hasn't been started
* The emulator is not very efficient yet, running 10-20 FPS, depending on browser.  The Atari 2600 runs at 60 FPS.  Most of the time is spent on the TIA because the screen must be drawn pixel-by-pixel.  Not yet sure how I'm going to be able to drastically improve performance.  


Use
--------------------

To run a ROM:

Create a canvas element:

	<canvas id="tv" width="160" height="192" style="width:640;height:480"></canvas>
   
The canvas width and height should be identical to that, 160x192.  The css width and height can be anything, and just make the image appear as it would on a 4x3 TV.

Then put the following commands in a script:  
   
	var debugging = false; //Or true, to run with debugging.
	var autorun = true; //Or false, to step through each cycle manually
	
	mmu.__init__("rom.bin", debugging);
	tia.__init__(document.getElementById("tv"), debugging);
	cpu.start(autorun, debugging);
   
   
If running with debugging, autorun should probably be switched off.  Debugging includes log writes and a slower drawing method.  Firefox will probably freeze if debugging and autorun are both on.

Roms are loaded via Andy GunPyo Na's Binary File Reader which uses Ajax, so you'll need to have a server running to load the ROM.  Just opening the html file with your browser won't work (at least it didn't for me.).  