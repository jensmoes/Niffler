  /* global global, zway */

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
	self.niffleDevice(vDev);
    };
    this.deviceDeleted = function (vDev) {
        self.unNiffle([vDev.id]);
    };
    //Register for events
    this.controller.devices.on('created', this.deviceCreated);
    this.controller.devices.on('removed', this.deviceDeleted);
    

    //Niffle all listed devices on each start, this will handle restarts after boot
    this.config.sourceDevices.forEach(function(devId) {
    	self.niffleDevice(this.controller.devices.get(devId));
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
    this.controller.devices.off('created',this.deviceCreated);
    this.controller.devices.off('removed',this.deviceDeleted);
    Niffler.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

//Do the actual niffle on the physical device
Niffler.prototype.niffle = function(virtualDevice) {

    var index = this.getDeviceIndex(virtualDevice.id);
    if ( global.ZWave && !isNaN(index) ) {
	var binderMethod;
        var deviceType = virtualDevice.get('deviceType');
        if(deviceType === 'doorlock'){
            binderMethod = function(type) {
                   console.log("Niffler","doorlock alarm event");
                   zway.devices[index].DoorLock.Get(); //This call will poll and update the zway UI. Useful since most alarms are lock/unlock events
                };
            zway.devices[index].Alarm.data.V1event.bind(binderMethod);
        }else{
            binderMethod = function(type) {
                zway.devices[index].Basic.Get();
            };            
            zway.devices[index].data.nodeInfoFrame.bind(binderMethod);
        }
	this.binderMethods.push( [index,binderMethod] );//Add method to array for later unbind
    }
};

Niffler.prototype.unNiffle = function(UNList) {
    var self = this;
    if(UNList.length)
    {
	console.log("Niffler: unNiffling existing devices");
	UNList.forEach(function(vDevId) {
	    var index = self.getDeviceIndex(vDevId);
	    var unBinder = null;
	    for(n=0; n<self.binderMethods.length; n++) {
		if(self.binderMethods[n][0] === index) {
		    unBinder = self.binderMethods[n][1];
		    break;
		}
	    }
	    console.log("Niffler: unNiffling ", vDevId);
	    if (global.ZWave && !isNaN(index) && unBinder !== null ) {
                if(this.controller.devices.get(vDevId).get('deviceType') === 'doorlock') {
                    console.log("Niffler: unNiffling doorlock");
                    zway.devices[index].Alarm.data.V1event.unbind(unBinder);
                } else {
                    zway.devices[index].data.nodeInfoFrame.unbind(unBinder);                                    
                }
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
//vdevid is the virtual device and index is the physical device location
Niffler.prototype.niffleDevice = function(vdev) {

    if(!vdev) return;
    var sdev;
    //Should this device be niffled? Look for it in the source list
    this.config.sourceDevices.forEach(function(adev) {
	if(adev === vdev.id) {
	    sdev = adev;
	    return;
	}
    });
    if(sdev) {//We have a match
	//Niffle this device
	console.log("Niffler: Niffling device ",vdev.id);
	this.niffle(vdev);
    }
};
