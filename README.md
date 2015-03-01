# Niffler
This is a module for the Z-Way HA system using the RazBerry Z-Wave module running on a Raspberry Pi.

Some switches such as the GE/Jasco and Leviton does not send a command when pressed locally. As a result the home automation system does not always reflect the current state of the switch.

This module binds the NodeInfoFrame to a Basic.Get() command class.

Put the folder in the automation/modules or userModules directory and restart your Z-Way server:
sudo /etc/init.d/z-way-server restart

