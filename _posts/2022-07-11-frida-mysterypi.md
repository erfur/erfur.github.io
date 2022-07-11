---
layout: post
title: Adding new features to an old game using Frida
tags: re frida
---

I've been interested in dynamic instrumentation for a long while now. This
interest however, has not been turned into practical experience until very
recently; when I finally decided to use Frida seriously on a project. I wanted
explore what Frida had to offer, while working on a project that I can showcase.

The opportunity presented itself when I got my hands on a game that I played in
my childhood: Mystery PI from Popcap games. It's a puzzle game where the player
finds listed objects hidden in plain sight. It was a lot of fun back then,
except that I couldn't progress through levels because I didn't understand most
of the words. This time I was able to breeze through them and after I completed
the game I wanted to take a look under the hood.

I already wanted to approach it as a project, so I set myself up with some
goals. The game doesn't allow resizing in windowed mode and its fixed at a a
800x600 resolution, so I wanted to enable resizing in windowed mode as the first
step. Of course the next step was to enable more "hints" :). Then finally, I
wanted to implement some sort of multiplayer feature just for the kick of it.

As of writing this, the first goal is achieved. In this first post of (what I
think is going to be) three, I'll walk through the basics of the game's
implementation and how I instrumented it with Frida to scale its window.

## Mystery PI

