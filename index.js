  /*** Niffler ZAutomation module ****************************************

Version: 1.0.0
(c) Z-Wave.Me, 2013

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

_module = Niffler;

Niffler.isStarted = false;
Niffler.niffledDevices;
// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

Niffler.prototype.init = function (config) {
    // Call superclass' init (this will process config argument and so on)
    Niffler.super_.prototype.init.call(this, config);

    var self = this;
    console.log("JENS init");

    this.niffledDevices =  this.config.sourceDevices;
    console.log("JENS niffledDevices ", this.niffledDevices.length);

    this.deviceCreated = function (vDev) {
	var deviceId = self.getDeviceIndex(vDev.id);
	if(null === deviceId) return;
	console.log("JENS deviceID:",deviceId);
	self.niffleDevice(vDev.id, deviceId);
	self.isStarted = true;
    };
    
    this.controller.devices.on("created", this.deviceCreated);
    console.log("JENS isStarted", this.isStarted);
//    if(this.isStarted) {
    console.log("JENS just do it");
    this.config.sourceDevices.forEach(function(dev) {
    	var index = self.getDeviceIndex(dev);
    	if(index != null) {
    	    self.niffleDevice(dev, index);
    	}
    });
//	}

	//Update niffles a change has occured
 //   }

};

Niffler.prototype.start = function () {
    console.log("JENS start() ");
    Niffler.super_.prototype.start.call(this);
};
Niffler.prototype.stop = function () {

    console.log("JENS stop() called");
    if(this.niffledDevices.length) {
	console.log("JENS niffledDevices before ", this.niffledDevices.length);
	this.unNiffle(this.niffledDevices);
	this.niffledDevices =  this.config.sourceDevices;
	console.log("JENS niffledDevices after ", this.niffledDevices.length);
    }
    
    this.controller.off("ZWave.register", this.deviceCreated);
    Niffler.super_.prototype.stop.call(this);
};

// Niffler.prototype.saveConfig = function (config) {
//     console.log("Niffler saveConfig() called");

//     Niffler.super_.prototype.saveConfig.call(config);
// }

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

Niffler.prototype.binder = function(type) {
    if (type == 0x41 /* Updated | PhantomUpdate */)
	zway.devices[deviceId].Basic.Get();
};
Niffler.prototype.niffle = function(index) {
    var binderMethod =  function(type) {
    if (type == 0x41 /* Updated | PhantomUpdate */)
	zway.devices[index].Basic.Get();
    };
    zway.devices[index].data.nodeInfoFrame.bind(binderMethod);
};

Niffler.prototype.unNiffle = function(UNList) {
    var self = this;
    if(UNList.length)
    {
	console.log("JENS: unNiffling existing devices");
	UNList.forEach(function(dev) {
	    var index = self.getDeviceIndex(dev);
	    console.log("JENS: unNiffling ", dev);
	    zway.devices[index].data.nodeInfoFrame.unbind(this.binderMethod);	    
	}
		      );
    }
};

Niffler.prototype.getDeviceIndex = function(vdevid) {
	var str = vdevid;
	console.log("JENS getdeviceindex: ", str);

	var res = str.split("_");
	if(res.length != 3 && str[0] != "ZWayVDev")
	    return null;
	return res[2].split("-")[0];
};

Niffler.prototype.niffleDevice = function(vdevid, index) {
    	if (global.ZWave && !isNaN(index) ) {
            for (var name in global.ZWave) {
		var realDevices = global.ZWave[name].zway.devices;
//		console.log("JENS controller is named ", name.toString());
//		console.log("JENS has devices: ", realDevices.length);
		
		var sdev;
		this.config.sourceDevices.forEach(function(adev) {
//		    console.log("JENS sDev: ", adev);
//		    console.log("JENS vdev: ", vdevid);
		    if(adev === vdevid) {
			sdev = adev;
			return;
		    }
		});
		if(sdev) {
		    console.log("JENS sDev: ", sdev);
		    console.log("JENS vDev: ", vdevid);
		    if(vdevid === sdev) {//Is this device in our source list?
			//Niffle this device
			console.log("JENS: Niffling device ",vdevid," at index ",index);
			this.niffle(index);
		    }
		}

            }
	}
};
