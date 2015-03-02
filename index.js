  /*** Niffler ZAutomation module ****************************************

Version: 1.0.0
(c) Jens Troest, 2015

-------------------------------------------------------------------------------
Author: Jens Troest
Description:
    This module executes NIF bindings for devices incapable of sending unsolicited reports

******************************************************************************/

// ----------------------------------------------------------------------------
// --- Class definition, inheritance and setup
// ----------------------------------------------------------------------------

function Niffler (id, controller) {
    // Call superconstructor first (AutomationModule)
    Niffler.super_.call(this, id, controller);
}

inherits(Niffler, AutomationModule);

//Static declations
_module = Niffler;
Niffler.binderMethods;
// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Niffler.prototype.init = function (config) {
    Niffler.super_.prototype.init.call(this, config);

    var self = this;
    this.binderMethods = [];//Hold methods used to bind
    console.log("Niffler: init");

    //The boot sequence of ZWay is not well defined.
    //This method is used to detect device creation on boot and niffle any device on the list
    this.deviceCreated = function (vDev) {
	self.niffleDevice(vDev.id);
    };
    //Register for events
    this.controller.devices.on("created", this.deviceCreated);

    //Niffle all listed devices on each start, this will handle restarts after boot
    this.config.sourceDevices.forEach(function(dev) {
    	self.niffleDevice(dev);
    });
};

Niffler.prototype.stop = function () {

    console.log("Niffler: stop() called");
    //Unnifle any niffled devices
    if(this.config.sourceDevices.length) {
	this.unNiffle(this.config.sourceDevices);
	this.binderMethods = [];
    }
    //Unregister for device creation
    this.controller.off("ZWave.register", this.deviceCreated);
    Niffler.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

//Do the actual niffle on the physical device
Niffler.prototype.niffle = function(index) {

    if ( global.ZWave && !isNaN(index) ) {
	var binderMethod =  function(type) {
	    if (type == 0x41 /* Updated | PhantomUpdate */)
		zway.devices[index].Basic.Get();
	};
	this.binderMethods.push( [index,binderMethod] );//Add method to array for later unbind
	zway.devices[index].data.nodeInfoFrame.bind(binderMethod);
    }
};

Niffler.prototype.unNiffle = function(UNList) {
    var self = this;
    if(UNList.length)
    {
	console.log("Niffler:: unNiffling existing devices");
	UNList.forEach(function(dev) {
	    var index = self.getDeviceIndex(dev);
	    var unBinder = null;
	    for(n=0; n<self.binderMethods.length; n++) {
		if(self.binderMethods[n][0] === index) {
		    unBinder = self.binderMethods[n][1];
		    break;
		}
	    }
	    console.log("Niffler:: unNiffling ", dev);
	    if (global.ZWave && !isNaN(index) ) {
		zway.devices[index].data.nodeInfoFrame.unbind(unBinder);	    
	    }
	});
    }
};

//Retrieve the index of the physical device. null if not found
Niffler.prototype.getDeviceIndex = function(vdevid) {
	var str = vdevid;
	console.log("Niffler: getdeviceindex: ", str);

	var res = str.split("_");
	if(res.length != 3 && str[0] != "ZWayVDev")
	    return null;
	return res[2].split("-")[0];
};

//Niffle a device if it is in the source list.
//vdevid is the virtual device id and index is the physical device location
Niffler.prototype.niffleDevice = function(vdevid) {

    var index = this.getDeviceIndex(vdevid);
    if(null === index) return;

    var sdev;
    //Should this device be niffled? Look for it in the source list
    this.config.sourceDevices.forEach(function(adev) {
	if(adev === vdevid) {
	    sdev = adev;
	    return;
	}
    });
    if(sdev) {//We have a match
	//Niffle this device
	console.log("Niffler:: Niffling device ",vdevid," at index ",index);
	this.niffle(index);
    }
};
