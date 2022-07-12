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
my childhood: Mystery PI from SpinTop Games (and released by PopCap Games). It's
a puzzle game where the player finds listed objects hidden in a given frame. It
was a lot of fun back then, except that I couldn't progress through levels
because I didn't understand most of the words. This time I was able to breeze
through them and after I completed the game I wanted to take a look under the
hood.

{% include aligner.html images="/frida-mysterypi/mpi1.png" width=100 %}

I already wanted to approach it as a project, so I set myself up with some
goals. The game doesn't allow resizing in windowed mode and its fixed at a a
800x600 resolution, so I wanted to enable resizing in windowed mode as the first
step. Of course the next step was to enable more "hints" :). Then finally, I
wanted to implement some sort of multiplayer feature just for the kick of it.

As of writing this, the first goal is achieved. In this first post of (what I
think is going to be) three, I'll walk through the basics of the game's
implementation and how I instrumented it with Frida to scale its window.

## Mystery PI

Initial analysis (quickly skimming through strings) shows that the game is built
on SDL. Since the game is released in 2007, it is a strong possibility that its
not SDL2 but an older version. Later analysis shows that the functions and
offsets align with those in SDL version 1.2 (or older).

First thing to notice is that there are almost no dependencies. Most of the
libraries are statically linked and stripped, making the inital phase a bit
hard. I'm also guilty of not having used a plugin to automatically name library
functions. Though it wasn't that bad of a nuisance to go through since most of
SDL functions reference at least one error string. I named them manually as I
went along.

The game comes with a library named `Resources.dll`. Opening it up in GHIDRA
revealed pretty much every asset the game uses. It includes images, sounds,
fonts and even some xml files that I later learned is in MSL (Mapping
Specification Language) format. These files are used as plaintext databases and
every level