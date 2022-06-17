#!/bin/bash

sudo docker run \
    --rm \
    --volume="$PWD:/srv/jekyll" \
    -p 4000:4000 \
    --network=host \
    -it \
    --dns 1.1.1.1 \
    jekyll/jekyll \
    /bin/bash -c "bundle update; jekyll serve"
