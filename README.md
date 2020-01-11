DRAGON MANAGER
=======

This project contains the UI and logic for reading data files from War Dragons. The code is based on nodejs for the backend, so a knowledge in that is required.

* Code is working, but could be written nicer. Most part of it was written on an airplace during a long return flight to South Africa.
* Please fork this repository, as I do not intend to do more work on it, or to support it.
* Datafiles from the game (get from released APK files, or fetch live updates using ADB, see commands below) should be dumped in the *datafile* directory. to manually override datainfo, see the files in *datafiles_overlay*
* No changes to the code should be required when updating the datafiles. unless something changes in the datafiles, e.g. new features like the tier discount etc.
* Few settings in the .env files.
  * Version numbers are fetched from here.
  * Also the URL of the backend is fetched from here, to avoid having it hardcoded in the code.
  * The node port is set in the env file also. Port 80 should be used on live servers, and default is port 3000.
* To start the service, install nodejs and run: *node app.js*
* When service is running, you can access Dragon Manager from : http://localhost:3000
* Should be run with a node manager like PM2 on the live server, to make sure its restarted etc. The scripts in package.json is based on PM2.
* Same process as above, when running on a live server.

---
ADB
=

To fetch datafiles from an Android device, it has to be rooted. Use the google ADB tool as shown below. Will fetch all WD files from device. This is required to get data from the game, between PG release, e.g. when they release live updates etc.

`adb root`

`adb pull /data/data/com.pocketgems.android.dragon`

---
MarkDown instructions: (https://en.wikipedia.org/wiki/Markdown)
