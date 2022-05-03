#!/bin/bash

sudo docker run \
    --rm \
    --volume="$PWD:/srv/jekyll" \
    -p 4000:4000 \
    -it \
    --dns 1.1.1.1 \
    jekyll/jekyll \
    jekyll serve
