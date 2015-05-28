#!/usr/bin/env bash

# fail hard
set -e

LOCAL_DIR=~/Movies
WORKSTATION_DIR="steven@10.3.2.2:/Volumes/proc-space/_todo/video"


rsync -avz --progress --remove-source-files -e ssh ${LOCAL_DIR} ${WORKSTATION_DIR}
