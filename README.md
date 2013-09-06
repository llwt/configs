--Home Config--

---OSX---

----Making Environment Variables Stick----

set the environment variables from /etc/launchd.conf, like so:
````
setenv PATH /opt/local/bin:/opt/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin
````
launchd.conf is executed automatically when you reboot.

If you want these changes to take effect now, you should use this command to reprocess
launchctl.conf
````
egrep -v '^\s*#' /etc/launchd.conf | launchctl
````
You can find out more about launchctl and how it loads launchd.conf with the command man
launchctl.
