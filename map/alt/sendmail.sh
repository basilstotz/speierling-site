#!/bin/sh                                                                                                             

EXITSTATUS="/tmp/backup-stat"
BACKUPLOG="/tmp/msg.txt"

if test "$(cat $EXITSTATUS)" -eq 1; then
    curl -d "text=$(cat $BACKUPLOG|grep FAILED)" -H "Content-Type: application/x-www-form-urlencoded"   -X POST https\
://www.amxa.ch/backup_failed.php
fi


curl -d "text=$(cat $BACKUPLOG)" -H "Content-Type: application/x-www-form-urlencoded"   -X POST https://www.amxa.ch/b\
ackup.php

exit

